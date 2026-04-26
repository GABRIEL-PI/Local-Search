export interface User {
  id: number
  nome: string
  email: string
  plano: 'free' | 'starter' | 'pro' | 'agency'
  ativo: boolean
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface DadosExtras {
  images?: Array<{ title: string; image: string }>
  user_reviews?: Array<{ Name: string; Rating: number; Description: string; When: string; ProfilePicture?: string }>
  about?: Array<{ id: string; name: string; options: Array<{ name: string; enabled: boolean }> }>
  open_hours?: Record<string, string[]>
  popular_times?: Record<string, Record<string, number>>
  owner?: { id: string; name: string; link: string }
  complete_address?: { street: string; borough: string; city: string; postal_code: string; state: string; country: string }
  reservations?: Array<{ link: string; source: string }>
  order_online?: Array<{ link: string; source: string }>
  reviews_per_rating?: Record<string, number>
  thumbnail?: string
  description?: string
  cid?: string
}

export type LeadStatus =
  | 'prospectado'
  | 'proposta_gerada'
  | 'abordado'
  | 'respondeu'
  | 'negociando'
  | 'fechado'
  | 'perdido'

export interface Tag {
  id: number
  nome: string
  cor: string
}

export interface Nota {
  id: number
  conteudo: string
  usuario_id: number
  criado_em: string
}

export interface Lead {
  id: number
  usuario_id: number
  nome: string
  categoria: string | null
  endereco: string | null
  telefone: string | null
  whatsapp: string | null
  email: string | null
  horario: string | null
  fotos_count: number | null
  rating: number | null
  reviews_count: number | null
  tem_site: boolean
  url_site: string | null
  site_score: number | null
  ssl_valido: boolean | null
  mobile_friendly: boolean | null
  dominio_disponivel: boolean | null
  dominio_sugerido: string | null
  google_maps_link: string | null
  latitude: number | null
  longitude: number | null
  place_id: string | null
  price_range: string | null
  dados_extras: DadosExtras | null
  lead_score: number
  status: LeadStatus
  cidade: string | null
  estado: string | null
  data_coleta: string | null
  atualizado_em: string
  notas?: Nota[]
  tags?: Tag[]
  propostas?: Proposal[]
}

export interface PaginatedLeads {
  total: number
  skip: number
  limit: number
  items: Lead[]
}

export interface Proposal {
  id: number
  lead_id: number
  usuario_id: number
  argumento_venda: string | null
  mensagem_formal: string | null
  mensagem_descontraida: string | null
  mensagem_urgencia: string | null
  landing_page_html: string | null
  landing_page_screenshot_path: string | null
  preco_sugerido: number | null
  mensalidade_sugerida: number | null
  status: 'rascunho' | 'aprovada' | 'enviada' | 'recusada'
  criado_em: string
  aprovado_em: string | null
}

export interface Disparo {
  id: number
  lead_id: number
  proposta_id: number | null
  canal: 'whatsapp' | 'email'
  status: 'pendente' | 'enviado' | 'entregue' | 'lido' | 'respondido' | 'erro'
  mensagem_enviada: string | null
  resposta_recebida: string | null
  agendado_para: string | null
  enviado_em: string | null
  lido_em: string | null
  respondido_em: string | null
  tentativas: number
  erro_descricao: string | null
  criado_em: string
}

export interface WhatsAppAccount {
  id: number
  nome: string
  instancia_id: string
  status: 'conectado' | 'desconectado' | 'qrcode'
  disparos_hoje: number
  criado_em: string
}

export interface UserSettings {
  id: number
  usuario_id: number
  limite_disparos_dia: number
  horario_inicio: string
  horario_fim: string
  evolution_api_url: string | null
  has_claude_key: boolean
  has_evolution_key: boolean
  has_stripe_key: boolean
  criado_em: string
  atualizado_em: string
}

export interface SessionScraping {
  id: number
  usuario_id: number
  cidade: string
  estado: string | null
  categoria: string
  status: 'rodando' | 'concluido' | 'erro' | 'pausado'
  leads_encontrados: number
  leads_salvos: number
  iniciado_em: string
  finalizado_em: string | null
  erro_descricao: string | null
}

export interface DashboardStats {
  total_leads: number
  leads_hoje: number
  propostas_pendentes: number
  em_negociacao: number
  fechados: number
  taxa_conversao: number
  por_status: Record<string, number>
}

export interface DashboardExtra {
  timeseries: Array<{ day: string; count: number }>
  top_categorias: Array<{ categoria: string; count: number }>
  top_cidades: Array<{ cidade: string; count: number }>
  score_distribution: Array<{ bucket: string; count: number }>
}

export interface FunnelReport {
  funnel: Array<{ status: string; label: string; count: number }>
  total: number
  taxa_conversao: number
}

export interface RevenueReport {
  total_revenue: number
  total_payments: number
  active_clients: number
  mrr: number
  arr: number
  monthly: Array<{ month: string; revenue: number }>
}

export interface PerformanceReport {
  total_leads: number
  total_sent: number
  total_replied: number
  response_rate: number
  by_category: Array<{ categoria: string; fechados: number }>
}
