from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.controllers.receita_controller import ReceitaController
from app.schemas.receita import (
    ReceitaSearchRequest, ReceitaImportRequest, ReceitaSyncRequest,
)

router = APIRouter(prefix="/receita", tags=["receita"])


@router.post("/search")
async def search_receita(
    data: ReceitaSearchRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await ReceitaController(db).search(current_user, data)


@router.post("/import")
async def import_leads(
    data: ReceitaImportRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await ReceitaController(db).import_leads(current_user, data)


@router.post("/sync")
async def sync_dump(
    data: ReceitaSyncRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await ReceitaController(db).sync(current_user, data)


@router.get("/status")
async def status(
    ano_mes: str | None = Query(None, pattern=r"^\d{4}-\d{2}$"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await ReceitaController(db).status(current_user, ano_mes)
