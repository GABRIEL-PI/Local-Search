from pydantic import BaseModel, HttpUrl
from typing import Optional, List, Any
from datetime import datetime


class LeadCreate(BaseModel):
    nome: str
    categoria: Optional[str] = None
    endereco: Optional[str] = None
    telefone: Optional[str] = None
    whatsapp: Optional[str] = None
    email: Optional[str] = None
    horario: Optional[str] = None
    fotos_count: Optional[int] = None
    rating: Optional[float] = None
    reviews_count: Optional[int] = None
    tem_site: bool = False
    url_site: Optional[str] = None
    cidade: Optional[str] = None
    estado: Optional[str] = None


class LeadUpdate(BaseModel):
    nome: Optional[str] = None
    categoria: Optional[str] = None
    endereco: Optional[str] = None
    telefone: Optional[str] = None
    whatsapp: Optional[str] = None
    email: Optional[str] = None
    horario: Optional[str] = None
    fotos_count: Optional[int] = None
    rating: Optional[float] = None
    reviews_count: Optional[int] = None
    tem_site: Optional[bool] = None
    url_site: Optional[str] = None
    site_score: Optional[int] = None
    ssl_valido: Optional[bool] = None
    mobile_friendly: Optional[bool] = None
    dominio_disponivel: Optional[bool] = None
    dominio_sugerido: Optional[str] = None
    cidade: Optional[str] = None
    estado: Optional[str] = None


class LeadStatusUpdate(BaseModel):
    status: str
    observacao: Optional[str] = None


class TagResponse(BaseModel):
    id: int
    nome: str
    cor: str

    model_config = {"from_attributes": True}


class NotaResponse(BaseModel):
    id: int
    conteudo: str
    usuario_id: int
    criado_em: datetime

    model_config = {"from_attributes": True}


class LeadResponse(BaseModel):
    id: int
    usuario_id: int
    nome: str
    categoria: Optional[str]
    endereco: Optional[str]
    telefone: Optional[str]
    whatsapp: Optional[str]
    email: Optional[str]
    horario: Optional[str]
    fotos_count: Optional[int]
    rating: Optional[float]
    reviews_count: Optional[int]
    tem_site: bool
    url_site: Optional[str]
    site_score: Optional[int]
    ssl_valido: Optional[bool]
    mobile_friendly: Optional[bool]
    dominio_disponivel: Optional[bool]
    dominio_sugerido: Optional[str]
    google_maps_link: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    place_id: Optional[str] = None
    price_range: Optional[str] = None
    dados_extras: Optional[Any] = None
    lead_score: int
    status: str
    cidade: Optional[str]
    estado: Optional[str]
    data_coleta: Optional[datetime]
    atualizado_em: datetime

    model_config = {"from_attributes": True}


class LeadDetailResponse(LeadResponse):
    notas: List[NotaResponse] = []
    tags: List[TagResponse] = []


class LeadFilters(BaseModel):
    cidade: Optional[str] = None
    categoria: Optional[str] = None
    score_min: Optional[int] = None
    score_max: Optional[int] = None
    status: Optional[str] = None
    search: Optional[str] = None
    skip: int = 0
    limit: int = 20


class ScrapeRequest(BaseModel):
    cidade: str
    estado: Optional[str] = None
    categoria: str
    limite: int = 50


class NoteCreate(BaseModel):
    conteudo: str


class TagAssign(BaseModel):
    tag_ids: List[int]


class TagCreate(BaseModel):
    nome: str
    cor: str = "#3B82F6"


class PaginatedLeads(BaseModel):
    total: int
    skip: int
    limit: int
    items: List[LeadResponse]
