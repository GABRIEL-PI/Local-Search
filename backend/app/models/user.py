from sqlalchemy import String, Boolean, DateTime, Enum, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from datetime import datetime
from typing import Optional, List

from app.core.database import Base


class User(Base):
    __tablename__ = "usuarios"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nome: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(200), unique=True, nullable=False, index=True)
    senha_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    plano: Mapped[str] = mapped_column(
        Enum("free", "starter", "pro", "agency", name="plano_enum"),
        default="free",
        nullable=False,
    )
    ativo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    criado_em: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )

    # Relationships
    leads: Mapped[List["Lead"]] = relationship("Lead", back_populates="usuario", lazy="select")
    propostas: Mapped[List["Proposta"]] = relationship("Proposta", back_populates="usuario", foreign_keys="[Proposta.usuario_id]", lazy="select")
    configuracoes: Mapped[Optional["ConfiguracaoUsuario"]] = relationship(
        "ConfiguracaoUsuario", back_populates="usuario", uselist=False, lazy="select"
    )
    whatsapp_contas: Mapped[List["WhatsAppConta"]] = relationship(
        "WhatsAppConta", back_populates="usuario", lazy="select"
    )
    sessions_scraping: Mapped[List["SessionScraping"]] = relationship(
        "SessionScraping", back_populates="usuario", lazy="select"
    )
    tags: Mapped[List["Tag"]] = relationship("Tag", back_populates="usuario", lazy="select")
    clientes: Mapped[List["Cliente"]] = relationship("Cliente", back_populates="usuario", lazy="select")
