from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.lead import Lead
from app.repositories.receita_repository import ReceitaRepository


class ReceitaService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = ReceitaRepository(db)

    @staticmethod
    def _format_endereco(row: dict) -> Optional[str]:
        parts = []
        tipo = row.get("tipo_logradouro")
        log = row.get("logradouro")
        num = row.get("numero")
        compl = row.get("complemento")
        bairro = row.get("bairro")
        if tipo or log:
            head = " ".join(p for p in [tipo, log] if p)
            if num:
                head = f"{head}, {num}"
            parts.append(head.strip())
        if compl:
            parts.append(compl)
        if bairro:
            parts.append(bairro)
        return ", ".join(parts) if parts else None

    @staticmethod
    def _format_cnpj(row: dict) -> str:
        return f"{row['cnpj_basico']}{row['cnpj_ordem']}{row['cnpj_dv']}"

    @staticmethod
    def _format_telefone(row: dict) -> Optional[str]:
        ddd = row.get("ddd_1")
        tel = row.get("telefone_1")
        if not tel:
            return None
        return f"({ddd}) {tel}" if ddd else tel

    def _candidate_dict(self, row: dict) -> dict:
        return {
            "cnpj": self._format_cnpj(row),
            "cnpj_basico": row["cnpj_basico"],
            "razao_social": row.get("razao_social"),
            "nome_fantasia": row.get("nome_fantasia"),
            "cnae_principal": row.get("cnae_principal"),
            "cnae_descricao": row.get("cnae_descricao"),
            "data_inicio_atividade": row.get("data_inicio_atividade"),
            "capital_social": float(row["capital_social"]) if row.get("capital_social") is not None else None,
            "porte": row.get("porte"),
            "is_mei": bool(row.get("is_mei")),
            "endereco": self._format_endereco(row),
            "cep": row.get("cep"),
            "municipio_nome": row.get("municipio_nome"),
            "uf": row.get("uf"),
            "telefone": self._format_telefone(row),
            "email": row.get("correio_eletronico"),
        }

    async def search(self, **filters) -> List[dict]:
        rows = await self.repo.search_estabelecimentos(**filters)
        return [self._candidate_dict(r) for r in rows]

    async def import_as_leads(
        self, usuario_id: int, cnpjs: List[str],
        categoria_padrao: Optional[str] = None,
    ) -> dict:
        rows = await self.repo.get_by_cnpjs(cnpjs)
        criados = []
        skipped = 0

        for row in rows:
            cand = self._candidate_dict(row)
            cnpj_full = cand["cnpj"]

            existing = await self.db.execute(
                text("SELECT id FROM leads WHERE usuario_id=:u AND cnpj=:c LIMIT 1"),
                {"u": usuario_id, "c": cnpj_full},
            )
            if existing.first():
                skipped += 1
                continue

            nome = cand["nome_fantasia"] or cand["razao_social"] or f"CNPJ {cnpj_full}"
            categoria = categoria_padrao or cand["cnae_descricao"]

            lead = Lead(
                usuario_id=usuario_id,
                nome=nome[:255],
                categoria=categoria[:150] if categoria else None,
                endereco=cand["endereco"],
                telefone=cand["telefone"],
                whatsapp=cand["telefone"],
                email=cand["email"],
                tem_site=False,
                lead_score=0,
                status="prospectado",
                cidade=cand["municipio_nome"],
                estado=cand["uf"],
                fonte="receita",
                cnpj=cnpj_full,
                data_coleta=datetime.now(timezone.utc),
                dados_extras={
                    "cnae_principal": cand["cnae_principal"],
                    "cnae_descricao": cand["cnae_descricao"],
                    "data_inicio_atividade": cand["data_inicio_atividade"].isoformat()
                        if cand["data_inicio_atividade"] else None,
                    "capital_social": cand["capital_social"],
                    "porte": cand["porte"],
                    "is_mei": cand["is_mei"],
                    "razao_social": cand["razao_social"],
                    "cep": cand["cep"],
                },
            )
            self.db.add(lead)
            await self.db.flush()
            criados.append({"lead_id": lead.id, "cnpj": cnpj_full, "nome": nome})

        await self.db.commit()
        return {"criados": criados, "total_criados": len(criados),
                "ja_existiam": skipped, "total_consultados": len(rows)}
