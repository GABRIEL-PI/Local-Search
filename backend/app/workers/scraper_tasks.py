import asyncio
import json
import os
import re
import time
from datetime import datetime, timezone
from typing import Optional

import logging
from celery import shared_task
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

logger = logging.getLogger(__name__)

from app.core.config import settings
from app.workers.celery_app import celery_app


def get_sync_db():
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    engine = create_engine(settings.SYNC_DATABASE_URL, pool_pre_ping=True)
    SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    return SessionLocal()


@celery_app.task(bind=True, name="app.workers.scraper_tasks.scrape_google_maps", max_retries=2)
def scrape_google_maps(self, session_id: int, cidade: str, categoria: str, limite: int = 50, estado: Optional[str] = None):
    db = get_sync_db()
    try:
        from app.models.lead import SessionScraping, Lead
        from app.services.scraper_service import calculate_lead_score, suggest_domain

        session = db.query(SessionScraping).filter(SessionScraping.id == session_id).first()
        if not session:
            return {"error": "session not found"}

        session.status = "rodando"
        db.commit()

        leads_data = _scrape_with_gosom(cidade, categoria, limite, estado)

        session.leads_encontrados = len(leads_data)
        db.commit()

        saved_count = 0
        for ld in leads_data:
            existing = db.query(Lead).filter(
                Lead.usuario_id == session.usuario_id,
                Lead.nome == ld["nome"],
                Lead.cidade == cidade,
            ).first()

            if existing:
                continue

            domain = suggest_domain(ld["nome"])
            lead = Lead(
                usuario_id=session.usuario_id,
                nome=ld.get("nome", ""),
                categoria=categoria,
                endereco=ld.get("endereco"),
                telefone=ld.get("telefone"),
                whatsapp=ld.get("telefone"),
                email=ld.get("email"),
                horario=ld.get("horario"),
                fotos_count=ld.get("fotos_count", 0),
                rating=ld.get("rating"),
                reviews_count=ld.get("reviews_count", 0),
                tem_site=bool(ld.get("url_site")),
                url_site=ld.get("url_site"),
                dominio_sugerido=domain,
                cidade=cidade,
                estado=estado,
                data_coleta=datetime.now(timezone.utc),
                status="prospectado",
            )
            db.add(lead)
            db.flush()

            lead.lead_score = calculate_lead_score(lead)
            db.add(lead)
            saved_count += 1

            if ld.get("url_site"):
                analyze_site_task.delay(lead.id, ld["url_site"])

        session.leads_salvos = saved_count
        session.status = "concluido"
        session.finalizado_em = datetime.now(timezone.utc)
        db.commit()

        return {"session_id": session_id, "leads_found": len(leads_data), "leads_saved": saved_count}

    except Exception as exc:
        db.rollback()
        session = db.query(SessionScraping).filter(SessionScraping.id == session_id).first()
        if session:
            session.status = "erro"
            session.erro_descricao = str(exc)
            session.finalizado_em = datetime.now(timezone.utc)
            db.commit()
        raise self.retry(exc=exc, countdown=60)
    finally:
        db.close()


