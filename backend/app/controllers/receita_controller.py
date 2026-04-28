from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.schemas.receita import (
    ReceitaSearchRequest, ReceitaImportRequest, ReceitaSyncRequest,
)
from app.services.receita_service import ReceitaService


class ReceitaController:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.service = ReceitaService(db)

    async def search(self, _user: User, data: ReceitaSearchRequest) -> dict:
        candidatos = await self.service.search(
            uf=data.uf,
            municipio=data.municipio,
            municipio_nome=data.municipio_nome,
            cnaes=data.cnaes,
            cnae_prefixo=data.cnae_prefixo,
            aberto_desde=data.aberto_desde,
            aberto_ate=data.aberto_ate,
            com_telefone=data.com_telefone,
            com_email=data.com_email,
            porte=data.porte,
            apenas_mei=data.apenas_mei,
            capital_min=data.capital_min,
            limit=data.limit,
        )
        return {"total": len(candidatos), "candidatos": candidatos}

    async def import_leads(self, user: User, data: ReceitaImportRequest) -> dict:
        return await self.service.import_as_leads(
            usuario_id=user.id, cnpjs=data.cnpjs,
            categoria_padrao=data.categoria_padrao,
        )

    async def sync(self, _user: User, data: ReceitaSyncRequest) -> dict:
        from app.workers.receita_tasks import sync_receita_dump
        kwargs = {}
        if data.ano_mes:
            kwargs["ano_mes"] = data.ano_mes
        if data.only:
            kwargs["only"] = data.only
        task = sync_receita_dump.apply_async(kwargs=kwargs, queue="receita")
        return {"task_id": task.id, "ano_mes": data.ano_mes,
                "message": "Sync da Receita enfileirado"}

    async def status(self, _user: User, ano_mes: str | None = None) -> dict:
        if ano_mes:
            rows = await self.db.execute(text("""
                SELECT ano_mes, arquivo, status, bytes_baixados, bytes_total,
                       linhas_inseridas, iniciado_em, finalizado_em, erro
                FROM receita_meta WHERE ano_mes=:m ORDER BY arquivo
            """), {"m": ano_mes})
        else:
            rows = await self.db.execute(text("""
                SELECT ano_mes, arquivo, status, bytes_baixados, bytes_total,
                       linhas_inseridas, iniciado_em, finalizado_em, erro
                FROM receita_meta
                ORDER BY ano_mes DESC, arquivo
                LIMIT 200
            """))
        return {"meta": [dict(r) for r in rows.mappings()]}
