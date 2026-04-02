from sqlalchemy import String, Text, DateTime, Enum, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from datetime import datetime
from typing import Optional

from app.core.database import Base


class Disparo(Base):
    __tablename__ = "disparos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    lead_id: Mapped[int] = mapped_column(Integer, ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True)
    proposta_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("propostas.id", ondelete="SET NULL"))
    canal: Mapped[str] = mapped_column(
        Enum("whatsapp", "email", name="canal_enum"),
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        Enum("pendente", "enviado", "entregue", "lido", "respondido", "erro", name="disparo_status_enum"),
        default="pendente",
        nullable=False,
    )
    mensagem_enviada: Mapped[Optional[str]] = mapped_column(Text)
    resposta_recebida: Mapped[Optional[str]] = mapped_column(Text)
    agendado_para: Mapped[Optional[datetime]] = mapped_column(DateTime)
    enviado_em: Mapped[Optional[datetime]] = mapped_column(DateTime)
    lido_em: Mapped[Optional[datetime]] = mapped_column(DateTime)
    respondido_em: Mapped[Optional[datetime]] = mapped_column(DateTime)
    tentativas: Mapped[int] = mapped_column(Integer, default=0)
    erro_descricao: Mapped[Optional[str]] = mapped_column(Text)
    criado_em: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    lead: Mapped["Lead"] = relationship("Lead", back_populates="disparos")
    proposta: Mapped[Optional["Proposta"]] = relationship("Proposta", back_populates="disparos")


class Followup(Base):
    __tablename__ = "followups"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    lead_id: Mapped[int] = mapped_column(Integer, ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True)
    sequencia: Mapped[str] = mapped_column(
        Enum("1", "2", "3", name="sequencia_enum"),
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        Enum("pendente", "enviado", "cancelado", name="followup_status_enum"),
        default="pendente",
        nullable=False,
    )
    agendado_para: Mapped[Optional[datetime]] = mapped_column(DateTime)
    executado_em: Mapped[Optional[datetime]] = mapped_column(DateTime)
    criado_em: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    lead: Mapped["Lead"] = relationship("Lead", back_populates="followups")


class WhatsAppConta(Base):
    __tablename__ = "whatsapp_contas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    usuario_id: Mapped[int] = mapped_column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, index=True)
    nome: Mapped[str] = mapped_column(String(150), nullable=False)
    instancia_id: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(
        Enum("conectado", "desconectado", "qrcode", name="whatsapp_status_enum"),
        default="desconectado",
    )
    disparos_hoje: Mapped[int] = mapped_column(Integer, default=0)
    criado_em: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    usuario: Mapped["User"] = relationship("User", back_populates="whatsapp_contas")
