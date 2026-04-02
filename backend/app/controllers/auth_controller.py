from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.auth_service import AuthService
from app.schemas.auth import RegisterRequest, LoginRequest, RefreshRequest, AuthResponse, TokenResponse


class AuthController:
    def __init__(self, db: AsyncSession):
        self.service = AuthService(db)

    async def register(self, data: RegisterRequest) -> AuthResponse:
        return await self.service.register(data)

    async def login(self, data: LoginRequest) -> AuthResponse:
        return await self.service.login(data)

    async def refresh(self, data: RefreshRequest) -> TokenResponse:
        return await self.service.refresh(data.refresh_token)

    async def logout(self) -> dict:
        return {"message": "Logout realizado com sucesso"}
