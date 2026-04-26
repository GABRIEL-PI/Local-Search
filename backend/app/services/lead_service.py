from datetime import datetime, timezone
from typing import Optional, List, Tuple
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.lead import Lead, Nota, LeadTag, LeadStatusHistory
from app.repositories.lead_repository import (
    LeadRepository, NotaRepository, TagRepository,
    LeadStatusHistoryRepository, SessionScrapingRepository
)
from app.services.scraper_service import calculate_lead_score
from app.schemas.lead import LeadCreate, LeadUpdate, LeadStatusUpdate, NoteCreate, TagAssign


class LeadService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.lead_repo = LeadRepository(db)
        self.nota_repo = NotaRepository(db)
        self.tag_repo = TagRepository(db)
        self.history_repo = LeadStatusHistoryRepository(db)
        self.session_repo = SessionScrapingRepository(db)

    async def get_leads(
        self,
        usuario_id: int,
        cidade: Optional[str] = None,
        categoria: Optional[str] = None,
        score_min: Optional[int] = None,
        score_max: Optional[int] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> Tuple[int, List[Lead]]:
        return await self.lead_repo.get_filtered(
            usuario_id=usuario_id,
            cidade=cidade,
            categoria=categoria,
            score_min=score_min,
            score_max=score_max,
            status=status,
            search=search,
            skip=skip,
            limit=limit,
        )

    async def get_lead(self, lead_id: int, usuario_id: int) -> Lead:
        lead = await self.lead_repo.get_with_details(lead_id)
        if not lead:
            raise HTTPException(status_code=404, detail="Lead não encontrado")
        if lead.usuario_id != usuario_id:
            raise HTTPException(status_code=403, detail="Acesso negado")
        return lead

    async def create_lead(self, usuario_id: int, data: LeadCreate) -> Lead:
        lead_data = data.model_dump()
        lead_data["usuario_id"] = usuario_id
        lead_data["data_coleta"] = datetime.now(timezone.utc)
        lead_data["status"] = "prospectado"

        lead = await self.lead_repo.create(lead_data)
        score = calculate_lead_score(lead)
        lead = await self.lead_repo.update(lead.id, {"lead_score": score})
        return lead

    async def update_lead(self, lead_id: int, usuario_id: int, data: LeadUpdate) -> Lead:
        lead = await self.lead_repo.get_by_id(lead_id)
        if not lead:
            raise HTTPException(status_code=404, detail="Lead não encontrado")
        if lead.usuario_id != usuario_id:
            raise HTTPException(status_code=403, detail="Acesso negado")

        update_data = {k: v for k, v in data.model_dump().items() if v is not None}
        updated = await self.lead_repo.update(lead_id, update_data)
        score = calculate_lead_score(updated)
        return await self.lead_repo.update(lead_id, {"lead_score": score})

    async def update_status(
        self, lead_id: int, usuario_id: int, data: LeadStatusUpdate
    ) -> Lead:
        lead = await self.lead_repo.get_by_id(lead_id)
        if not lead:
            raise HTTPException(status_code=404, detail="Lead não encontrado")
        if lead.usuario_id != usuario_id:
            raise HTTPException(status_code=403, detail="Acesso negado")

        valid_statuses = [
            "prospectado", "proposta_gerada", "abordado",
            "respondeu", "negociando", "fechado", "perdido"
        ]
        if data.status not in valid_statuses:
            raise HTTPException(status_code=400, detail="Status inválido")

        old_status = lead.status
        await self.history_repo.create({
            "lead_id": lead_id,
            "status_anterior": old_status,
            "status_novo": data.status,
            "usuario_id": usuario_id,
            "observacao": data.observacao,
        })

        return await self.lead_repo.update(lead_id, {"status": data.status})

    async def delete_lead(self, lead_id: int, usuario_id: int) -> bool:
        lead = await self.lead_repo.get_by_id(lead_id)
        if not lead:
            raise HTTPException(status_code=404, detail="Lead não encontrado")
        if lead.usuario_id != usuario_id:
            raise HTTPException(status_code=403, detail="Acesso negado")
        return await self.lead_repo.delete(lead_id)

    async def add_note(self, lead_id: int, usuario_id: int, data: NoteCreate) -> Nota:
        lead = await self.lead_repo.get_by_id(lead_id)
        if not lead or lead.usuario_id != usuario_id:
            raise HTTPException(status_code=404, detail="Lead não encontrado")

        return await self.nota_repo.create({
            "lead_id": lead_id,
            "usuario_id": usuario_id,
            "conteudo": data.conteudo,
        })

    async def get_notes(self, lead_id: int, usuario_id: int) -> List[Nota]:
        lead = await self.lead_repo.get_by_id(lead_id)
        if not lead or lead.usuario_id != usuario_id:
            raise HTTPException(status_code=404, detail="Lead não encontrado")
        return await self.nota_repo.get_by_lead(lead_id)

    async def assign_tags(self, lead_id: int, usuario_id: int, data: TagAssign) -> Lead:
        lead = await self.lead_repo.get_by_id(lead_id)
        if not lead or lead.usuario_id != usuario_id:
            raise HTTPException(status_code=404, detail="Lead não encontrado")

        from sqlalchemy import delete
        from app.models.lead import LeadTag
        await self.db.execute(
            delete(LeadTag).where(LeadTag.lead_id == lead_id)
        )

        for tag_id in data.tag_ids:
            tag = await self.tag_repo.get_by_id(tag_id)
            if tag and tag.usuario_id == usuario_id:
                lt = LeadTag(lead_id=lead_id, tag_id=tag_id)
                self.db.add(lt)

        await self.db.flush()
        return await self.lead_repo.get_with_details(lead_id)

    async def start_scraping(self, usuario_id: int, cidade: str, estado: Optional[str], categoria: str, limite: int) -> int:
        session = await self.session_repo.create({
            "usuario_id": usuario_id,
            "cidade": cidade,
            "estado": estado,
            "categoria": categoria,
            "status": "rodando",
            "leads_encontrados": 0,
            "leads_salvos": 0,
            "iniciado_em": datetime.now(timezone.utc),
        })
        return session.id

    async def get_scraping_sessions(self, usuario_id: int):
        return await self.session_repo.get_by_usuario(usuario_id)

    async def get_dashboard_stats(self, usuario_id: int) -> dict:
        status_counts = await self.lead_repo.get_by_status_for_user(usuario_id)
        today_count = await self.lead_repo.count_today_for_user(usuario_id)

        total = sum(status_counts.values())
        fechados = status_counts.get("fechado", 0)
        conversion_rate = (fechados / total * 100) if total > 0 else 0

        return {
            "total_leads": total,
            "leads_hoje": today_count,
            "propostas_pendentes": status_counts.get("proposta_gerada", 0),
            "em_negociacao": status_counts.get("negociando", 0),
            "fechados": fechados,
            "taxa_conversao": round(conversion_rate, 1),
            "por_status": status_counts,
        }

    async def get_dashboard_extra(self, usuario_id: int) -> dict:
        timeseries = await self.lead_repo.timeseries_for_user(usuario_id, days=30)
        top_categorias = await self.lead_repo.top_categories_for_user(usuario_id, limit=5)
        top_cidades = await self.lead_repo.top_cities_for_user(usuario_id, limit=5)
        score_distribution = await self.lead_repo.score_distribution_for_user(usuario_id)
        return {
            "timeseries": timeseries,
            "top_categorias": top_categorias,
            "top_cidades": top_cidades,
            "score_distribution": score_distribution,
        }
