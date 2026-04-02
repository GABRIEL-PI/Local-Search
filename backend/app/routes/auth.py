from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.controllers.auth_controller import AuthController
from app.schemas.auth import RegisterRequest, LoginRequest, RefreshRequest, AuthResponse, TokenResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse, status_code=201)
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    controller = AuthController(db)
    return await controller.register(data)


@router.post("/login", response_model=AuthResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    controller = AuthController(db)
    return await controller.login(data)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(data: RefreshRequest, db: AsyncSession = Depends(get_db)):
    controller = AuthController(db)
    return await controller.refresh(data)


@router.post("/logout")
async def logout():
    return {"message": "Logout realizado com sucesso"}
