from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ProposalGenerateRequest(BaseModel):
    lead_id: int


class ProposalUpdate(BaseModel):
    argumento_venda: Optional[str] = None
    mensagem_formal: Optional[str] = None
    mensagem_descontraida: Optional[str] = None
    mensagem_urgencia: Optional[str] = None
    landing_page_html: Optional[str] = None
    preco_sugerido: Optional[float] = None
    mensalidade_sugerida: Optional[float] = None


class ProposalResponse(BaseModel):
    id: int
    lead_id: int
    usuario_id: int
    argumento_venda: Optional[str]
    mensagem_formal: Optional[str]
    mensagem_descontraida: Optional[str]
    mensagem_urgencia: Optional[str]
    landing_page_html: Optional[str]
    landing_page_screenshot_path: Optional[str]
    preco_sugerido: Optional[float]
    mensalidade_sugerida: Optional[float]
    status: str
    criado_em: datetime
    aprovado_em: Optional[datetime]

    model_config = {"from_attributes": True}


class ProposalTaskResponse(BaseModel):
    task_id: str
    proposta_id: Optional[int] = None
    message: str
