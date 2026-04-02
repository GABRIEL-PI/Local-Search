from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.services.lead_service import LeadService
from app.schemas.lead import (
    LeadCreate, LeadUpdate, LeadStatusUpdate, NoteCreate, TagAssign,
    ScrapeRequest, PaginatedLeads, LeadResponse, NotaResponse
)


class LeadController:
    def __init__(self, db: AsyncSession):
        self.service = LeadService(db)

    async def list_leads(
        self,
        current_user: User,
        cidade: Optional[str] = None,
        categoria: Optional[str] = None,
        score_min: Optional[int] = None,
        score_max: Optional[int] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> PaginatedLeads:
        total, leads = await self.service.get_leads(
            usuario_id=current_user.id,
            cidade=cidade,
            categoria=categoria,
            score_min=score_min,
            score_max=score_max,
            status=status,
            search=search,
            skip=skip,
            limit=limit,
        )
        return PaginatedLeads(total=total, skip=skip, limit=limit, items=leads)

    async def create_lead(self, current_user: User, data: LeadCreate):
        return await self.service.create_lead(current_user.id, data)

    async def get_lead(self, lead_id: int, current_user: User):
        return await self.service.get_lead(lead_id, current_user.id)

    async def update_lead_status(self, lead_id: int, current_user: User, data: LeadStatusUpdate):
        return await self.service.update_status(lead_id, current_user.id, data)

    async def delete_lead(self, lead_id: int, current_user: User) -> dict:
        await self.service.delete_lead(lead_id, current_user.id)
        return {"message": "Lead removido com sucesso"}

    async def start_scraping(self, current_user: User, data: ScrapeRequest) -> dict:
        session_id = await self.service.start_scraping(
            usuario_id=current_user.id,
            cidade=data.cidade,
            estado=data.estado,
            categoria=data.categoria,
            limite=data.limite,
        )

        from app.workers.scraper_tasks import scrape_google_maps
        task = scrape_google_maps.apply_async(
            args=[session_id, data.cidade, data.categoria, data.limite, data.estado],
            queue="scraping",
        )

        return {
            "session_id": session_id,
            "task_id": task.id,
            "message": f"Scraping iniciado para '{data.categoria}' em {data.cidade}",
        }

    async def get_notes(self, lead_id: int, current_user: User):
        return await self.service.get_notes(lead_id, current_user.id)

    async def add_note(self, lead_id: int, current_user: User, data: NoteCreate):
        return await self.service.add_note(lead_id, current_user.id, data)

    async def assign_tags(self, lead_id: int, current_user: User, data: TagAssign):
        return await self.service.assign_tags(lead_id, current_user.id, data)

    async def get_dashboard_stats(self, current_user: User) -> dict:
        return await self.service.get_dashboard_stats(current_user.id)

    async def get_scraping_sessions(self, current_user: User):
        return await self.service.get_scraping_sessions(current_user.id)
