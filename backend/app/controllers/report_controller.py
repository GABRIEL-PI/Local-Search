from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from datetime import datetime, timedelta, timezone

from app.models.user import User
from app.models.lead import Lead
from app.models.outreach import Disparo
from app.models.payment import Cliente, Pagamento


class ReportController:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_funnel(self, current_user: User) -> dict:
        result = await self.db.execute(
            select(Lead.status, func.count(Lead.id))
            .where(Lead.usuario_id == current_user.id)
            .group_by(Lead.status)
        )
        status_counts = {row[0]: row[1] for row in result.all()}

        total = sum(status_counts.values())
        funnel = [
            {"status": "prospectado", "label": "Prospectados", "count": status_counts.get("prospectado", 0)},
            {"status": "proposta_gerada", "label": "Proposta Gerada", "count": status_counts.get("proposta_gerada", 0)},
            {"status": "abordado", "label": "Abordados", "count": status_counts.get("abordado", 0)},
            {"status": "respondeu", "label": "Responderam", "count": status_counts.get("respondeu", 0)},
            {"status": "negociando", "label": "Em Negociação", "count": status_counts.get("negociando", 0)},
            {"status": "fechado", "label": "Fechados", "count": status_counts.get("fechado", 0)},
            {"status": "perdido", "label": "Perdidos", "count": status_counts.get("perdido", 0)},
        ]

        fechados = status_counts.get("fechado", 0)
        taxa_conversao = (fechados / total * 100) if total > 0 else 0

        return {
            "funnel": funnel,
            "total": total,
            "taxa_conversao": round(taxa_conversao, 2),
        }

    async def get_revenue(self, current_user: User) -> dict:
        result = await self.db.execute(
            select(
                func.sum(Pagamento.valor),
                func.count(Pagamento.id),
            )
            .join(Cliente, Pagamento.cliente_id == Cliente.id)
            .where(
                and_(
                    Cliente.usuario_id == current_user.id,
                    Pagamento.status == "pago",
                )
            )
        )
        row = result.one()
        total_revenue = float(row[0] or 0)
        total_payments = row[1] or 0

        clientes_result = await self.db.execute(
            select(func.count(Cliente.id), func.sum(Cliente.valor_mensalidade))
            .where(
                and_(
                    Cliente.usuario_id == current_user.id,
                    Cliente.ativo == True,
                )
            )
        )
        clientes_row = clientes_result.one()
        active_clients = clientes_row[0] or 0
        mrr = float(clientes_row[1] or 0)

        now = datetime.now(timezone.utc)
        monthly_data = []
        for i in range(6):
            month_start = (now - timedelta(days=30 * i)).replace(day=1, hour=0, minute=0, second=0)
            month_end = (month_start + timedelta(days=32)).replace(day=1)
            month_result = await self.db.execute(
                select(func.sum(Pagamento.valor))
                .join(Cliente, Pagamento.cliente_id == Cliente.id)
                .where(
                    and_(
                        Cliente.usuario_id == current_user.id,
                        Pagamento.status == "pago",
                        Pagamento.data_pagamento >= month_start,
                        Pagamento.data_pagamento < month_end,
                    )
                )
            )
            month_val = float(month_result.scalar_one() or 0)
            monthly_data.insert(0, {
                "month": month_start.strftime("%b/%Y"),
                "revenue": month_val,
            })

        return {
            "total_revenue": total_revenue,
            "total_payments": total_payments,
            "active_clients": active_clients,
            "mrr": mrr,
            "arr": mrr * 12,
            "monthly": monthly_data,
        }

    async def get_performance(self, current_user: User) -> dict:
        total_leads_result = await self.db.execute(
            select(func.count(Lead.id)).where(Lead.usuario_id == current_user.id)
        )
        total_leads = total_leads_result.scalar_one() or 0

        total_sent_result = await self.db.execute(
            select(func.count(Disparo.id))
            .join(Lead, Disparo.lead_id == Lead.id)
            .where(
                and_(
                    Lead.usuario_id == current_user.id,
                    Disparo.status.in_(["enviado", "entregue", "lido", "respondido"]),
                )
            )
        )
        total_sent = total_sent_result.scalar_one() or 0

        total_replied_result = await self.db.execute(
            select(func.count(Disparo.id))
            .join(Lead, Disparo.lead_id == Lead.id)
            .where(
                and_(
                    Lead.usuario_id == current_user.id,
                    Disparo.status == "respondido",
                )
            )
        )
        total_replied = total_replied_result.scalar_one() or 0

        response_rate = (total_replied / total_sent * 100) if total_sent > 0 else 0

        by_category_result = await self.db.execute(
            select(Lead.categoria, func.count(Lead.id))
            .where(
                and_(
                    Lead.usuario_id == current_user.id,
                    Lead.status == "fechado",
                )
            )
            .group_by(Lead.categoria)
            .order_by(func.count(Lead.id).desc())
            .limit(10)
        )
        by_category = [{"categoria": row[0], "fechados": row[1]} for row in by_category_result.all()]

        return {
            "total_leads": total_leads,
            "total_sent": total_sent,
            "total_replied": total_replied,
            "response_rate": round(response_rate, 2),
            "by_category": by_category,
        }
