from sqlalchemy import (
    String, DateTime, Integer, Float, JSON, ForeignKey, Enum, Text,
)
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from typing import Optional

from app.core.database import Base


class Geogrid(Base):
    __tablename__ = "geogrid_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    usuario_id: Mapped[int] = mapped_column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, index=True)
    lead_id: Mapped[int] = mapped_column(Integer, ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True)
    keyword: Mapped[str] = mapped_column(String(255), nullable=False)
    center_lat: Mapped[float] = mapped_column(Float, nullable=False)
    center_lng: Mapped[float] = mapped_column(Float, nullable=False)
    grid_size: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    spacing_meters: Mapped[int] = mapped_column(Integer, default=400, nullable=False)
    zoom: Mapped[int] = mapped_column(Integer, default=15, nullable=False)
    radius: Mapped[int] = mapped_column(Integer, default=500, nullable=False)
    total_pontos: Mapped[int] = mapped_column(Integer, default=0)
    pontos_concluidos: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(
        Enum("rodando", "concluido", "erro", "pausado", name="geogrid_status_enum"),
        default="rodando",
        nullable=False,
    )
    erro_descricao: Mapped[Optional[str]] = mapped_column(Text)
    iniciado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    finalizado_em: Mapped[Optional[datetime]] = mapped_column(DateTime)


class GeogridPoint(Base):
    __tablename__ = "geogrid_points"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    geogrid_id: Mapped[int] = mapped_column(Integer, ForeignKey("geogrid_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    idx: Mapped[int] = mapped_column(Integer, nullable=False)
    row: Mapped[int] = mapped_column(Integer, nullable=False)
    col: Mapped[int] = mapped_column(Integer, nullable=False)
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lng: Mapped[float] = mapped_column(Float, nullable=False)
    rank: Mapped[Optional[int]] = mapped_column(Integer)
    competitors: Mapped[Optional[dict]] = mapped_column(JSON)
    status: Mapped[str] = mapped_column(
        Enum("pendente", "rodando", "concluido", "erro", name="geogrid_point_status_enum"),
        default="pendente",
        nullable=False,
    )
    erro_descricao: Mapped[Optional[str]] = mapped_column(Text)
    atualizado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
