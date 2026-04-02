from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.security import encrypt_field, decrypt_field
from app.models.user import User
from app.repositories.user_repository import ConfiguracaoUsuarioRepository
from app.repositories.outreach_repository import WhatsAppContaRepository
from app.schemas.user import UserSettingsUpdate, UserSettingsResponse
from app.schemas.outreach import WhatsAppAccountCreate, WhatsAppAccountResponse

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("", response_model=UserSettingsResponse)
async def get_settings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    config_repo = ConfiguracaoUsuarioRepository(db)
    config = await config_repo.get_by_usuario(current_user.id)

    if not config:
        config = await config_repo.create({
            "usuario_id": current_user.id,
            "limite_disparos_dia": 50,
            "horario_inicio": "08:00",
            "horario_fim": "19:00",
        })

    return UserSettingsResponse(
        id=config.id,
        usuario_id=config.usuario_id,
        limite_disparos_dia=config.limite_disparos_dia,
        horario_inicio=config.horario_inicio,
        horario_fim=config.horario_fim,
        evolution_api_url=config.evolution_api_url,
        has_claude_key=bool(config.claude_api_key),
        has_evolution_key=bool(config.evolution_api_key),
        has_stripe_key=bool(config.stripe_key),
        criado_em=config.criado_em,
        atualizado_em=config.atualizado_em,
    )


@router.put("", response_model=UserSettingsResponse)
async def update_settings(
    data: UserSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    config_repo = ConfiguracaoUsuarioRepository(db)
    update_data = {}

    if data.limite_disparos_dia is not None:
        update_data["limite_disparos_dia"] = data.limite_disparos_dia
    if data.horario_inicio is not None:
        update_data["horario_inicio"] = data.horario_inicio
    if data.horario_fim is not None:
        update_data["horario_fim"] = data.horario_fim
    if data.evolution_api_url is not None:
        update_data["evolution_api_url"] = data.evolution_api_url
    if data.claude_api_key is not None:
        update_data["claude_api_key"] = encrypt_field(data.claude_api_key) if data.claude_api_key else None
    if data.evolution_api_key is not None:
        update_data["evolution_api_key"] = encrypt_field(data.evolution_api_key) if data.evolution_api_key else None
    if data.stripe_key is not None:
        update_data["stripe_key"] = encrypt_field(data.stripe_key) if data.stripe_key else None

    config = await config_repo.upsert(current_user.id, update_data)

    return UserSettingsResponse(
        id=config.id,
        usuario_id=config.usuario_id,
        limite_disparos_dia=config.limite_disparos_dia,
        horario_inicio=config.horario_inicio,
        horario_fim=config.horario_fim,
        evolution_api_url=config.evolution_api_url,
        has_claude_key=bool(config.claude_api_key),
        has_evolution_key=bool(config.evolution_api_key),
        has_stripe_key=bool(config.stripe_key),
        criado_em=config.criado_em,
        atualizado_em=config.atualizado_em,
    )


@router.get("/whatsapp/accounts", response_model=list[WhatsAppAccountResponse])
async def get_whatsapp_accounts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = WhatsAppContaRepository(db)
    return await repo.get_by_usuario(current_user.id)


@router.post("/whatsapp/accounts", response_model=WhatsAppAccountResponse, status_code=201)
async def create_whatsapp_account(
    data: WhatsAppAccountCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = WhatsAppContaRepository(db)
    return await repo.create({
        "usuario_id": current_user.id,
        "nome": data.nome,
        "instancia_id": data.instancia_id,
        "status": "desconectado",
    })
