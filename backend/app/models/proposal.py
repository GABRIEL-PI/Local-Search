from sqlalchemy import String, Text, DateTime, Enum, Integer, ForeignKey, DECIMAL
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from datetime import datetime
from typing import Optional

from app.core.database import Base


class Proposta(Base):
    __tablename__ = "propostas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    lead_id: Mapped[int] = mapped_column(Integer, ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True)
    usuario_id: Mapped[int] = mapped_column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    argumento_venda: Mapped[Optional[str]] = mapped_column(Text)
    mensagem_formal: Mapped[Optional[str]] = mapped_column(Text)
    mensagem_descontraida: Mapped[Optional[str]] = mapped_column(Text)
    mensagem_urgencia: Mapped[Optional[str]] = mapped_column(Text)
    landing_page_html: Mapped[Optional[str]] = mapped_column(Text)
    landing_page_screenshot_path: Mapped[Optional[str]] = mapped_column(String(500))
    preco_sugerido: Mapped[Optional[float]] = mapped_column(DECIMAL(10, 2))
    mensalidade_sugerida: Mapped[Optional[float]] = mapped_column(DECIMAL(10, 2))
    status: Mapped[str] = mapped_column(
        Enum("rascunho", "aprovada", "enviada", "recusada", name="proposta_status_enum"),
        default="rascunho",
        nullable=False,
    )
    criado_em: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    aprovado_em: Mapped[Optional[datetime]] = mapped_column(DateTime)
    aprovado_por: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"))

    lead: Mapped["Lead"] = relationship("Lead", back_populates="propostas")
    usuario: Mapped["User"] = relationship("User", foreign_keys=[usuario_id], back_populates="propostas")
    disparos: Mapped[list["Disparo"]] = relationship("Disparo", back_populates="proposta", lazy="select")
