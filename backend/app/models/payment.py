from sqlalchemy import String, Boolean, DateTime, Enum, Integer, ForeignKey, DECIMAL, Date, Text, Time, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from datetime import datetime, date, time
from typing import Optional

from app.core.database import Base


class Cliente(Base):
    __tablename__ = "clientes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    lead_id: Mapped[int] = mapped_column(Integer, ForeignKey("leads.id", ondelete="RESTRICT"), unique=True, nullable=False)
    usuario_id: Mapped[int] = mapped_column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    plano: Mapped[str] = mapped_column(
        Enum("basico", "padrao", "premium", "pro", name="cliente_plano_enum"),
        default="basico",
    )
    valor_mensalidade: Mapped[Optional[float]] = mapped_column(DECIMAL(10, 2))
    data_inicio: Mapped[Optional[date]] = mapped_column(Date)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    lead: Mapped["Lead"] = relationship("Lead", back_populates="cliente")
    usuario: Mapped["User"] = relationship("User", back_populates="clientes")
    pagamentos: Mapped[list["Pagamento"]] = relationship("Pagamento", back_populates="cliente", lazy="select")


class Pagamento(Base):
    __tablename__ = "pagamentos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    cliente_id: Mapped[int] = mapped_column(Integer, ForeignKey("clientes.id", ondelete="CASCADE"), nullable=False, index=True)
    valor: Mapped[float] = mapped_column(DECIMAL(10, 2), nullable=False)
    status: Mapped[str] = mapped_column(
        Enum("pendente", "pago", "falhou", "cancelado", name="pagamento_status_enum"),
        default="pendente",
    )
    metodo: Mapped[Optional[str]] = mapped_column(
        Enum("stripe", "pagarme", "pix", "boleto", name="pagamento_metodo_enum")
    )
    referencia_externa: Mapped[Optional[str]] = mapped_column(String(255))
    data_vencimento: Mapped[Optional[date]] = mapped_column(Date)
    data_pagamento: Mapped[Optional[datetime]] = mapped_column(DateTime)
    criado_em: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    cliente: Mapped["Cliente"] = relationship("Cliente", back_populates="pagamentos")


class ConfiguracaoUsuario(Base):
    __tablename__ = "configuracoes_usuario"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    usuario_id: Mapped[int] = mapped_column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), unique=True, nullable=False)
    limite_disparos_dia: Mapped[int] = mapped_column(Integer, default=50)
    horario_inicio: Mapped[str] = mapped_column(String(5), default="08:00")
    horario_fim: Mapped[str] = mapped_column(String(5), default="19:00")
    claude_api_key: Mapped[Optional[str]] = mapped_column(Text)
    evolution_api_url: Mapped[Optional[str]] = mapped_column(String(500))
    evolution_api_key: Mapped[Optional[str]] = mapped_column(Text)
    stripe_key: Mapped[Optional[str]] = mapped_column(Text)
    criado_em: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    usuario: Mapped["User"] = relationship("User", back_populates="configuracoes")
