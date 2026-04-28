from datetime import date
from typing import List, Optional

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


class ReceitaRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def search_estabelecimentos(
        self,
        uf: str,
        *,
        municipio: Optional[int] = None,
        municipio_nome: Optional[str] = None,
        cnaes: Optional[List[int]] = None,
        cnae_prefixo: Optional[str] = None,
        aberto_desde: Optional[date] = None,
        aberto_ate: Optional[date] = None,
        com_telefone: bool = True,
        com_email: bool = False,
        porte: Optional[List[str]] = None,
        apenas_mei: Optional[bool] = None,
        capital_min: Optional[float] = None,
        limit: int = 100,
    ) -> List[dict]:
        params: dict = {"uf": uf.upper(), "limit": limit}
        where = ["e.uf = :uf", "e.situacao_cadastral = '02'"]

        if municipio is not None:
            where.append("e.municipio = :municipio")
            params["municipio"] = municipio
        elif municipio_nome:
            where.append("m.descricao LIKE :municipio_nome")
            params["municipio_nome"] = f"%{municipio_nome.upper()}%"

        if cnaes:
            placeholders = ",".join(f":cnae_{i}" for i in range(len(cnaes)))
            where.append(f"e.cnae_principal IN ({placeholders})")
            for i, c in enumerate(cnaes):
                params[f"cnae_{i}"] = c
        elif cnae_prefixo:
            where.append("CAST(e.cnae_principal AS CHAR) LIKE :cnae_prefixo")
            params["cnae_prefixo"] = f"{cnae_prefixo}%"

        if aberto_desde:
            where.append("e.data_inicio_atividade >= :aberto_desde")
            params["aberto_desde"] = aberto_desde
        if aberto_ate:
            where.append("e.data_inicio_atividade <= :aberto_ate")
            params["aberto_ate"] = aberto_ate

        if com_telefone:
            where.append("(e.telefone_1 IS NOT NULL AND e.telefone_1 <> '')")
        if com_email:
            where.append("(e.correio_eletronico IS NOT NULL AND e.correio_eletronico <> '')")

        if porte:
            placeholders = ",".join(f":porte_{i}" for i in range(len(porte)))
            where.append(f"emp.porte IN ({placeholders})")
            for i, p in enumerate(porte):
                params[f"porte_{i}"] = p

        if apenas_mei is True:
            where.append("s.opcao_mei = 'S' AND s.data_exclusao_mei IS NULL")
        elif apenas_mei is False:
            where.append("(s.opcao_mei IS NULL OR s.opcao_mei = 'N' OR s.data_exclusao_mei IS NOT NULL)")

        if capital_min is not None:
            where.append("emp.capital_social >= :capital_min")
            params["capital_min"] = capital_min

        sql = f"""
        SELECT
          e.cnpj_basico, e.cnpj_ordem, e.cnpj_dv, e.nome_fantasia,
          e.cnae_principal, e.data_inicio_atividade,
          e.tipo_logradouro, e.logradouro, e.numero, e.complemento,
          e.bairro, e.cep, e.uf, e.municipio,
          e.ddd_1, e.telefone_1, e.correio_eletronico,
          emp.razao_social, emp.capital_social, emp.porte,
          c.descricao AS cnae_descricao,
          m.descricao AS municipio_nome,
          CASE WHEN s.opcao_mei = 'S' AND s.data_exclusao_mei IS NULL
               THEN 1 ELSE 0 END AS is_mei
        FROM receita_estabelecimento e
        LEFT JOIN receita_empresa    emp ON emp.cnpj_basico = e.cnpj_basico
        LEFT JOIN receita_simples    s   ON s.cnpj_basico   = e.cnpj_basico
        LEFT JOIN receita_cnae       c   ON c.codigo        = e.cnae_principal
        LEFT JOIN receita_municipio  m   ON m.codigo        = e.municipio
        WHERE {" AND ".join(where)}
        ORDER BY e.data_inicio_atividade DESC
        LIMIT :limit
        """
        result = await self.db.execute(text(sql), params)
        return [dict(r) for r in result.mappings()]

    async def get_by_cnpjs(self, cnpjs: List[str]) -> List[dict]:
        """Busca pelos CNPJs completos (14 dígitos, só dígitos)."""
        if not cnpjs:
            return []
        params: dict = {}
        clauses = []
        for i, cnpj in enumerate(cnpjs):
            digits = "".join(c for c in cnpj if c.isdigit())
            if len(digits) != 14:
                continue
            params[f"b_{i}"] = digits[:8]
            params[f"o_{i}"] = digits[8:12]
            params[f"d_{i}"] = digits[12:14]
            clauses.append(
                f"(e.cnpj_basico=:b_{i} AND e.cnpj_ordem=:o_{i} AND e.cnpj_dv=:d_{i})"
            )
        if not clauses:
            return []
        sql = f"""
        SELECT
          e.cnpj_basico, e.cnpj_ordem, e.cnpj_dv, e.nome_fantasia,
          e.cnae_principal, e.data_inicio_atividade,
          e.tipo_logradouro, e.logradouro, e.numero, e.complemento,
          e.bairro, e.cep, e.uf, e.municipio,
          e.ddd_1, e.telefone_1, e.correio_eletronico,
          emp.razao_social, emp.capital_social, emp.porte,
          c.descricao AS cnae_descricao,
          m.descricao AS municipio_nome,
          CASE WHEN s.opcao_mei='S' AND s.data_exclusao_mei IS NULL
               THEN 1 ELSE 0 END AS is_mei
        FROM receita_estabelecimento e
        LEFT JOIN receita_empresa    emp ON emp.cnpj_basico = e.cnpj_basico
        LEFT JOIN receita_simples    s   ON s.cnpj_basico   = e.cnpj_basico
        LEFT JOIN receita_cnae       c   ON c.codigo        = e.cnae_principal
        LEFT JOIN receita_municipio  m   ON m.codigo        = e.municipio
        WHERE {" OR ".join(clauses)}
        """
        result = await self.db.execute(text(sql), params)
        return [dict(r) for r in result.mappings()]
