from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from typing import Optional, List
from datetime import datetime, timezone

from app.models.outreach import Disparo, Followup, WhatsAppConta
from app.repositories.base import BaseRepository


class DisparoRepository(BaseRepository[Disparo]):
    def __init__(self, db: AsyncSession):
        super().__init__(Disparo, db)

    async def get_queue_for_user(self, usuario_id: int) -> List[Disparo]:
        from app.models.lead import Lead
        result = await self.db.execute(
            select(Disparo)
            .join(Lead, Disparo.lead_id == Lead.id)
            .where(
                and_(
                    Lead.usuario_id == usuario_id,
                    Disparo.status == "pendente",
                )
            )
            .order_by(Disparo.agendado_para.asc())
        )
        return list(result.scalars().all())

    async def get_by_lead(self, lead_id: int) -> List[Disparo]:
        result = await self.db.execute(
            select(Disparo)
            .where(Disparo.lead_id == lead_id)
            .order_by(Disparo.criado_em.desc())
        )
        return list(result.scalars().all())

    async def get_pending_scheduled(self) -> List[Disparo]:
        now = datetime.now(timezone.utc)
        result = await self.db.execute(
            select(Disparo)
            .where(
                and_(
                    Disparo.status == "pendente",
                    Disparo.agendado_para <= now,
                )
            )
        )
        return list(result.scalars().all())

    async def count_today_for_instance(self, instancia_id: str) -> int:
        from datetime import date
        today = date.today()
        result = await self.db.execute(
            select(func.count(Disparo.id))
            .where(
                and_(
                    Disparo.canal == "whatsapp",
                    func.date(Disparo.enviado_em) == today,
                    Disparo.status.in_(["enviado", "entregue", "lido", "respondido"]),
                )
            )
        )
        return result.scalar_one()


class FollowupRepository(BaseRepository[Followup]):
    def __init__(self, db: AsyncSession):
        super().__init__(Followup, db)

    async def get_pending_due(self) -> List[Followup]:
        now = datetime.now(timezone.utc)
        result = await self.db.execute(
            select(Followup)
            .where(
                and_(
                    Followup.status == "pendente",
                    Followup.agendado_para <= now,
                )
            )
        )
        return list(result.scalars().all())

    async def get_by_lead(self, lead_id: int) -> List[Followup]:
        result = await self.db.execute(
            select(Followup).where(Followup.lead_id == lead_id).order_by(Followup.sequencia)
        )
        return list(result.scalars().all())


class WhatsAppContaRepository(BaseRepository[WhatsAppConta]):
    def __init__(self, db: AsyncSession):
        super().__init__(WhatsAppConta, db)

    async def get_by_usuario(self, usuario_id: int) -> List[WhatsAppConta]:
        result = await self.db.execute(
            select(WhatsAppConta).where(WhatsAppConta.usuario_id == usuario_id)
        )
        return list(result.scalars().all())

    async def get_by_instancia(self, instancia_id: str) -> Optional[WhatsAppConta]:
        result = await self.db.execute(
            select(WhatsAppConta).where(WhatsAppConta.instancia_id == instancia_id)
        )
        return result.scalar_one_or_none()
