from sqlalchemy import (
    String, Integer, DateTime, BigInteger, Date, DECIMAL, Text, Index,
    PrimaryKeyConstraint, CHAR, SmallInteger
)
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from datetime import datetime, date
from typing import Optional

from app.core.database import Base


class ReceitaMeta(Base):
    """Histórico de runs de ingestão do dump da Receita.

    Cada arquivo (Empresas0.zip, Estabelecimentos3.zip, etc) vira uma linha por mês.
    """
    __tablename__ = "receita_meta"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ano_mes: Mapped[str] = mapped_column(CHAR(7), nullable=False, index=True)
    arquivo: Mapped[str] = mapped_column(String(60), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, server_default="pendente")
    bytes_baixados: Mapped[Optional[int]] = mapped_column(BigInteger)
    bytes_total: Mapped[Optional[int]] = mapped_column(BigInteger)
    linhas_lidas: Mapped[Optional[int]] = mapped_column(BigInteger)
    linhas_inseridas: Mapped[Optional[int]] = mapped_column(BigInteger)
    iniciado_em: Mapped[Optional[datetime]] = mapped_column(DateTime)
    finalizado_em: Mapped[Optional[datetime]] = mapped_column(DateTime)
    erro: Mapped[Optional[str]] = mapped_column(Text)
    criado_em: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    __table_args__ = (
        Index("idx_receita_meta_ano_arq", "ano_mes", "arquivo", unique=True),
    )


class ReceitaEmpresa(Base):
    __tablename__ = "receita_empresa"

    cnpj_basico: Mapped[str] = mapped_column(CHAR(8), primary_key=True)
    razao_social: Mapped[Optional[str]] = mapped_column(String(255))
    natureza_juridica: Mapped[Optional[int]] = mapped_column(SmallInteger)
    qualificacao_responsavel: Mapped[Optional[int]] = mapped_column(SmallInteger)
    capital_social: Mapped[Optional[float]] = mapped_column(DECIMAL(18, 2))
    porte: Mapped[Optional[str]] = mapped_column(CHAR(2))


class ReceitaEstabelecimento(Base):
    """Estabelecimento (matriz ou filial) — fonte primária de leads.

    PK composta: cnpj_basico + cnpj_ordem. cnpj_dv guardado pra reconstruir o CNPJ canônico.
    """
    __tablename__ = "receita_estabelecimento"

    cnpj_basico: Mapped[str] = mapped_column(CHAR(8), nullable=False)
    cnpj_ordem: Mapped[str] = mapped_column(CHAR(4), nullable=False)
    cnpj_dv: Mapped[str] = mapped_column(CHAR(2), nullable=False)
    matriz_filial: Mapped[Optional[str]] = mapped_column(CHAR(1))
    nome_fantasia: Mapped[Optional[str]] = mapped_column(String(255))
    situacao_cadastral: Mapped[Optional[str]] = mapped_column(CHAR(2))
    data_situacao_cadastral: Mapped[Optional[date]] = mapped_column(Date)
    data_inicio_atividade: Mapped[Optional[date]] = mapped_column(Date)
    cnae_principal: Mapped[Optional[int]] = mapped_column(Integer)
    cnae_secundaria: Mapped[Optional[str]] = mapped_column(Text)
    tipo_logradouro: Mapped[Optional[str]] = mapped_column(String(50))
    logradouro: Mapped[Optional[str]] = mapped_column(String(150))
    numero: Mapped[Optional[str]] = mapped_column(String(20))
    complemento: Mapped[Optional[str]] = mapped_column(String(150))
    bairro: Mapped[Optional[str]] = mapped_column(String(100))
    cep: Mapped[Optional[str]] = mapped_column(CHAR(8))
    uf: Mapped[Optional[str]] = mapped_column(CHAR(2))
    municipio: Mapped[Optional[int]] = mapped_column(Integer)
    ddd_1: Mapped[Optional[str]] = mapped_column(String(4))
    telefone_1: Mapped[Optional[str]] = mapped_column(String(15))
    ddd_2: Mapped[Optional[str]] = mapped_column(String(4))
    telefone_2: Mapped[Optional[str]] = mapped_column(String(15))
    correio_eletronico: Mapped[Optional[str]] = mapped_column(String(150))

    __table_args__ = (
        PrimaryKeyConstraint("cnpj_basico", "cnpj_ordem", name="pk_receita_estab"),
        Index("idx_estab_uf_mun_situ", "uf", "municipio", "situacao_cadastral"),
        Index("idx_estab_cnae_situ", "cnae_principal", "situacao_cadastral"),
        Index("idx_estab_inicio", "data_inicio_atividade"),
    )


class ReceitaSimples(Base):
    __tablename__ = "receita_simples"

    cnpj_basico: Mapped[str] = mapped_column(CHAR(8), primary_key=True)
    opcao_simples: Mapped[Optional[str]] = mapped_column(CHAR(1))
    data_opcao_simples: Mapped[Optional[date]] = mapped_column(Date)
    data_exclusao_simples: Mapped[Optional[date]] = mapped_column(Date)
    opcao_mei: Mapped[Optional[str]] = mapped_column(CHAR(1))
    data_opcao_mei: Mapped[Optional[date]] = mapped_column(Date)
    data_exclusao_mei: Mapped[Optional[date]] = mapped_column(Date)


class ReceitaCnae(Base):
    __tablename__ = "receita_cnae"

    codigo: Mapped[int] = mapped_column(Integer, primary_key=True)
    descricao: Mapped[Optional[str]] = mapped_column(String(255))


class ReceitaMunicipio(Base):
    """Códigos de município da Receita (≠ código IBGE).

    O CSV de Estabelecimentos referencia ESTE codigo, não o IBGE.
    """
    __tablename__ = "receita_municipio"

    codigo: Mapped[int] = mapped_column(Integer, primary_key=True)
    descricao: Mapped[Optional[str]] = mapped_column(String(150), index=True)


class ReceitaNatureza(Base):
    __tablename__ = "receita_natureza"

    codigo: Mapped[int] = mapped_column(Integer, primary_key=True)
    descricao: Mapped[Optional[str]] = mapped_column(String(150))


class ReceitaQualificacao(Base):
    __tablename__ = "receita_qualificacao"

    codigo: Mapped[int] = mapped_column(Integer, primary_key=True)
    descricao: Mapped[Optional[str]] = mapped_column(String(150))
