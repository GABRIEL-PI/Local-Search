from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import Optional, List

from app.models.proposal import Proposta
from app.repositories.base import BaseRepository


class ProposalRepository(BaseRepository[Proposta]):
    def __init__(self, db: AsyncSession):
        super().__init__(Proposta, db)

    async def get_by_lead(self, lead_id: int) -> List[Proposta]:
        result = await self.db.execute(
            select(Proposta)
            .where(Proposta.lead_id == lead_id)
            .order_by(Proposta.criado_em.desc())
        )
        return list(result.scalars().all())

    async def get_pending_for_user(self, usuario_id: int) -> List[Proposta]:
        result = await self.db.execute(
            select(Proposta)
            .where(
                and_(
                    Proposta.usuario_id == usuario_id,
                    Proposta.status == "rascunho",
                )
            )
            .order_by(Proposta.criado_em.desc())
        )
        return list(result.scalars().all())

    async def get_by_usuario(self, usuario_id: int, status: Optional[str] = None) -> List[Proposta]:
        conditions = [Proposta.usuario_id == usuario_id]
        if status:
            conditions.append(Proposta.status == status)
        result = await self.db.execute(
            select(Proposta)
            .where(and_(*conditions))
            .order_by(Proposta.criado_em.desc())
        )
        return list(result.scalars().all())

    async def get_latest_for_lead(self, lead_id: int) -> Optional[Proposta]:
        result = await self.db.execute(
            select(Proposta)
            .where(Proposta.lead_id == lead_id)
            .order_by(Proposta.criado_em.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()
