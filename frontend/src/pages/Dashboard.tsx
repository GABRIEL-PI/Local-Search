import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { leadsApi, reportsApi } from '@/lib/api'
import { DashboardStats, FunnelReport } from '@/types'
import { Card, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import {
  Users, TrendingUp, FileText, DollarSign,
  ArrowRight, Search, InboxIcon, Zap, Send,
  Activity, Target, BarChart3
} from 'lucide-react'

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [funnel, setFunnel] = useState<FunnelReport | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      leadsApi.getDashboardStats().then((r) => setStats(r.data)).catch(() => {}),
      reportsApi.getFunnel().then((r) => setFunnel(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  const statCards = [
    {
      label: 'Total de Leads',
      value: stats?.total_leads ?? 0,
      icon: Users,
      gradient: 'from-blue-600 to-blue-800',
      glow: 'glow-blue',
      sub: `+${stats?.leads_hoje ?? 0} hoje`,
    },
    {
      label: 'Propostas Pendentes',
      value: stats?.propostas_pendentes ?? 0,
      icon: FileText,
      gradient: 'from-purple-600 to-purple-800',
      glow: 'glow-purple',
      sub: 'aguardando aprovacao',
    },
    {
      label: 'Em Negociacao',
      value: stats?.em_negociacao ?? 0,
      icon: Target,
      gradient: 'from-orange-600 to-orange-800',
      glow: 'glow-orange',
      sub: 'leads quentes',
    },
    {
      label: 'Taxa de Conversao',
      value: `${stats?.taxa_conversao ?? 0}%`,
      icon: TrendingUp,
      gradient: 'from-green-600 to-green-800',
      glow: 'glow-green',
      sub: `${stats?.fechados ?? 0} fechados`,
    },
  ]

  const funnelColors = [
    'bg-blue-500', 'bg-indigo-500', 'bg-purple-500',
    'bg-yellow-500', 'bg-orange-500', 'bg-green-500', 'bg-red-500',
  ]
  const funnelLabels: Record<string, string> = {
    prospectado: 'Prospectado',
    proposta_gerada: 'Proposta Gerada',
    abordado: 'Abordado',
    respondeu: 'Respondeu',
    negociando: 'Negociando',
    fechado: 'Fechado',
    perdido: 'Perdido',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Visao geral da sua prospeccao</p>
        </div>
        <Link to="/prospecting">
          <Button>
            <Search className="w-4 h-4" />
            Nova Prospeccao
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => (
          <div key={idx} className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${stat.gradient} p-[1px] ${stat.glow}`}>
            <div className="rounded-2xl bg-[#0a0a0f]/80 backdrop-blur-xl p-5 h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <stat.icon className="w-5 h-5 text-white/80" />
                </div>
                <Activity className="w-4 h-4 text-white/20" />
              </div>
              <div>
                <p className="text-3xl font-bold text-white">
                  {loading ? (
                    <span className="inline-block w-16 h-8 bg-white/10 rounded-lg animate-pulse" />
                  ) : stat.value}
                </p>
                <p className="text-sm text-white/60 mt-1">{stat.label}</p>
                <p className="text-xs text-white/40 mt-0.5">{stat.sub}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Funnel */}
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-semibold text-gray-100">Funil de Vendas</h2>
              </div>
              {funnel && (
                <span className="text-sm text-green-400 font-medium">{funnel.taxa_conversao}% conversao</span>
              )}
            </div>
            {stats?.por_status && Object.keys(stats.por_status).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(stats.por_status).map(([status, count], i) => {
                  const total = stats.total_leads
                  const pct = total > 0 ? (count / total) * 100 : 0
                  return (
                    <div key={status}>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${funnelColors[i] || 'bg-gray-500'}`} />
                          <span className="text-gray-300">{funnelLabels[status] || status}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-gray-500 text-xs">{pct.toFixed(0)}%</span>
                          <span className="font-bold text-gray-100 w-8 text-right">{count}</span>
                        </div>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${funnelColors[i] || 'bg-gray-500'}`}
                          style={{ width: `${Math.max(pct, 2)}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <BarChart3 className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500">Nenhum lead ainda</p>
                <Link to="/prospecting">
                  <Button className="mt-4" size="sm">Iniciar prospeccao</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-gray-100 mb-4">Acoes Rapidas</h2>
            <div className="space-y-2">
              {[
                { label: 'Nova Prospeccao', to: '/prospecting', icon: Search, desc: 'Buscar leads no Google Maps', color: 'text-blue-400 bg-blue-500/10' },
                { label: 'Fila de Aprovacao', to: '/queue', icon: InboxIcon, desc: 'Revisar propostas IA', color: 'text-purple-400 bg-purple-500/10' },
                { label: 'CRM Kanban', to: '/crm', icon: Zap, desc: 'Gerenciar pipeline', color: 'text-orange-400 bg-orange-500/10' },
                { label: 'Disparos', to: '/outreach', icon: Send, desc: 'WhatsApp e emails', color: 'text-green-400 bg-green-500/10' },
                { label: 'Relatorios', to: '/reports', icon: BarChart3, desc: 'Metricas e conversao', color: 'text-cyan-400 bg-cyan-500/10' },
              ].map((action) => (
                <Link key={action.to} to={action.to}>
                  <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group cursor-pointer">
                    <div className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center`}>
                      <action.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-200">{action.label}</p>
                      <p className="text-xs text-gray-500">{action.desc}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
