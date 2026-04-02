from sqlalchemy import (
    String, Boolean, DateTime, Enum, Integer, Float, Text, JSON,
    ForeignKey, DECIMAL, UniqueConstraint
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from datetime import datetime
from typing import Optional, List

from app.core.database import Base


class Lead(Base):
    __tablename__ = "leads"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    usuario_id: Mapped[int] = mapped_column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, index=True)
    nome: Mapped[str] = mapped_column(String(255), nullable=False)
    categoria: Mapped[Optional[str]] = mapped_column(String(150))
    endereco: Mapped[Optional[str]] = mapped_column(String(500))
    telefone: Mapped[Optional[str]] = mapped_column(String(30))
    whatsapp: Mapped[Optional[str]] = mapped_column(String(30))
    email: Mapped[Optional[str]] = mapped_column(String(200))
    horario: Mapped[Optional[str]] = mapped_column(String(500))
    fotos_count: Mapped[Optional[int]] = mapped_column(Integer)
    rating: Mapped[Optional[float]] = mapped_column(DECIMAL(3, 1))
    reviews_count: Mapped[Optional[int]] = mapped_column(Integer)
    tem_site: Mapped[bool] = mapped_column(Boolean, default=False)
    url_site: Mapped[Optional[str]] = mapped_column(String(500))
    site_score: Mapped[Optional[int]] = mapped_column(Integer)
    ssl_valido: Mapped[Optional[bool]] = mapped_column(Boolean)
    mobile_friendly: Mapped[Optional[bool]] = mapped_column(Boolean)
    dominio_disponivel: Mapped[Optional[bool]] = mapped_column(Boolean)
    dominio_sugerido: Mapped[Optional[str]] = mapped_column(String(255))
    lead_score: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(
        Enum(
            "prospectado", "proposta_gerada", "abordado", "respondeu",
            "negociando", "fechado", "perdido",
            name="lead_status_enum"
        ),
        default="prospectado",
        nullable=False,
    )
    google_maps_link: Mapped[Optional[str]] = mapped_column(String(1000))
    latitude: Mapped[Optional[float]] = mapped_column(Float)
    longitude: Mapped[Optional[float]] = mapped_column(Float)
    place_id: Mapped[Optional[str]] = mapped_column(String(255))
    price_range: Mapped[Optional[str]] = mapped_column(String(50))
    dados_extras: Mapped[Optional[dict]] = mapped_column(JSON)
    cidade: Mapped[Optional[str]] = mapped_column(String(150))
    estado: Mapped[Optional[str]] = mapped_column(String(2))
    data_coleta: Mapped[Optional[datetime]] = mapped_column(DateTime)
    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    usuario: Mapped["User"] = relationship("User", back_populates="leads")
    propostas: Mapped[List["Proposta"]] = relationship("Proposta", back_populates="lead", lazy="select")
    disparos: Mapped[List["Disparo"]] = relationship("Disparo", back_populates="lead", lazy="select")
    followups: Mapped[List["Followup"]] = relationship("Followup", back_populates="lead", lazy="select")
    notas: Mapped[List["Nota"]] = relationship("Nota", back_populates="lead", lazy="select")
    status_history: Mapped[List["LeadStatusHistory"]] = relationship(
        "LeadStatusHistory", back_populates="lead", lazy="select"
    )
    lead_tags: Mapped[List["LeadTag"]] = relationship("LeadTag", back_populates="lead", lazy="select")
    cliente: Mapped[Optional["Cliente"]] = relationship("Cliente", back_populates="lead", uselist=False, lazy="select")


class LeadStatusHistory(Base):
    __tablename__ = "lead_status_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    lead_id: Mapped[int] = mapped_column(Integer, ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True)
    status_anterior: Mapped[Optional[str]] = mapped_column(String(50))
    status_novo: Mapped[str] = mapped_column(String(50), nullable=False)
    usuario_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"))
    observacao: Mapped[Optional[str]] = mapped_column(Text)
    criado_em: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    lead: Mapped["Lead"] = relationship("Lead", back_populates="status_history")


class Tag(Base):
    __tablename__ = "tags"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nome: Mapped[str] = mapped_column(String(100), nullable=False)
    cor: Mapped[str] = mapped_column(String(7), default="#3B82F6")
    usuario_id: Mapped[int] = mapped_column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)

    usuario: Mapped["User"] = relationship("User", back_populates="tags")
    lead_tags: Mapped[List["LeadTag"]] = relationship("LeadTag", back_populates="tag", lazy="select")


class LeadTag(Base):
    __tablename__ = "lead_tags"

    lead_id: Mapped[int] = mapped_column(Integer, ForeignKey("leads.id", ondelete="CASCADE"), primary_key=True)
    tag_id: Mapped[int] = mapped_column(Integer, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True)

    lead: Mapped["Lead"] = relationship("Lead", back_populates="lead_tags")
    tag: Mapped["Tag"] = relationship("Tag", back_populates="lead_tags")


class Nota(Base):
    __tablename__ = "notas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    lead_id: Mapped[int] = mapped_column(Integer, ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True)
    usuario_id: Mapped[int] = mapped_column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    conteudo: Mapped[str] = mapped_column(Text, nullable=False)
    criado_em: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    lead: Mapped["Lead"] = relationship("Lead", back_populates="notas")


class SessionScraping(Base):
    __tablename__ = "sessions_scraping"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    usuario_id: Mapped[int] = mapped_column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, index=True)
    cidade: Mapped[str] = mapped_column(String(150), nullable=False)
    estado: Mapped[Optional[str]] = mapped_column(String(2))
    categoria: Mapped[str] = mapped_column(String(150), nullable=False)
    status: Mapped[str] = mapped_column(
        Enum("rodando", "concluido", "erro", "pausado", name="session_status_enum"),
        default="rodando",
    )
    leads_encontrados: Mapped[int] = mapped_column(Integer, default=0)
    leads_salvos: Mapped[int] = mapped_column(Integer, default=0)
    iniciado_em: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    finalizado_em: Mapped[Optional[datetime]] = mapped_column(DateTime)
    erro_descricao: Mapped[Optional[str]] = mapped_column(Text)

    usuario: Mapped["User"] = relationship("User", back_populates="sessions_scraping")