def _scrape_with_gosom(cidade: str, categoria: str, limite: int, estado: Optional[str]) -> list:
    """Scrape Google Maps using gosom/google-maps-scraper REST API (Docker service)."""
    import csv
    import io
    import httpx

    SCRAPER_URL = os.environ.get("SCRAPER_URL", "http://scraper:8080")
    query = f"{categoria} em {cidade}{' ' + estado if estado else ''}"
    depth = max(2, min(limite // 10, 5))

    logger.info(f"[SCRAPER] Query: '{query}' | depth: {depth} | limit: {limite}")

    # 1. Create job via API
    try:
        with httpx.Client(timeout=10) as client:
            job_data = {
                "name": f"scrape_{int(time.time())}",
                "keywords": [query],
                "lang": "pt",
                "depth": depth,
                "max_time": 180,
                "lat": "-15.7801",
                "lon": "-47.9292",
                "zoom": 13,
            }
            resp = client.post(f"{SCRAPER_URL}/api/v1/jobs", json=job_data)
            resp.raise_for_status()
            job_id = resp.json()["id"]
            logger.info(f"[SCRAPER] Job created: {job_id}")
    except Exception as e:
        logger.error(f"[SCRAPER] Failed to create job: {e}")
        return []

    # 2. Poll until job completes (max 5 min)
    max_wait = 300
    poll_interval = 5
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
                    logger.info(f"[SCRAPER] Job {job_id} finished with status: {status} ({elapsed}s)")
                    break
            except Exception as e:
                logger.warning(f"[SCRAPER] Poll error: {e}")

        if status == "working":
            logger.error(f"[SCRAPER] Job {job_id} timed out after {max_wait}s")
            return []

        # 3. Download CSV results
        try:
            resp = client.get(f"{SCRAPER_URL}/api/v1/jobs/{job_id}/download")
            resp.raise_for_status()
            csv_content = resp.text
        except Exception as e:
            logger.error(f"[SCRAPER] Failed to download results: {e}")
            return []

    # 4. Parse CSV into lead dicts
    results = []
    try:
        reader = csv.DictReader(io.StringIO(csv_content))
        for row in reader:
            # Parse phone
            phone = row.get("phone", "").strip() or None

            # Parse website
            website = row.get("website", "").strip() or None

            # Parse address
            addr = ""
            complete_addr_raw = row.get("complete_address", "")
            if complete_addr_raw:
                try:
                    ca = json.loads(complete_addr_raw)
                    parts = [ca.get("street", ""), ca.get("borough", ""), ca.get("city", ""), ca.get("state", "")]
                    addr = ", ".join(p for p in parts if p)
                except (json.JSONDecodeError, TypeError):
                    addr = row.get("address", "")
            else:
                addr = row.get("address", "")

            # Parse hours
            hours_str = None
            hours_raw = row.get("open_hours", "")
            if hours_raw:
                try:
                    hours_dict = json.loads(hours_raw)
                    parts = []
                    for day, times in hours_dict.items():
                        if isinstance(times, list):
                            parts.append(f"{day}: {', '.join(times)}")
                    hours_str = " | ".join(parts[:4]) if parts else None
                except (json.JSONDecodeError, TypeError):
                    pass

            # Parse rating and reviews
            rating = None
            try:
                rating = float(row.get("review_rating", 0))
            except (ValueError, TypeError):
                pass

            reviews_count = 0
            try:
                reviews_count = int(row.get("review_count", 0))
            except (ValueError, TypeError):
                pass

            # Parse emails
            email = None
            emails_raw = row.get("emails", "")
            if emails_raw:
                try:
                    emails_list = json.loads(emails_raw)
                    if isinstance(emails_list, list) and emails_list:
                        email = emails_list[0]
                except (json.JSONDecodeError, TypeError):
                    pass

            # Parse images count
            fotos_count = 0
            images_raw = row.get("images", "")
            if images_raw:
                try:
                    images_list = json.loads(images_raw)
                    if isinstance(images_list, list):
                        fotos_count = len(images_list)
                except (json.JSONDecodeError, TypeError):
                    pass

            title = row.get("title", "").strip()
            if title:
                results.append({
                    "nome": title,
                    "endereco": addr,
                    "telefone": phone,
                    "email": email,
                    "rating": rating,
                    "reviews_count": reviews_count,
                    "url_site": website,
                    "horario": hours_str,
                    "fotos_count": fotos_count,
                })

    except Exception as e:
        logger.error(f"[SCRAPER] CSV parse error: {e}")

    logger.info(f"[SCRAPER] Parsed {len(results)} leads")
    return results[:limite]


@celery_app.task(bind=True, name="app.workers.scraper_tasks.analyze_site_task", max_retries=1)
def analyze_site_task(self, lead_id: int, url: str):
    db = get_sync_db()
    try:
        from app.models.lead import Lead
        from app.services.scraper_service import calculate_lead_score, check_domain_availability, suggest_domain
        import asyncio

        lead = db.query(Lead).filter(Lead.id == lead_id).first()
        if not lead:
            return

        async def _analyze():
            from app.services.scraper_service import analyze_site
            result = await analyze_site(url)

            domain = suggest_domain(lead.nome)
            domain_available = await check_domain_availability(domain)

            return result, domain, domain_available

        loop = asyncio.new_event_loop()
        site_data, domain, domain_avail = loop.run_until_complete(_analyze())
        loop.close()

        lead.ssl_valido = site_data.get("ssl_valido", False)
        lead.mobile_friendly = site_data.get("mobile_friendly", False)
        lead.site_score = site_data.get("site_score", 0)
        lead.dominio_sugerido = domain
        lead.dominio_disponivel = domain_avail
        lead.lead_score = calculate_lead_score(lead)
        db.add(lead)
        db.commit()

    except Exception as exc:
        db.rollback()
        raise self.retry(exc=exc, countdown=30)
    finally:
        db.close()
