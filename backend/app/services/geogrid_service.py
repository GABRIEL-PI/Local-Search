import math
from datetime import datetime, timezone
from typing import Optional, Tuple

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.geogrid import Geogrid, GeogridPoint
from app.models.lead import Lead
from app.repositories.geogrid_repository import GeogridRepository, GeogridPointRepository
from app.repositories.lead_repository import LeadRepository


def gerar_grid(center_lat: float, center_lng: float, size: int, spacing_meters: int):
    """Gera grade NxN centrada em (center_lat, center_lng) com `spacing_meters` entre pontos."""
    deg_per_m_lat = 1.0 / 111000.0
    deg_per_m_lng = 1.0 / (111000.0 * max(0.000001, math.cos(math.radians(center_lat))))
    half = (size - 1) / 2.0
    points = []
    for row in range(size):
        for col in range(size):
            d_lat = (half - row) * spacing_meters * deg_per_m_lat
            d_lng = (col - half) * spacing_meters * deg_per_m_lng
            points.append({
                "idx": row * size + col,
                "row": row,
                "col": col,
                "lat": center_lat + d_lat,
                "lng": center_lng + d_lng,
            })
    return points


class GeogridService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = GeogridRepository(db)
        self.point_repo = GeogridPointRepository(db)
        self.lead_repo = LeadRepository(db)

    async def list_for_user(self, usuario_id: int):
        return await self.repo.get_by_usuario(usuario_id)

    async def list_by_lead(self, lead_id: int, usuario_id: int):
        return await self.repo.get_by_lead(lead_id, usuario_id)

    async def get_detail(self, geogrid_id: int, usuario_id: int):
        geo = await self.repo.get_one(geogrid_id, usuario_id)
        if not geo:
            return None
        points = await self.point_repo.get_by_geogrid(geo.id)
        lead = await self.db.get(Lead, geo.lead_id)
        return geo, points, (lead.nome if lead else None)

    async def start(
        self,
        usuario_id: int,
        lead_id: int,
        keyword: Optional[str],
        grid_size: int,
        spacing_meters: int,
        zoom: int,
        radius: int,
    ) -> Tuple[Optional[int], Optional[str]]:
        # validations
        size = max(3, min(grid_size, 9))
        if size % 2 == 0:
            size += 1  # garante ímpar
        spacing = max(100, min(spacing_meters, 2000))
        zoom_v = max(10, min(zoom, 18))
        radius_v = max(100, min(radius, 5000))

        lead_q = await self.db.execute(
            select(Lead).where(Lead.id == lead_id, Lead.usuario_id == usuario_id)
        )
        lead = lead_q.scalar_one_or_none()
        if not lead:
            return None, "Lead não encontrado"
        if not lead.latitude or not lead.longitude:
            return None, "Lead sem coordenadas (latitude/longitude). Não é possível gerar geogrid."

        kw = (keyword or lead.categoria or lead.nome or "").strip()
        if not kw:
            return None, "Informe uma palavra-chave (keyword)"

        center_lat = float(lead.latitude)
        center_lng = float(lead.longitude)
        grid_points = gerar_grid(center_lat, center_lng, size, spacing)

        geogrid = Geogrid(
            usuario_id=usuario_id,
            lead_id=lead_id,
            keyword=kw,
            center_lat=center_lat,
            center_lng=center_lng,
            grid_size=size,
            spacing_meters=spacing,
            zoom=zoom_v,
            radius=radius_v,
            total_pontos=len(grid_points),
            pontos_concluidos=0,
            status="rodando",
            iniciado_em=datetime.now(timezone.utc),
        )
        self.db.add(geogrid)
        await self.db.flush()

        for p in grid_points:
            self.db.add(GeogridPoint(
                geogrid_id=geogrid.id,
                idx=p["idx"],
                row=p["row"],
                col=p["col"],
                lat=p["lat"],
                lng=p["lng"],
                status="pendente",
            ))
        await self.db.flush()
        await self.db.commit()

        return geogrid.id, None
