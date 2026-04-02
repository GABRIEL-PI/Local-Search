from datetime import datetime, timezone
from typing import Optional, List
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
import httpx

from app.core.config import settings
from app.core.security import decrypt_field
from app.models.outreach import Disparo, WhatsAppConta
from app.repositories.outreach_repository import DisparoRepository, WhatsAppContaRepository
from app.repositories.lead_repository import LeadRepository
from app.schemas.outreach import OutreachSendRequest, WhatsAppAccountCreate


class OutreachService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.disparo_repo = DisparoRepository(db)
        self.whatsapp_repo = WhatsAppContaRepository(db)
        self.lead_repo = LeadRepository(db)

    async def get_queue(self, usuario_id: int) -> List[dict]:
        disparos = await self.disparo_repo.get_queue_for_user(usuario_id)
        result = []
        for d in disparos:
            lead = await self.lead_repo.get_by_id(d.lead_id)
            result.append({
                "disparo": d,
                "lead_nome": lead.nome if lead else "N/A",
                "lead_telefone": lead.telefone if lead else None,
                "lead_whatsapp": lead.whatsapp if lead else None,
            })
        return result

    async def create_disparo(self, usuario_id: int, data: OutreachSendRequest) -> Disparo:
        lead = await self.lead_repo.get_by_id(data.lead_id)
        if not lead or lead.usuario_id != usuario_id:
            raise HTTPException(status_code=404, detail="Lead não encontrado")

        if data.canal == "whatsapp" and not lead.whatsapp and not lead.telefone:
            raise HTTPException(status_code=400, detail="Lead não possui WhatsApp/telefone")

        disparo = await self.disparo_repo.create({
            "lead_id": data.lead_id,
            "proposta_id": data.proposta_id,
            "canal": data.canal,
            "status": "pendente",
            "mensagem_enviada": data.mensagem,
            "agendado_para": data.agendado_para or datetime.now(timezone.utc),
        })
        return disparo

    async def get_disparo(self, disparo_id: int, usuario_id: int) -> Disparo:
        disparo = await self.disparo_repo.get_by_id(disparo_id)
        if not disparo:
            raise HTTPException(status_code=404, detail="Disparo não encontrado")
        lead = await self.lead_repo.get_by_id(disparo.lead_id)
        if not lead or lead.usuario_id != usuario_id:
            raise HTTPException(status_code=403, detail="Acesso negado")
        return disparo

    async def get_whatsapp_accounts(self, usuario_id: int) -> List[WhatsAppConta]:
        return await self.whatsapp_repo.get_by_usuario(usuario_id)

    async def create_whatsapp_account(
        self, usuario_id: int, data: WhatsAppAccountCreate
    ) -> WhatsAppConta:
        return await self.whatsapp_repo.create({
            "usuario_id": usuario_id,
            "nome": data.nome,
            "instancia_id": data.instancia_id,
            "status": "desconectado",
        })

    async def send_whatsapp_via_evolution(
        self,
        phone: str,
        message: str,
        instancia_id: str,
        api_url: str,
        api_key: str,
    ) -> dict:
        url = f"{api_url}/message/sendText/{instancia_id}"
        headers = {"apikey": api_key, "Content-Type": "application/json"}
        payload = {
            "number": phone.replace("+", "").replace("-", "").replace(" ", ""),
            "text": message,
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            return response.json()

    async def process_webhook(self, payload: dict) -> dict:
        instancia = payload.get("instancia", "")
        evento = payload.get("evento", "")
        dados = payload.get("dados", {})

        conta = await self.whatsapp_repo.get_by_instancia(instancia)
        if not conta:
            return {"status": "ignored", "reason": "instancia not found"}

        if evento == "messages.upsert":
            from_number = dados.get("key", {}).get("remoteJid", "").replace("@s.whatsapp.net", "")
            message_text = dados.get("message", {}).get("conversation", "")

            from sqlalchemy import select
            from app.models.lead import Lead
            result = await self.db.execute(
                select(Lead).where(Lead.whatsapp == from_number)
            )
            lead = result.scalar_one_or_none()

            if lead:
                from app.models.outreach import Disparo
                result2 = await self.db.execute(
                    select(Disparo)
                    .where(
                        Disparo.lead_id == lead.id,
                        Disparo.canal == "whatsapp",
                        Disparo.status.in_(["enviado", "entregue", "lido"]),
                    )
                    .order_by(Disparo.enviado_em.desc())
                    .limit(1)
                )
                disparo = result2.scalar_one_or_none()
                if disparo:
                    await self.disparo_repo.update(disparo.id, {
                        "status": "respondido",
                        "resposta_recebida": message_text,
                        "respondido_em": datetime.now(timezone.utc),
                    })
                    await self.lead_repo.update(lead.id, {"status": "respondeu"})

        return {"status": "processed", "evento": evento}
