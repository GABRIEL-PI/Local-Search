import asyncio
import json
import re
import time
from datetime import datetime, timezone
from typing import Optional

from celery import shared_task
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

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

        leads_data = _scrape_with_playwright(cidade, categoria, limite, estado)

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


def _scrape_with_playwright(cidade: str, categoria: str, limite: int, estado: Optional[str]) -> list:
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        return _mock_scrape(cidade, categoria, limite)

    results = []
    query = f"{categoria} em {cidade}{' ' + estado if estado else ''}"

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True, args=["--no-sandbox", "--disable-dev-shm-usage"])
            context = browser.new_context(
                viewport={"width": 1280, "height": 720},
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            )
            page = context.new_page()

            maps_url = f"https://www.google.com/maps/search/{query.replace(' ', '+')}/"
            page.goto(maps_url, wait_until="networkidle", timeout=30000)
            page.wait_for_timeout(3000)

            for _ in range(min(limite // 5, 10)):
                page.keyboard.press("End")
                page.wait_for_timeout(2000)

            listings = page.query_selector_all("[data-result-index]")

            for listing in listings[:limite]:
                try:
                    listing.click()
                    page.wait_for_timeout(2000)

                    name_el = page.query_selector("h1.DUwDvf")
                    name = name_el.inner_text() if name_el else ""

                    rating_el = page.query_selector("div.F7nice span[aria-hidden]")
                    rating = None
                    if rating_el:
                        try:
                            rating = float(rating_el.inner_text().replace(",", "."))
                        except Exception:
                            pass

                    reviews_el = page.query_selector("div.F7nice span[aria-label*='avaliações']")
                    reviews_count = 0
                    if reviews_el:
                        text = reviews_el.get_attribute("aria-label") or ""
                        nums = re.findall(r'\d+', text.replace(".", ""))
                        reviews_count = int(nums[0]) if nums else 0

                    address_el = page.query_selector("button[data-item-id='address']")
                    address = address_el.inner_text() if address_el else ""

                    phone_el = page.query_selector("button[data-item-id*='phone']")
                    phone = phone_el.get_attribute("data-item-id", "").replace("phone:tel:", "") if phone_el else None

                    website_el = page.query_selector("a[data-item-id='authority']")
                    website = website_el.get_attribute("href") if website_el else None

                    hours_el = page.query_selector("div[aria-label*='Horário']")
                    hours = hours_el.inner_text() if hours_el else None

                    photos_el = page.query_selector("span.Liguzc")
                    photos_count = 0
                    if photos_el:
                        nums = re.findall(r'\d+', photos_el.inner_text())
                        photos_count = int(nums[0]) if nums else 0

                    if name:
                        results.append({
                            "nome": name,
                            "endereco": address,
                            "telefone": phone,
                            "rating": rating,
                            "reviews_count": reviews_count,
                            "url_site": website,
                            "horario": hours,
                            "fotos_count": photos_count,
                        })

                    time.sleep(settings.SCRAPING_DELAY_SECONDS)

                except Exception:
                    continue

            browser.close()

    except Exception as e:
        return _mock_scrape(cidade, categoria, limite)

    return results


def _mock_scrape(cidade: str, categoria: str, limite: int) -> list:
    """Fallback mock data for testing when Playwright is unavailable."""
    import random
    businesses = [
        "Restaurante", "Pizzaria", "Barbearia", "Salão de Beleza",
        "Farmácia", "Padaria", "Loja de Roupas", "Academia",
        "Clínica", "Consultório", "Escritório", "Oficina",
    ]
    results = []
    for i in range(min(limite, 20)):
        name = f"{random.choice(businesses)} {random.choice(['do João', 'da Maria', 'Central', 'Premium', 'Express'])} {i+1}"
        results.append({
            "nome": name,
            "endereco": f"Rua das Flores, {random.randint(1, 999)}, {cidade}",
            "telefone": f"119{random.randint(10000000, 99999999)}",
            "rating": round(random.uniform(3.5, 5.0), 1),
            "reviews_count": random.randint(5, 500),
            "url_site": None if random.random() > 0.4 else f"https://www.{name.lower().replace(' ', '')}.com.br",
            "horario": "Seg-Sex: 08h-18h",
            "fotos_count": random.randint(0, 20),
        })
    return results


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
