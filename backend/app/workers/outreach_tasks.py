import asyncio
from datetime import datetime, timezone
from typing import Optional

from app.workers.celery_app import celery_app
from app.core.config import settings


def get_sync_db():
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    engine = create_engine(settings.SYNC_DATABASE_URL, pool_pre_ping=True)
    SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    return SessionLocal()


@celery_app.task(bind=True, name="app.workers.outreach_tasks.send_whatsapp_message", max_retries=3)
def send_whatsapp_message(self, disparo_id: int):
    db = get_sync_db()
    try:
        from app.models.outreach import Disparo, WhatsAppConta
        from app.models.lead import Lead
        from app.models.payment import ConfiguracaoUsuario
        import httpx

        disparo = db.query(Disparo).filter(Disparo.id == disparo_id).first()
        if not disparo:
            return {"error": "disparo not found"}

        lead = db.query(Lead).filter(Lead.id == disparo.lead_id).first()
        if not lead:
            disparo.status = "erro"
            disparo.erro_descricao = "Lead not found"
            db.commit()
            return

        config = db.query(ConfiguracaoUsuario).filter(
            ConfiguracaoUsuario.usuario_id == lead.usuario_id
        ).first()

        conta = db.query(WhatsAppConta).filter(
            WhatsAppConta.usuario_id == lead.usuario_id,
            WhatsAppConta.status == "conectado",
        ).first()

        if not conta:
            disparo.status = "erro"
            disparo.erro_descricao = "No connected WhatsApp account"
            db.commit()
            return

        if conta.disparos_hoje >= (config.limite_disparos_dia if config else settings.MAX_WHATSAPP_MESSAGES_PER_DAY):
            disparo.status = "erro"
            disparo.erro_descricao = "Daily limit reached"
            disparo.agendado_para = _next_day_schedule()
            db.commit()
            return

        api_url = settings.EVOLUTION_API_URL
        api_key = settings.EVOLUTION_API_KEY
        if config and config.evolution_api_url:
            api_url = config.evolution_api_url
        if config and config.evolution_api_key:
            from app.core.security import decrypt_field
            api_key = decrypt_field(config.evolution_api_key)

        phone = lead.whatsapp or lead.telefone
        if not phone:
            disparo.status = "erro"
            disparo.erro_descricao = "No phone number"
            db.commit()
            return

        phone_clean = phone.replace("+", "").replace("-", "").replace(" ", "").replace("(", "").replace(")", "")

        url = f"{api_url}/message/sendText/{conta.instancia_id}"
        headers = {"apikey": api_key, "Content-Type": "application/json"}
        payload = {"number": phone_clean, "text": disparo.mensagem_enviada}

        response = asyncio.get_event_loop().run_until_complete(
            _async_post(url, payload, headers)
        ) if asyncio.get_event_loop().is_running() else _sync_post(url, payload, headers)

        if response.get("status") == "error":
            raise Exception(response.get("message", "Unknown error"))

        disparo.status = "enviado"
        disparo.enviado_em = datetime.now(timezone.utc)
        disparo.tentativas += 1
        conta.disparos_hoje += 1
        db.add(lead)
        db.commit()

        if lead.status == "proposta_gerada":
            lead.status = "abordado"
            db.add(lead)
            db.commit()

        return {"disparo_id": disparo_id, "status": "sent"}

    except Exception as exc:
        db.rollback()
        disparo = db.query("Disparo").filter_by(id=disparo_id).first() if db else None
        if disparo:
            disparo.tentativas = (disparo.tentativas or 0) + 1
            if disparo.tentativas >= 3:
                disparo.status = "erro"
                disparo.erro_descricao = str(exc)
            db.commit()
        raise self.retry(exc=exc, countdown=60 * (self.request.retries + 1))
    finally:
        db.close()


def _sync_post(url: str, payload: dict, headers: dict) -> dict:
    import httpx
    with httpx.Client(timeout=30.0) as client:
        response = client.post(url, json=payload, headers=headers)
        if response.status_code >= 400:
            return {"status": "error", "message": f"HTTP {response.status_code}"}
        return response.json()


async def _async_post(url: str, payload: dict, headers: dict) -> dict:
    import httpx
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(url, json=payload, headers=headers)
        if response.status_code >= 400:
            return {"status": "error", "message": f"HTTP {response.status_code}"}
        return response.json()


def _next_day_schedule():
    from datetime import datetime, timezone, timedelta
    tomorrow = datetime.now(timezone.utc) + timedelta(days=1)
    return tomorrow.replace(hour=8, minute=0, second=0, microsecond=0)


@celery_app.task(name="app.workers.outreach_tasks.send_email")
def send_email(disparo_id: int):
    db = get_sync_db()
    try:
        from app.models.outreach import Disparo
        from app.models.lead import Lead
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart

        disparo = db.query(Disparo).filter(Disparo.id == disparo_id).first()
        if not disparo:
            return {"error": "disparo not found"}

        lead = db.query(Lead).filter(Lead.id == disparo.lead_id).first()
        if not lead or not lead.email:
            disparo.status = "erro"
            disparo.erro_descricao = "No email address"
            db.commit()
            return

        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"Proposta especial para {lead.nome}"
        msg["From"] = settings.SMTP_FROM
        msg["To"] = lead.email

        text_part = MIMEText(disparo.mensagem_enviada, "plain", "utf-8")
        msg.attach(text_part)

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM, [lead.email], msg.as_string())

        disparo.status = "enviado"
        disparo.enviado_em = datetime.now(timezone.utc)
        db.commit()

        return {"disparo_id": disparo_id, "status": "email_sent"}

    except Exception as exc:
        db.rollback()
        raise
    finally:
        db.close()


@celery_app.task(name="app.workers.outreach_tasks.reset_daily_counts")
def reset_daily_counts():
    db = get_sync_db()
    try:
        from app.models.outreach import WhatsAppConta
        db.query(WhatsAppConta).update({"disparos_hoje": 0})
        db.commit()
        return {"status": "reset_done"}
    finally:
        db.close()
