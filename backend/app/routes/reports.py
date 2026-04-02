from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.controllers.report_controller import ReportController

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/funnel")
async def get_funnel(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    controller = ReportController(db)
    return await controller.get_funnel(current_user)


@router.get("/revenue")
async def get_revenue(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    controller = ReportController(db)
    return await controller.get_revenue(current_user)


@router.get("/performance")
async def get_performance(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    controller = ReportController(db)
    return await controller.get_performance(current_user)
