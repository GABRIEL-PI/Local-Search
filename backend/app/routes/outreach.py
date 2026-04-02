from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.controllers.outreach_controller import OutreachController
from app.schemas.outreach import (
    OutreachSendRequest, DisparoResponse, WhatsAppAccountCreate, WhatsAppAccountResponse
)

router = APIRouter(prefix="/outreach", tags=["outreach"])


@router.get("/queue")
async def get_queue(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    controller = OutreachController(db)
    return await controller.get_queue(current_user)


@router.post("/send", response_model=DisparoResponse, status_code=201)
async def send_outreach(
    data: OutreachSendRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    controller = OutreachController(db)
    return await controller.send_outreach(current_user, data)


@router.get("/{disparo_id}", response_model=DisparoResponse)
async def get_disparo(
    disparo_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    controller = OutreachController(db)
    return await controller.get_disparo(disparo_id, current_user)
