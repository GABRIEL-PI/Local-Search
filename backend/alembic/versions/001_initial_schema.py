"""Initial schema - all 13 tables

Revision ID: 001
Revises:
Create Date: 2026-04-01 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # usuarios
    op.create_table(
        'usuarios',
        sa.Column('id', sa.Integer(), nullable=False, autoincrement=True),
        sa.Column('nome', sa.String(150), nullable=False),
        sa.Column('email', sa.String(200), nullable=False),
        sa.Column('senha_hash', sa.String(255), nullable=False),
        sa.Column('plano', sa.Enum('free', 'starter', 'pro', 'agency', name='plano_enum'), nullable=False, server_default='free'),
        sa.Column('ativo', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('criado_em', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email'),
    )
    op.create_index('ix_usuarios_email', 'usuarios', ['email'])

    # leads
    op.create_table(
        'leads',
        sa.Column('id', sa.Integer(), nullable=False, autoincrement=True),
        sa.Column('usuario_id', sa.Integer(), nullable=False),
        sa.Column('nome', sa.String(255), nullable=False),
        sa.Column('categoria', sa.String(150)),
        sa.Column('endereco', sa.String(500)),
        sa.Column('telefone', sa.String(30)),
        sa.Column('whatsapp', sa.String(30)),
        sa.Column('email', sa.String(200)),
        sa.Column('horario', sa.String(500)),
        sa.Column('fotos_count', sa.Integer()),
        sa.Column('rating', sa.DECIMAL(3, 1)),
        sa.Column('reviews_count', sa.Integer()),
        sa.Column('tem_site', sa.Boolean(), server_default='0'),
        sa.Column('url_site', sa.String(500)),
        sa.Column('site_score', sa.Integer()),
        sa.Column('ssl_valido', sa.Boolean()),
        sa.Column('mobile_friendly', sa.Boolean()),
        sa.Column('dominio_disponivel', sa.Boolean()),
        sa.Column('dominio_sugerido', sa.String(255)),
        sa.Column('lead_score', sa.Integer(), server_default='0'),
        sa.Column('status', sa.Enum(
            'prospectado', 'proposta_gerada', 'abordado', 'respondeu',
            'negociando', 'fechado', 'perdido', name='lead_status_enum'
        ), nullable=False, server_default='prospectado'),
        sa.Column('cidade', sa.String(150)),
        sa.Column('estado', sa.String(2)),
        sa.Column('data_coleta', sa.DateTime()),
        sa.Column('atualizado_em', sa.DateTime(), server_default=sa.text('NOW()'), onupdate=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['usuario_id'], ['usuarios.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_leads_usuario_id', 'leads', ['usuario_id'])

    # lead_status_history
    op.create_table(
        'lead_status_history',
        sa.Column('id', sa.Integer(), nullable=False, autoincrement=True),
        sa.Column('lead_id', sa.Integer(), nullable=False),
        sa.Column('status_anterior', sa.String(50)),
        sa.Column('status_novo', sa.String(50), nullable=False),
        sa.Column('usuario_id', sa.Integer()),
        sa.Column('observacao', sa.Text()),
        sa.Column('criado_em', sa.DateTime(), server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['lead_id'], ['leads.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['usuario_id'], ['usuarios.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_lead_status_history_lead_id', 'lead_status_history', ['lead_id'])

    # tags
    op.create_table(
        'tags',
        sa.Column('id', sa.Integer(), nullable=False, autoincrement=True),
        sa.Column('nome', sa.String(100), nullable=False),
        sa.Column('cor', sa.String(7), server_default='#3B82F6'),
        sa.Column('usuario_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['usuario_id'], ['usuarios.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )

    # lead_tags
    op.create_table(
        'lead_tags',
        sa.Column('lead_id', sa.Integer(), nullable=False),
        sa.Column('tag_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['lead_id'], ['leads.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tag_id'], ['tags.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('lead_id', 'tag_id'),
    )

    # notas
    op.create_table(
        'notas',
        sa.Column('id', sa.Integer(), nullable=False, autoincrement=True),
        sa.Column('lead_id', sa.Integer(), nullable=False),
        sa.Column('usuario_id', sa.Integer(), nullable=False),
        sa.Column('conteudo', sa.Text(), nullable=False),
        sa.Column('criado_em', sa.DateTime(), server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['lead_id'], ['leads.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['usuario_id'], ['usuarios.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_notas_lead_id', 'notas', ['lead_id'])

    # propostas
    op.create_table(
        'propostas',
        sa.Column('id', sa.Integer(), nullable=False, autoincrement=True),
        sa.Column('lead_id', sa.Integer(), nullable=False),
        sa.Column('usuario_id', sa.Integer(), nullable=False),
        sa.Column('argumento_venda', sa.Text()),
        sa.Column('mensagem_formal', sa.Text()),
        sa.Column('mensagem_descontraida', sa.Text()),
        sa.Column('mensagem_urgencia', sa.Text()),
        sa.Column('landing_page_html', sa.Text()),
        sa.Column('landing_page_screenshot_path', sa.String(500)),
        sa.Column('preco_sugerido', sa.DECIMAL(10, 2)),
        sa.Column('mensalidade_sugerida', sa.DECIMAL(10, 2)),
        sa.Column('status', sa.Enum('rascunho', 'aprovada', 'enviada', 'recusada', name='proposta_status_enum'), nullable=False, server_default='rascunho'),
        sa.Column('criado_em', sa.DateTime(), server_default=sa.text('NOW()')),
        sa.Column('aprovado_em', sa.DateTime()),
        sa.Column('aprovado_por', sa.Integer()),
        sa.ForeignKeyConstraint(['lead_id'], ['leads.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['usuario_id'], ['usuarios.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['aprovado_por'], ['usuarios.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_propostas_lead_id', 'propostas', ['lead_id'])

    # disparos
    op.create_table(
        'disparos',
        sa.Column('id', sa.Integer(), nullable=False, autoincrement=True),
        sa.Column('lead_id', sa.Integer(), nullable=False),
        sa.Column('proposta_id', sa.Integer()),
        sa.Column('canal', sa.Enum('whatsapp', 'email', name='canal_enum'), nullable=False),
        sa.Column('status', sa.Enum('pendente', 'enviado', 'entregue', 'lido', 'respondido', 'erro', name='disparo_status_enum'), nullable=False, server_default='pendente'),
        sa.Column('mensagem_enviada', sa.Text()),
        sa.Column('resposta_recebida', sa.Text()),
        sa.Column('agendado_para', sa.DateTime()),
        sa.Column('enviado_em', sa.DateTime()),
        sa.Column('lido_em', sa.DateTime()),
        sa.Column('respondido_em', sa.DateTime()),
        sa.Column('tentativas', sa.Integer(), server_default='0'),
        sa.Column('erro_descricao', sa.Text()),
        sa.Column('criado_em', sa.DateTime(), server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['lead_id'], ['leads.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['proposta_id'], ['propostas.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_disparos_lead_id', 'disparos', ['lead_id'])

    # followups
    op.create_table(
        'followups',
        sa.Column('id', sa.Integer(), nullable=False, autoincrement=True),
        sa.Column('lead_id', sa.Integer(), nullable=False),
        sa.Column('sequencia', sa.Enum('1', '2', '3', name='sequencia_enum'), nullable=False),
        sa.Column('status', sa.Enum('pendente', 'enviado', 'cancelado', name='followup_status_enum'), server_default='pendente'),
        sa.Column('agendado_para', sa.DateTime()),
        sa.Column('executado_em', sa.DateTime()),
        sa.Column('criado_em', sa.DateTime(), server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['lead_id'], ['leads.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_followups_lead_id', 'followups', ['lead_id'])

    # whatsapp_contas
    op.create_table(
        'whatsapp_contas',
        sa.Column('id', sa.Integer(), nullable=False, autoincrement=True),
        sa.Column('usuario_id', sa.Integer(), nullable=False),
        sa.Column('nome', sa.String(150), nullable=False),
        sa.Column('instancia_id', sa.String(255), nullable=False),
        sa.Column('status', sa.Enum('conectado', 'desconectado', 'qrcode', name='whatsapp_status_enum'), server_default='desconectado'),
        sa.Column('disparos_hoje', sa.Integer(), server_default='0'),
        sa.Column('criado_em', sa.DateTime(), server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['usuario_id'], ['usuarios.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_whatsapp_contas_usuario_id', 'whatsapp_contas', ['usuario_id'])

    # clientes
    op.create_table(
        'clientes',
        sa.Column('id', sa.Integer(), nullable=False, autoincrement=True),
        sa.Column('lead_id', sa.Integer(), nullable=False),
        sa.Column('usuario_id', sa.Integer(), nullable=False),
        sa.Column('plano', sa.Enum('basico', 'padrao', 'premium', 'pro', name='cliente_plano_enum'), server_default='basico'),
        sa.Column('valor_mensalidade', sa.DECIMAL(10, 2)),
        sa.Column('data_inicio', sa.Date()),
        sa.Column('ativo', sa.Boolean(), server_default='1'),
        sa.Column('criado_em', sa.DateTime(), server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['lead_id'], ['leads.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['usuario_id'], ['usuarios.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('lead_id'),
    )

    # pagamentos
    op.create_table(
        'pagamentos',
        sa.Column('id', sa.Integer(), nullable=False, autoincrement=True),
        sa.Column('cliente_id', sa.Integer(), nullable=False),
        sa.Column('valor', sa.DECIMAL(10, 2), nullable=False),
        sa.Column('status', sa.Enum('pendente', 'pago', 'falhou', 'cancelado', name='pagamento_status_enum'), server_default='pendente'),
        sa.Column('metodo', sa.Enum('stripe', 'pagarme', 'pix', 'boleto', name='pagamento_metodo_enum')),
        sa.Column('referencia_externa', sa.String(255)),
        sa.Column('data_vencimento', sa.Date()),
        sa.Column('data_pagamento', sa.DateTime()),
        sa.Column('criado_em', sa.DateTime(), server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['cliente_id'], ['clientes.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_pagamentos_cliente_id', 'pagamentos', ['cliente_id'])

    # configuracoes_usuario
    op.create_table(
        'configuracoes_usuario',
        sa.Column('id', sa.Integer(), nullable=False, autoincrement=True),
        sa.Column('usuario_id', sa.Integer(), nullable=False),
        sa.Column('limite_disparos_dia', sa.Integer(), server_default='50'),
        sa.Column('horario_inicio', sa.String(5), server_default='08:00'),
        sa.Column('horario_fim', sa.String(5), server_default='19:00'),
        sa.Column('claude_api_key', sa.Text()),
        sa.Column('evolution_api_url', sa.String(500)),
        sa.Column('evolution_api_key', sa.Text()),
        sa.Column('stripe_key', sa.Text()),
        sa.Column('criado_em', sa.DateTime(), server_default=sa.text('NOW()')),
        sa.Column('atualizado_em', sa.DateTime(), server_default=sa.text('NOW()'), onupdate=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['usuario_id'], ['usuarios.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('usuario_id'),
    )

    # sessions_scraping
    op.create_table(
        'sessions_scraping',
        sa.Column('id', sa.Integer(), nullable=False, autoincrement=True),
        sa.Column('usuario_id', sa.Integer(), nullable=False),
        sa.Column('cidade', sa.String(150), nullable=False),
        sa.Column('estado', sa.String(2)),
        sa.Column('categoria', sa.String(150), nullable=False),
        sa.Column('status', sa.Enum('rodando', 'concluido', 'erro', 'pausado', name='session_status_enum'), server_default='rodando'),
        sa.Column('leads_encontrados', sa.Integer(), server_default='0'),
        sa.Column('leads_salvos', sa.Integer(), server_default='0'),
        sa.Column('iniciado_em', sa.DateTime(), server_default=sa.text('NOW()')),
        sa.Column('finalizado_em', sa.DateTime()),
        sa.Column('erro_descricao', sa.Text()),
        sa.ForeignKeyConstraint(['usuario_id'], ['usuarios.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_sessions_scraping_usuario_id', 'sessions_scraping', ['usuario_id'])


def downgrade() -> None:
    op.drop_table('sessions_scraping')
    op.drop_table('configuracoes_usuario')
    op.drop_table('pagamentos')
    op.drop_table('clientes')
    op.drop_table('whatsapp_contas')
    op.drop_table('followups')
    op.drop_table('disparos')
    op.drop_table('propostas')
    op.drop_table('notas')
    op.drop_table('lead_tags')
    op.drop_table('tags')
    op.drop_table('lead_status_history')
    op.drop_table('leads')
    op.drop_table('usuarios')
