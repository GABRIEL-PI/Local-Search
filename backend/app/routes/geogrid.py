from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.controllers.geogrid_controller import GeogridController
from app.schemas.geogrid import GeogridStartRequest

router = APIRouter(prefix="/geogrid", tags=["geogrid"])


@router.post("/start")
async def start_geogrid(
    data: GeogridStartRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    controller = GeogridController(db)
    return await controller.start(current_user, data)


@router.get("")
async def list_geogrid(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    controller = GeogridController(db)
    return await controller.list_user(current_user)


@router.get("/by-lead/{lead_id}")
async def list_by_lead(
    lead_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    controller = GeogridController(db)
    return await controller.list_by_lead(lead_id, current_user)


@router.get("/{geogrid_id}")
async def get_geogrid(
    geogrid_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    controller = GeogridController(db)
    result = await controller.get_detail(geogrid_id, current_user)
    if not result:
        raise HTTPException(404, detail="Geogrid não encontrado")
    return result
