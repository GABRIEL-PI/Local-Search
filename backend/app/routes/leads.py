from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.controllers.lead_controller import LeadController
from app.schemas.lead import (
    LeadCreate, LeadUpdate, LeadStatusUpdate,
    NoteCreate, TagAssign, ScrapeRequest,
    PaginatedLeads, LeadResponse, LeadDetailResponse, NotaResponse
)

router = APIRouter(prefix="/leads", tags=["leads"])


@router.get("", response_model=PaginatedLeads)
async def list_leads(
    cidade: Optional[str] = Query(None),
    categoria: Optional[str] = Query(None),
    score_min: Optional[int] = Query(None),
    score_max: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    controller = LeadController(db)
    return await controller.list_leads(
        current_user=current_user,
        cidade=cidade,
        categoria=categoria,
        score_min=score_min,
        score_max=score_max,
        status=status,
        search=search,
        skip=skip,
        limit=limit,
    )


@router.post("", response_model=LeadResponse, status_code=201)
async def create_lead(
    data: LeadCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    controller = LeadController(db)
    return await controller.create_lead(current_user, data)


@router.get("/dashboard-stats")
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    controller = LeadController(db)
    return await controller.get_dashboard_stats(current_user)


@router.get("/scraping-sessions")
async def get_scraping_sessions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    controller = LeadController(db)
    return await controller.get_scraping_sessions(current_user)


@router.post("/scrape")
async def start_scraping(
    data: ScrapeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    controller = LeadController(db)
    return await controller.start_scraping(current_user, data)


@router.get("/{lead_id}", response_model=LeadDetailResponse)
async def get_lead(
    lead_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    controller = LeadController(db)
    return await controller.get_lead(lead_id, current_user)


@router.put("/{lead_id}/status", response_model=LeadResponse)
async def update_lead_status(
    lead_id: int,
    data: LeadStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    controller = LeadController(db)
    return await controller.update_lead_status(lead_id, current_user, data)


@router.delete("/{lead_id}")
async def delete_lead(
    lead_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    controller = LeadController(db)
    return await controller.delete_lead(lead_id, current_user)


@router.get("/{lead_id}/notes", response_model=list[NotaResponse])
async def get_notes(
    lead_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    controller = LeadController(db)
    return await controller.get_notes(lead_id, current_user)


@router.post("/{lead_id}/notes", response_model=NotaResponse, status_code=201)
async def add_note(
    lead_id: int,
    data: NoteCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    controller = LeadController(db)
    return await controller.add_note(lead_id, current_user, data)


@router.post("/{lead_id}/tags")
async def assign_tags(
    lead_id: int,
    data: TagAssign,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    controller = LeadController(db)
    return await controller.assign_tags(lead_id, current_user, data)
