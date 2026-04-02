from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.ws_manager import manager
from app.controllers.outreach_controller import OutreachController

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.post("/whatsapp")
async def whatsapp_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    payload = await request.json()
    controller = OutreachController(db)
    result = await controller.process_webhook(payload)

    await manager.broadcast({
        "type": "whatsapp_message",
        "data": payload,
    })

    return result
