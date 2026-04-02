from datetime import datetime, timezone, timedelta

from app.workers.celery_app import celery_app
from app.core.config import settings


def get_sync_db():
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    engine = create_engine(settings.SYNC_DATABASE_URL, pool_pre_ping=True)
    SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    return SessionLocal()


@celery_app.task(name="app.workers.followup_tasks.process_followups")
def process_followups():
    db = get_sync_db()
    try:
        from app.models.outreach import Followup, Disparo
        from app.models.lead import Lead
        from app.models.proposal import Proposta
        from app.workers.outreach_tasks import send_whatsapp_message

        now = datetime.now(timezone.utc)
        pending = db.query(Followup).filter(
            Followup.status == "pendente",
            Followup.agendado_para <= now,
        ).all()

        processed = 0
        for followup in pending:
            lead = db.query(Lead).filter(Lead.id == followup.lead_id).first()
            if not lead:
                followup.status = "cancelado"
                db.add(followup)
                continue

            if lead.status in ("respondeu", "negociando", "fechado", "perdido"):
                followup.status = "cancelado"
                db.add(followup)
                continue

            proposta = db.query(Proposta).filter(
                Proposta.lead_id == lead.id,
                Proposta.status == "aprovada",
            ).order_by(Proposta.criado_em.desc()).first()

            if not proposta:
                followup.status = "cancelado"
                db.add(followup)
                continue

            followup_messages = {
                "1": proposta.mensagem_formal or f"Olá {lead.nome}! Passando para verificar se recebeu nossa proposta. Podemos conversar?",
                "2": proposta.mensagem_descontraida or f"Oi {lead.nome}! Ainda tem interesse em melhorar sua presença digital? 😊",
                "3": proposta.mensagem_urgencia or f"Última chance! Vagas limitadas para {lead.cidade} este mês. {lead.nome}, vamos fechar?",
            }

            mensagem = followup_messages.get(followup.sequencia, "")

            if lead.whatsapp or lead.telefone:
                disparo = Disparo(
                    lead_id=lead.id,
                    proposta_id=proposta.id,
                    canal="whatsapp",
                    status="pendente",
                    mensagem_enviada=mensagem,
                    agendado_para=now,
                )
                db.add(disparo)
                db.flush()

                followup.status = "enviado"
                followup.executado_em = now
                db.add(followup)

                send_whatsapp_message.apply_async(args=[disparo.id], countdown=5)

            processed += 1

        db.commit()
        return {"processed": processed, "timestamp": now.isoformat()}

    except Exception as exc:
        db.rollback()
        raise
    finally:
        db.close()


@celery_app.task(name="app.workers.followup_tasks.schedule_followups_for_lead")
def schedule_followups_for_lead(lead_id: int):
    db = get_sync_db()
    try:
        from app.models.outreach import Followup, Disparo

        existing = db.query(Followup).filter(Followup.lead_id == lead_id).first()
        if existing:
            return {"status": "already_scheduled"}

        now = datetime.now(timezone.utc)
        schedules = [
            ("1", now + timedelta(days=1)),
            ("2", now + timedelta(days=3)),
            ("3", now + timedelta(days=7)),
        ]

        for seq, scheduled_at in schedules:
            followup = Followup(
                lead_id=lead_id,
                sequencia=seq,
                status="pendente",
                agendado_para=scheduled_at,
            )
            db.add(followup)

        db.commit()
        return {"status": "scheduled", "lead_id": lead_id}

    finally:
        db.close()


@celery_app.task(name="app.workers.followup_tasks.generate_proposal_ai")
def generate_proposal_ai(proposta_id: int, api_key: str = None):
    db = get_sync_db()
    try:
        from app.models.proposal import Proposta
        from app.models.lead import Lead
        from app.services.ai_service import AIService
        import asyncio

        proposta = db.query(Proposta).filter(Proposta.id == proposta_id).first()
        if not proposta:
            return {"error": "proposal not found"}

        lead = db.query(Lead).filter(Lead.id == proposta.lead_id).first()
        if not lead:
            return {"error": "lead not found"}

        from app.models.payment import ConfiguracaoUsuario
        config = db.query(ConfiguracaoUsuario).filter(
            ConfiguracaoUsuario.usuario_id == lead.usuario_id
        ).first()

        user_api_key = None
        if config and config.claude_api_key:
            from app.core.security import decrypt_field
            user_api_key = decrypt_field(config.claude_api_key)

        ai_service = AIService(api_key=user_api_key or api_key or settings.CLAUDE_API_KEY)

        loop = asyncio.new_event_loop()
        content = loop.run_until_complete(ai_service.generate_proposal(lead))
        loop.close()

        proposta.argumento_venda = content.argumento_venda
        proposta.mensagem_formal = content.mensagem_formal
        proposta.mensagem_descontraida = content.mensagem_descontraida
        proposta.mensagem_urgencia = content.mensagem_urgencia
        proposta.landing_page_html = content.landing_page_html
        proposta.preco_sugerido = content.preco_sugerido
        proposta.mensalidade_sugerida = content.mensalidade_sugerida
        db.add(proposta)
        db.commit()

        return {"proposta_id": proposta_id, "status": "generated"}

    except Exception as exc:
        db.rollback()
        raise
    finally:
        db.close()
