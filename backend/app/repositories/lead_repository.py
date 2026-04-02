from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import selectinload
from typing import Optional, List, Tuple

from app.models.lead import Lead, Nota, Tag, LeadTag, LeadStatusHistory, SessionScraping
from app.repositories.base import BaseRepository


class LeadRepository(BaseRepository[Lead]):
    def __init__(self, db: AsyncSession):
        super().__init__(Lead, db)

    async def get_filtered(
        self,
        usuario_id: int,
        cidade: Optional[str] = None,
        categoria: Optional[str] = None,
        score_min: Optional[int] = None,
        score_max: Optional[int] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> Tuple[int, List[Lead]]:
        conditions = [Lead.usuario_id == usuario_id]

        if cidade:
            conditions.append(Lead.cidade.ilike(f"%{cidade}%"))
        if categoria:
            conditions.append(Lead.categoria.ilike(f"%{categoria}%"))
        if score_min is not None:
            conditions.append(Lead.lead_score >= score_min)
        if score_max is not None:
            conditions.append(Lead.lead_score <= score_max)
        if status:
            conditions.append(Lead.status == status)
        if search:
            conditions.append(
                or_(
                    Lead.nome.ilike(f"%{search}%"),
                    Lead.email.ilike(f"%{search}%"),
                    Lead.telefone.ilike(f"%{search}%"),
                )
            )

        count_query = select(func.count()).select_from(Lead).where(and_(*conditions))
        count_result = await self.db.execute(count_query)
        total = count_result.scalar_one()

        query = (
            select(Lead)
            .where(and_(*conditions))
            .order_by(Lead.lead_score.desc(), Lead.atualizado_em.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(query)
        leads = list(result.scalars().all())

        return total, leads

    async def get_by_usuario(self, usuario_id: int, status: Optional[str] = None) -> List[Lead]:
        conditions = [Lead.usuario_id == usuario_id]
        if status:
            conditions.append(Lead.status == status)
        result = await self.db.execute(
            select(Lead).where(and_(*conditions)).order_by(Lead.lead_score.desc())
        )
        return list(result.scalars().all())

    async def get_with_details(self, lead_id: int) -> Optional[Lead]:
        result = await self.db.execute(
            select(Lead)
            .options(
                selectinload(Lead.notas),
                selectinload(Lead.lead_tags).selectinload(LeadTag.tag),
                selectinload(Lead.propostas),
                selectinload(Lead.status_history),
            )
            .where(Lead.id == lead_id)
        )
        return result.scalar_one_or_none()

    async def get_by_status_for_user(self, usuario_id: int) -> dict:
        result = await self.db.execute(
            select(Lead.status, func.count(Lead.id))
            .where(Lead.usuario_id == usuario_id)
            .group_by(Lead.status)
        )
        return {row[0]: row[1] for row in result.all()}

    async def count_today_for_user(self, usuario_id: int) -> int:
        from datetime import date
        from sqlalchemy import cast, Date
        today = date.today()
        result = await self.db.execute(
            select(func.count(Lead.id))
            .where(
                and_(
                    Lead.usuario_id == usuario_id,
                    func.date(Lead.data_coleta) == today,
                )
            )
        )
        return result.scalar_one()


class NotaRepository(BaseRepository[Nota]):
    def __init__(self, db: AsyncSession):
        super().__init__(Nota, db)

    async def get_by_lead(self, lead_id: int) -> List[Nota]:
        result = await self.db.execute(
            select(Nota).where(Nota.lead_id == lead_id).order_by(Nota.criado_em.desc())
        )
        return list(result.scalars().all())


class TagRepository(BaseRepository[Tag]):
    def __init__(self, db: AsyncSession):
        super().__init__(Tag, db)

    async def get_by_usuario(self, usuario_id: int) -> List[Tag]:
        result = await self.db.execute(
            select(Tag).where(Tag.usuario_id == usuario_id)
        )
        return list(result.scalars().all())


class LeadStatusHistoryRepository(BaseRepository[LeadStatusHistory]):
    def __init__(self, db: AsyncSession):
        super().__init__(LeadStatusHistory, db)

    async def get_by_lead(self, lead_id: int) -> List[LeadStatusHistory]:
        result = await self.db.execute(
            select(LeadStatusHistory)
            .where(LeadStatusHistory.lead_id == lead_id)
            .order_by(LeadStatusHistory.criado_em.desc())
        )
        return list(result.scalars().all())


class SessionScrapingRepository(BaseRepository[SessionScraping]):
    def __init__(self, db: AsyncSession):
        super().__init__(SessionScraping, db)

    async def get_by_usuario(self, usuario_id: int) -> List[SessionScraping]:
        result = await self.db.execute(
            select(SessionScraping)
            .where(SessionScraping.usuario_id == usuario_id)
            .order_by(SessionScraping.iniciado_em.desc())
        )
        return list(result.scalars().all())

    async def get_active_for_user(self, usuario_id: int) -> List[SessionScraping]:
        result = await self.db.execute(
            select(SessionScraping)
            .where(
                and_(
                    SessionScraping.usuario_id == usuario_id,
                    SessionScraping.status == "rodando",
                )
            )
        )
        return list(result.scalars().all())
