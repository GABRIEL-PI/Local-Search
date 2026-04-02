from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.controllers.auth_controller import AuthController
from app.models.user import User
from app.schemas.auth import RegisterRequest, LoginRequest, RefreshRequest, AuthResponse, TokenResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", status_code=201)
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


@router.get("/pending-users")
async def pending_users(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Acesso negado")
    result = await db.execute(select(User).where(User.aprovado == False))
    users = result.scalars().all()
    return [{"id": u.id, "nome": u.nome, "email": u.email, "criado_em": str(u.criado_em)} for u in users]


@router.post("/approve-user/{user_id}")
async def approve_user(user_id: int, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Acesso negado")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    user.aprovado = True
    db.add(user)
    await db.commit()
    return {"message": f"Usuário {user.nome} aprovado com sucesso"}


@router.delete("/reject-user/{user_id}")
async def reject_user(user_id: int, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Acesso negado")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    await db.delete(user)
    await db.commit()
    return {"message": f"Solicitação de {user.nome} rejeitada"}
