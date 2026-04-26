from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.services.geogrid_service import GeogridService
from app.schemas.geogrid import (
    GeogridStartRequest, GeogridResponse, GeogridDetailResponse, GeogridPointResponse,
)


class GeogridController:
    def __init__(self, db: AsyncSession):
        self.service = GeogridService(db)

    async def list_user(self, current_user: User):
        items = await self.service.list_for_user(current_user.id)
        return [GeogridResponse.model_validate(g) for g in items]

    async def list_by_lead(self, lead_id: int, current_user: User):
        items = await self.service.list_by_lead(lead_id, current_user.id)
        return [GeogridResponse.model_validate(g) for g in items]

    async def get_detail(self, geogrid_id: int, current_user: User):
        result = await self.service.get_detail(geogrid_id, current_user.id)
        if not result:
            return None
        geo, points, lead_nome = result
        return GeogridDetailResponse(
            **GeogridResponse.model_validate(geo).model_dump(),
            points=[GeogridPointResponse.model_validate(p) for p in points],
            lead_nome=lead_nome,
        )

    async def start(self, current_user: User, data: GeogridStartRequest) -> dict:
        geogrid_id, err = await self.service.start(
            usuario_id=current_user.id,
            lead_id=data.lead_id,
            keyword=data.keyword,
            grid_size=data.grid_size,
            spacing_meters=data.spacing_meters,
            zoom=data.zoom,
            radius=data.radius,
        )
        if err or not geogrid_id:
            return {"error": err or "Falha ao iniciar geogrid"}

        from app.workers.geogrid_tasks import run_geogrid
        task = run_geogrid.apply_async(args=[geogrid_id], queue="geogrid")
        return {
            "geogrid_id": geogrid_id,
            "task_id": task.id,
            "message": "Geogrid iniciado",
        }
