from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime


class GeogridStartRequest(BaseModel):
    lead_id: int
    keyword: Optional[str] = None
    grid_size: int = 5
    spacing_meters: int = 400
    zoom: int = 15
    radius: int = 500


class GeogridPointResponse(BaseModel):
    id: int
    idx: int
    row: int
    col: int
    lat: float
    lng: float
    rank: Optional[int]
    competitors: Optional[Any]
    status: str
    erro_descricao: Optional[str]

    model_config = {"from_attributes": True}


class GeogridResponse(BaseModel):
    id: int
    usuario_id: int
    lead_id: int
    keyword: str
    center_lat: float
    center_lng: float
    grid_size: int
    spacing_meters: int
    zoom: int
    radius: int
    total_pontos: int
    pontos_concluidos: int
    status: str
    erro_descricao: Optional[str]
    iniciado_em: datetime
    finalizado_em: Optional[datetime]

    model_config = {"from_attributes": True}


class GeogridDetailResponse(GeogridResponse):
    points: List[GeogridPointResponse] = []
    lead_nome: Optional[str] = None
