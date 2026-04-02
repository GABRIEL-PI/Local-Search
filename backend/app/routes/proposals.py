from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.controllers.proposal_controller import ProposalController
from app.schemas.proposal import ProposalGenerateRequest, ProposalUpdate, ProposalResponse

router = APIRouter(prefix="/proposals", tags=["proposals"])


@router.post("/generate")
async def generate_proposal(
    data: ProposalGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    controller = ProposalController(db)
    return await controller.generate_proposal(current_user, data)


@router.get("/queue", response_model=list[ProposalResponse])
async def get_queue(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    controller = ProposalController(db)
    return await controller.get_queue(current_user)


@router.get("/{proposal_id}", response_model=ProposalResponse)
async def get_proposal(
    proposal_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    controller = ProposalController(db)
    return await controller.get_proposal(proposal_id, current_user)


@router.put("/{proposal_id}", response_model=ProposalResponse)
async def update_proposal(
    proposal_id: int,
    data: ProposalUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    controller = ProposalController(db)
    return await controller.update_proposal(proposal_id, current_user, data)


@router.put("/{proposal_id}/approve", response_model=ProposalResponse)
async def approve_proposal(
    proposal_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    controller = ProposalController(db)
    return await controller.approve_proposal(proposal_id, current_user)


@router.put("/{proposal_id}/reject", response_model=ProposalResponse)
async def reject_proposal(
    proposal_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    controller = ProposalController(db)
    return await controller.reject_proposal(proposal_id, current_user)
