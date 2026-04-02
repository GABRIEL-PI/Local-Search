from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserUpdate(BaseModel):
    nome: Optional[str] = None
    email: Optional[EmailStr] = None


class UserSettingsUpdate(BaseModel):
    limite_disparos_dia: Optional[int] = None
    horario_inicio: Optional[str] = None
    horario_fim: Optional[str] = None
    claude_api_key: Optional[str] = None
    evolution_api_url: Optional[str] = None
    evolution_api_key: Optional[str] = None
    stripe_key: Optional[str] = None


class UserSettingsResponse(BaseModel):
    id: int
    usuario_id: int
    limite_disparos_dia: int
    horario_inicio: str
    horario_fim: str
    evolution_api_url: Optional[str]
    has_claude_key: bool
    has_evolution_key: bool
    has_stripe_key: bool
    criado_em: datetime
    atualizado_em: datetime

    model_config = {"from_attributes": True}


class ClienteCreate(BaseModel):
    lead_id: int
    plano: str
    valor_mensalidade: float
    data_inicio: Optional[str] = None


class ClienteResponse(BaseModel):
    id: int
    lead_id: int
    usuario_id: int
    plano: str
    valor_mensalidade: Optional[float]
    data_inicio: Optional[str]
    ativo: bool
    criado_em: datetime

    model_config = {"from_attributes": True}
