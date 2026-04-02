from datetime import timedelta
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    verify_password, get_password_hash,
    create_access_token, create_refresh_token,
    verify_refresh_token
)
from app.core.config import settings
from app.repositories.user_repository import UserRepository
from app.models.user import User
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, AuthResponse


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)

    async def register(self, data: RegisterRequest) -> dict:
        existing = await self.user_repo.get_by_email(data.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="E-mail já cadastrado",
            )

        hashed = get_password_hash(data.senha)
        user = await self.user_repo.create({
            "nome": data.nome,
            "email": data.email,
            "senha_hash": hashed,
            "plano": "free",
            "ativo": True,
            "aprovado": False,
            "is_admin": False,
        })

        return {
            "message": "Solicitação de registro enviada! Aguarde a aprovação do administrador.",
            "user_id": user.id,
        }

    async def login(self, data: LoginRequest) -> AuthResponse:
        user = await self.user_repo.get_by_email(data.email)
        if not user or not verify_password(data.senha, user.senha_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="E-mail ou senha incorretos",
            )

        if not user.ativo:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Conta desativada",
            )

        if not user.aprovado:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Sua conta ainda não foi aprovada. Aguarde a aprovação do administrador.",
            )

        tokens = self._generate_tokens(user)
        return AuthResponse(
            user={"id": user.id, "nome": user.nome, "email": user.email, "plano": user.plano, "ativo": user.ativo},
            **tokens,
        )

    async def refresh(self, refresh_token: str) -> TokenResponse:
        payload = verify_refresh_token(refresh_token)
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token inválido ou expirado",
            )

        user_id = payload.get("sub")
        user = await self.user_repo.get_by_id(int(user_id))
        if not user or not user.ativo:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Usuário não encontrado",
            )

        tokens = self._generate_tokens(user)
        return TokenResponse(**tokens)

    def _generate_tokens(self, user: User) -> dict:
        data = {"sub": str(user.id), "email": user.email}
        access_token = create_access_token(data)
        refresh_token = create_refresh_token(data)
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
        }
