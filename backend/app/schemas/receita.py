from typing import Optional, List
from datetime import date
from pydantic import BaseModel, Field


class ReceitaSearchRequest(BaseModel):
    uf: str = Field(..., min_length=2, max_length=2)
    municipio: Optional[int] = Field(None, description="Codigo Receita do municipio")
    municipio_nome: Optional[str] = None
    cnaes: Optional[List[int]] = Field(None, description="Lista de CNAEs (codigo numerico)")
    cnae_prefixo: Optional[str] = Field(None, description='Prefixo CNAE, ex: "47" pra varejo')
    aberto_desde: Optional[date] = None
    aberto_ate: Optional[date] = None
    com_telefone: bool = True
    com_email: bool = False
    porte: Optional[List[str]] = Field(None, description='Lista: "01" micro, "03" pequeno, "05" grande')
    apenas_mei: Optional[bool] = None
    capital_min: Optional[float] = None
    limit: int = Field(100, ge=1, le=1000)


class ReceitaCandidate(BaseModel):
    cnpj: str
    cnpj_basico: str
    razao_social: Optional[str]
    nome_fantasia: Optional[str]
    cnae_principal: Optional[int]
    cnae_descricao: Optional[str]
    data_inicio_atividade: Optional[date]
    capital_social: Optional[float]
    porte: Optional[str]
    is_mei: Optional[bool]
    endereco: Optional[str]
    cep: Optional[str]
    municipio_nome: Optional[str]
    uf: Optional[str]
    telefone: Optional[str]
    email: Optional[str]


class ReceitaImportRequest(BaseModel):
    cnpjs: List[str] = Field(..., min_length=1, max_length=500)
    categoria_padrao: Optional[str] = Field(None, description="Categoria pra atribuir aos leads")


class ReceitaSyncRequest(BaseModel):
    ano_mes: Optional[str] = Field(None, pattern=r"^\d{4}-\d{2}$",
                                    description="Default = ultimo mes disponivel")
    only: Optional[List[str]] = Field(
        None, description='Prefixos: ["Cnaes","Municipios","Empresas","Estabelecimentos"]')
