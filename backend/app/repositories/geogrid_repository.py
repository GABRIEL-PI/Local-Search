from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List, Optional

from app.models.geogrid import Geogrid, GeogridPoint
from app.repositories.base import BaseRepository


class GeogridRepository(BaseRepository[Geogrid]):
    def __init__(self, db: AsyncSession):
        super().__init__(Geogrid, db)

    async def get_by_usuario(self, usuario_id: int, limit: int = 50) -> List[Geogrid]:
        result = await self.db.execute(
            select(Geogrid)
            .where(Geogrid.usuario_id == usuario_id)
            .order_by(Geogrid.iniciado_em.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_by_lead(self, lead_id: int, usuario_id: int) -> List[Geogrid]:
        result = await self.db.execute(
            select(Geogrid)
            .where(and_(Geogrid.lead_id == lead_id, Geogrid.usuario_id == usuario_id))
            .order_by(Geogrid.iniciado_em.desc())
        )
        return list(result.scalars().all())

    async def get_one(self, geogrid_id: int, usuario_id: int) -> Optional[Geogrid]:
        result = await self.db.execute(
            select(Geogrid).where(and_(Geogrid.id == geogrid_id, Geogrid.usuario_id == usuario_id))
        )
        return result.scalar_one_or_none()


class GeogridPointRepository(BaseRepository[GeogridPoint]):
    def __init__(self, db: AsyncSession):
        super().__init__(GeogridPoint, db)

    async def get_by_geogrid(self, geogrid_id: int) -> List[GeogridPoint]:
        result = await self.db.execute(
            select(GeogridPoint)
            .where(GeogridPoint.geogrid_id == geogrid_id)
            .order_by(GeogridPoint.idx)
        )
        return list(result.scalars().all())
