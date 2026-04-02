from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.services.proposal_service import ProposalService
from app.schemas.proposal import ProposalGenerateRequest, ProposalUpdate


class ProposalController:
    def __init__(self, db: AsyncSession):
        self.service = ProposalService(db)

    async def generate_proposal(self, current_user: User, data: ProposalGenerateRequest) -> dict:
        proposal = await self.service.create_proposal_draft(data.lead_id, current_user.id)

        from app.workers.followup_tasks import generate_proposal_ai
        task = generate_proposal_ai.apply_async(
            args=[proposal.id],
            queue="followups",
        )

        return {
            "task_id": task.id,
            "proposta_id": proposal.id,
            "message": "Proposta sendo gerada pela IA. Você será notificado quando estiver pronta.",
        }

    async def get_proposal(self, proposal_id: int, current_user: User):
        return await self.service.get_proposal(proposal_id, current_user.id)

    async def update_proposal(self, proposal_id: int, current_user: User, data: ProposalUpdate):
        return await self.service.update_proposal(proposal_id, current_user.id, data)

    async def approve_proposal(self, proposal_id: int, current_user: User):
        proposal = await self.service.approve_proposal(proposal_id, current_user.id)

        from app.workers.followup_tasks import schedule_followups_for_lead
        schedule_followups_for_lead.apply_async(args=[proposal.lead_id], queue="followups")

        return proposal

    async def reject_proposal(self, proposal_id: int, current_user: User):
        return await self.service.reject_proposal(proposal_id, current_user.id)

    async def get_queue(self, current_user: User):
        proposals = await self.service.get_pending_queue(current_user.id)
        return proposals
