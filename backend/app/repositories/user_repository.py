from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from app.models.user import User
from app.models.payment import ConfiguracaoUsuario
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    def __init__(self, db: AsyncSession):
        super().__init__(User, db)

    async def get_by_email(self, email: str) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def get_with_config(self, user_id: int) -> Optional[User]:
        from sqlalchemy.orm import selectinload
        result = await self.db.execute(
            select(User)
            .options(selectinload(User.configuracoes))
            .where(User.id == user_id)
        )
        return result.scalar_one_or_none()


class ConfiguracaoUsuarioRepository(BaseRepository[ConfiguracaoUsuario]):
    def __init__(self, db: AsyncSession):
        super().__init__(ConfiguracaoUsuario, db)

    async def get_by_usuario(self, usuario_id: int) -> Optional[ConfiguracaoUsuario]:
        result = await self.db.execute(
            select(ConfiguracaoUsuario).where(ConfiguracaoUsuario.usuario_id == usuario_id)
        )
        return result.scalar_one_or_none()

    async def upsert(self, usuario_id: int, data: dict) -> ConfiguracaoUsuario:
        config = await self.get_by_usuario(usuario_id)
        if config:
            for key, value in data.items():
                setattr(config, key, value)
            self.db.add(config)
            await self.db.flush()
            await self.db.refresh(config)
            return config
        else:
            data["usuario_id"] = usuario_id
            return await self.create(data)
