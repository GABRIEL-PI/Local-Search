from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class OutreachSendRequest(BaseModel):
    lead_id: int
    proposta_id: int
    canal: str  # whatsapp | email
    mensagem: str
    agendado_para: Optional[datetime] = None


class DisparoResponse(BaseModel):
    id: int
    lead_id: int
    proposta_id: Optional[int]
    canal: str
    status: str
    mensagem_enviada: Optional[str]
    resposta_recebida: Optional[str]
    agendado_para: Optional[datetime]
    enviado_em: Optional[datetime]
    lido_em: Optional[datetime]
    respondido_em: Optional[datetime]
    tentativas: int
    erro_descricao: Optional[str]
    criado_em: datetime

    model_config = {"from_attributes": True}


class WhatsAppAccountCreate(BaseModel):
    nome: str
    instancia_id: str


class WhatsAppAccountResponse(BaseModel):
    id: int
    nome: str
    instancia_id: str
    status: str
    disparos_hoje: int
    criado_em: datetime

    model_config = {"from_attributes": True}


class OutreachQueueItem(BaseModel):
    disparo: DisparoResponse
    lead_nome: str
    lead_telefone: Optional[str]
    lead_whatsapp: Optional[str]


class WebhookWhatsAppMessage(BaseModel):
    instancia: str
    evento: str
    dados: dict
