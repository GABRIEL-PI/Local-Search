import csv
import io
import json
import os
import time
import logging
from datetime import datetime, timezone
from typing import Optional

import httpx

from app.workers.celery_app import celery_app
from app.workers.scraper_tasks import get_sync_db

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, name="app.workers.geogrid_tasks.run_geogrid", max_retries=1)
def run_geogrid(self, geogrid_id: int):
    """Orchestrator — enfileira fetch_grid_point pra cada ponto pendente."""
    db = get_sync_db()
    try:
        from app.models.geogrid import Geogrid, GeogridPoint

        geo = db.query(Geogrid).filter(Geogrid.id == geogrid_id).first()
        if not geo:
            return {"error": "geogrid not found"}

        points = (
            db.query(GeogridPoint)
            .filter(GeogridPoint.geogrid_id == geogrid_id, GeogridPoint.status == "pendente")
            .all()
        )

        for p in points:
            fetch_grid_point.apply_async(args=[p.id], queue="geogrid")

        return {"geogrid_id": geogrid_id, "queued": len(points)}
    finally:
        db.close()


@celery_app.task(bind=True, name="app.workers.geogrid_tasks.fetch_grid_point", max_retries=2)
def fetch_grid_point(self, point_id: int):
    """Chama o scraper pra um ponto específico, mede a posição do lead na resposta."""
    db = get_sync_db()
    try:
        from app.models.geogrid import Geogrid, GeogridPoint
        from app.models.lead import Lead

        point = db.query(GeogridPoint).filter(GeogridPoint.id == point_id).first()
        if not point:
            return {"error": "point not found"}

        geo = db.query(Geogrid).filter(Geogrid.id == point.geogrid_id).first()
        if not geo:
            return {"error": "geogrid not found"}

        lead = db.query(Lead).filter(Lead.id == geo.lead_id).first()
        if not lead:
            point.status = "erro"
            point.erro_descricao = "lead nao encontrado"
            db.commit()
            return {"error": "lead not found"}

        point.status = "rodando"
        db.commit()

        try:
            results = _scrape_point(
                keyword=geo.keyword,
                lat=point.lat,
                lng=point.lng,
                zoom=geo.zoom,
                radius=geo.radius,
            )
        except Exception as exc:
            point.status = "erro"
            point.erro_descricao = str(exc)[:500]
            db.commit()
            _maybe_finalize(db, geo.id)
            raise self.retry(exc=exc, countdown=30)

        rank = None
        place_id = (lead.place_id or "").strip()
        nome_norm = (lead.nome or "").strip().lower()

        for i, r in enumerate(results, start=1):
            if place_id and r.get("place_id") and r["place_id"] == place_id:
                rank = i
                break
            if nome_norm and r.get("title") and nome_norm == r["title"].strip().lower():
                rank = i
                break

        competitors = [
            {
                "rank": i + 1,
                "title": r.get("title"),
                "place_id": r.get("place_id"),
                "rating": r.get("rating"),
                "reviews": r.get("reviews"),
            }
            for i, r in enumerate(results[:5])
        ]

        point.rank = rank
        point.competitors = competitors
        point.status = "concluido"
        db.commit()

        _maybe_finalize(db, geo.id)

        return {"point_id": point_id, "rank": rank, "results": len(results)}
    finally:
        db.close()


def _maybe_finalize(db, geogrid_id: int):
    from app.models.geogrid import Geogrid, GeogridPoint
    from sqlalchemy import func, case

    geo = db.query(Geogrid).filter(Geogrid.id == geogrid_id).first()
    if not geo:
        return

    counts = (
        db.query(
            func.count(GeogridPoint.id).label("total"),
            func.sum(case((GeogridPoint.status == "concluido", 1), else_=0)).label("done"),
            func.sum(case((GeogridPoint.status == "erro", 1), else_=0)).label("err"),
        )
        .filter(GeogridPoint.geogrid_id == geogrid_id)
        .one()
    )
    total = int(counts.total or 0)
    done = int(counts.done or 0)
    err = int(counts.err or 0)

    geo.pontos_concluidos = done + err
    if (done + err) >= total and total > 0:
        if err == total:
            geo.status = "erro"
            geo.erro_descricao = "todos os pontos falharam"
        else:
            geo.status = "concluido"
        geo.finalizado_em = datetime.now(timezone.utc)
    db.commit()


def _scrape_point(keyword: str, lat: float, lng: float, zoom: int, radius: int) -> list:
    """Chama o scraper gosom para um ponto geográfico específico."""
    SCRAPER_URL = os.environ.get("SCRAPER_URL", "http://scraper:8080")

    job_data = {
        "name": f"geogrid_{int(time.time() * 1000)}",
        "keywords": [keyword],
        "lang": "pt",
        "depth": 1,
        "max_time": 90,
        "lat": f"{lat:.6f}",
        "lon": f"{lng:.6f}",
        "zoom": zoom,
        "radius": radius,
        "fast_mode": True,
    }

    with httpx.Client(timeout=10) as client:
        resp = client.post(f"{SCRAPER_URL}/api/v1/jobs", json=job_data)
        resp.raise_for_status()
        job_id = resp.json()["id"]

    max_wait = 120
    poll_interval = 4
    elapsed = 0
    status = "working"

    with httpx.Client(timeout=10) as client:
        while elapsed < max_wait:
            time.sleep(poll_interval)
            elapsed += poll_interval
            try:
                resp = client.get(f"{SCRAPER_URL}/api/v1/jobs/{job_id}")
                job_info = resp.json()
                status = job_info.get("Status", "unknown")
                if status != "working":
                    break
            except Exception as e:
                logger.warning(f"[GEOGRID] Poll error: {e}")

        if status == "working":
            raise RuntimeError(f"job timeout after {max_wait}s")

        resp = client.get(f"{SCRAPER_URL}/api/v1/jobs/{job_id}/download")
        resp.raise_for_status()
        csv_content = resp.text

    rows = []
    try:
        reader = csv.DictReader(io.StringIO(csv_content))
        for row in reader:
            rows.append({
                "title": (row.get("title") or "").strip(),
                "place_id": (row.get("place_id") or row.get("data_id") or "").strip(),
                "rating": float(row["review_rating"]) if row.get("review_rating") else None,
                "reviews": int(row["review_count"]) if row.get("review_count") else None,
                "category": (row.get("category") or "").strip(),
            })
    except Exception as e:
        logger.warning(f"[GEOGRID] CSV parse error: {e}")

    return rows
