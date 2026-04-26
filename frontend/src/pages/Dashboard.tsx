import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { leadsApi } from '@/lib/api'
import { DashboardStats } from '@/types'
import { Card, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import {
  Users, TrendingUp, FileText, DollarSign,
  ArrowRight, Search, InboxIcon, Zap
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    leadsApi.getDashboardStats()
      .then((res) => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const statCards = [
    {
      label: 'Total de Leads',
      value: stats?.total_leads ?? 0,
      icon: Users,
      color: 'text-blue-600 bg-blue-50',
      change: `+${stats?.leads_hoje ?? 0} hoje`,
    },
    {
      label: 'Propostas Pendentes',
      value: stats?.propostas_pendentes ?? 0,
      icon: FileText,
      color: 'text-purple-600 bg-purple-50',
      change: 'aguardando aprovação',
    },
    {
      label: 'Em Negociação',
      value: stats?.em_negociacao ?? 0,
      icon: TrendingUp,
      color: 'text-orange-600 bg-orange-50',
      change: 'leads quentes',
    },
    {
      label: 'Taxa de Conversão',
      value: `${stats?.taxa_conversao ?? 0}%`,
      icon: DollarSign,
      color: 'text-green-600 bg-green-50',
      change: `${stats?.fechados ?? 0} fechados`,
    },
  ]

  const quickActions = [
    { label: 'Nova Prospecção', to: '/prospecting', icon: Search, color: 'bg-blue-600 hover:bg-blue-700' },
    { label: 'Fila de Aprovação', to: '/queue', icon: InboxIcon, color: 'bg-purple-600 hover:bg-purple-700' },
    { label: 'Ver CRM', to: '/crm', icon: Zap, color: 'bg-orange-600 hover:bg-orange-700' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Visão geral da sua prospecção</p>
        </div>
        <Link to="/app/prospecting">
          <Button>
            <Search className="w-4 h-4" />
            Nova Prospecção
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => (
          <Card key={idx}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? (
                    <span className="inline-block w-12 h-6 bg-gray-200 rounded animate-pulse" />
                  ) : stat.value}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">{stat.label}</p>
                <p className="text-xs text-green-600 mt-1">{stat.change}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {quickActions.map((action) => (
              <Link key={action.to} to={action.to}>
                <button
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-white transition-colors ${action.color}`}
                >
                  <div className="flex items-center gap-3">
                    <action.icon className="w-5 h-5" />
                    <span className="font-medium text-sm">{action.label}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 opacity-70" />
                </button>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Funnel */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Funil de Vendas</h2>
          {stats?.por_status && Object.keys(stats.por_status).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(stats.por_status).map(([status, count]) => {
                const total = stats.total_leads
                const pct = total > 0 ? (count / total) * 100 : 0
                const labels: Record<string, string> = {
                  prospectado: 'Prospectado',
                  proposta_gerada: 'Proposta Gerada',
                  abordado: 'Abordado',
                  respondeu: 'Respondeu',
                  negociando: 'Negociando',
                  fechado: 'Fechado',
                  perdido: 'Perdido',
                }
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">{labels[status] || status}</span>
                      <span className="font-medium text-gray-900">{count}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400 text-sm">Nenhum lead ainda.</p>
              <Link to="/app/prospecting">
                <Button className="mt-3" size="sm">
                  Iniciar prospecção
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
