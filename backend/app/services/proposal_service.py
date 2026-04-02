from datetime import datetime, timezone
from typing import Optional, List
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.proposal import Proposta
from app.repositories.proposal_repository import ProposalRepository
from app.repositories.lead_repository import LeadRepository
from app.schemas.proposal import ProposalUpdate


class ProposalService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.proposal_repo = ProposalRepository(db)
        self.lead_repo = LeadRepository(db)

    async def get_proposal(self, proposal_id: int, usuario_id: int) -> Proposta:
        proposal = await self.proposal_repo.get_by_id(proposal_id)
        if not proposal:
            raise HTTPException(status_code=404, detail="Proposta não encontrada")
        if proposal.usuario_id != usuario_id:
            raise HTTPException(status_code=403, detail="Acesso negado")
        return proposal

    async def create_proposal_draft(self, lead_id: int, usuario_id: int) -> Proposta:
        lead = await self.lead_repo.get_by_id(lead_id)
        if not lead:
            raise HTTPException(status_code=404, detail="Lead não encontrado")
        if lead.usuario_id != usuario_id:
            raise HTTPException(status_code=403, detail="Acesso negado")

        proposal = await self.proposal_repo.create({
            "lead_id": lead_id,
            "usuario_id": usuario_id,
            "status": "rascunho",
        })
        return proposal

    async def update_proposal(
        self, proposal_id: int, usuario_id: int, data: ProposalUpdate
    ) -> Proposta:
        proposal = await self.get_proposal(proposal_id, usuario_id)
        update_data = {k: v for k, v in data.model_dump().items() if v is not None}
        return await self.proposal_repo.update(proposal_id, update_data)

    async def approve_proposal(self, proposal_id: int, usuario_id: int) -> Proposta:
        proposal = await self.get_proposal(proposal_id, usuario_id)
        if proposal.status not in ("rascunho",):
            raise HTTPException(status_code=400, detail="Proposta não pode ser aprovada")

        updated = await self.proposal_repo.update(proposal_id, {
            "status": "aprovada",
            "aprovado_em": datetime.now(timezone.utc),
            "aprovado_por": usuario_id,
        })

        await self.lead_repo.update(proposal.lead_id, {"status": "proposta_gerada"})
        return updated

    async def reject_proposal(self, proposal_id: int, usuario_id: int) -> Proposta:
        proposal = await self.get_proposal(proposal_id, usuario_id)
        return await self.proposal_repo.update(proposal_id, {"status": "recusada"})

    async def get_pending_queue(self, usuario_id: int) -> List[Proposta]:
        return await self.proposal_repo.get_pending_for_user(usuario_id)

    async def get_proposals_for_lead(self, lead_id: int, usuario_id: int) -> List[Proposta]:
        lead = await self.lead_repo.get_by_id(lead_id)
        if not lead or lead.usuario_id != usuario_id:
            raise HTTPException(status_code=404, detail="Lead não encontrado")
        return await self.proposal_repo.get_by_lead(lead_id)
