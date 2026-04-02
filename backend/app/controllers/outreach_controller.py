from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.services.outreach_service import OutreachService
from app.schemas.outreach import OutreachSendRequest, WhatsAppAccountCreate


class OutreachController:
    def __init__(self, db: AsyncSession):
        self.service = OutreachService(db)

    async def get_queue(self, current_user: User):
        return await self.service.get_queue(current_user.id)

    async def send_outreach(self, current_user: User, data: OutreachSendRequest):
        disparo = await self.service.create_disparo(current_user.id, data)

        from app.workers.outreach_tasks import send_whatsapp_message, send_email
        if data.canal == "whatsapp":
            send_whatsapp_message.apply_async(args=[disparo.id], queue="outreach")
        else:
            send_email.apply_async(args=[disparo.id], queue="outreach")

        return disparo

    async def get_disparo(self, disparo_id: int, current_user: User):
        return await self.service.get_disparo(disparo_id, current_user.id)

    async def get_whatsapp_accounts(self, current_user: User):
        return await self.service.get_whatsapp_accounts(current_user.id)

    async def create_whatsapp_account(self, current_user: User, data: WhatsAppAccountCreate):
        return await self.service.create_whatsapp_account(current_user.id, data)

    async def process_webhook(self, payload: dict) -> dict:
        return await self.service.process_webhook(payload)
