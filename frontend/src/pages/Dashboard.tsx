import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { leadsApi } from '@/lib/api'
import { DashboardStats, DashboardExtra } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import {
  Users, TrendingUp, FileText, DollarSign, Search, ArrowUpRight,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from 'recharts'

const STATUS_LABELS: Record<string, string> = {
  prospectado: 'Prospectado',
  proposta_gerada: 'Proposta Gerada',
  abordado: 'Abordado',
  respondeu: 'Respondeu',
  negociando: 'Negociando',
  fechado: 'Fechado',
  perdido: 'Perdido',
}

const STATUS_COLORS: Record<string, string> = {
  prospectado: '#60a5fa',
  proposta_gerada: '#a78bfa',
  abordado: '#22d3ee',
  respondeu: '#fbbf24',
  negociando: '#fb923c',
  fechado: '#34d399',
  perdido: '#f87171',
}

function formatDay(iso: string) {
  const [, m, d] = iso.split('-')
  return `${d}/${m}`
}

interface TooltipPayload {
  name?: string | number
  value?: string | number
  color?: string
  payload?: { fill?: string }
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayload[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
      {label && <p className="text-fg-faint mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="text-fg font-medium" style={{ color: p.color || p.payload?.fill }}>
          {p.name}: <span className="text-fg">{p.value}</span>
        </p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [extra, setExtra] = useState<DashboardExtra | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([leadsApi.getDashboardStats(), leadsApi.getDashboardExtra()])
      .then(([s, e]) => {
        setStats(s.data)
        setExtra(e.data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const statCards = [
    {
      label: 'Total de Leads',
      value: stats?.total_leads ?? 0,
      icon: Users,
      tone: 'text-blue-600 dark:text-blue-400 bg-blue-500/10',
      change: `+${stats?.leads_hoje ?? 0} hoje`,
    },
    {
      label: 'Propostas Pendentes',
      value: stats?.propostas_pendentes ?? 0,
      icon: FileText,
      tone: 'text-violet-600 dark:text-violet-400 bg-violet-500/10',
      change: 'aguardando aprovação',
    },
    {
      label: 'Em Negociação',
      value: stats?.em_negociacao ?? 0,
      icon: TrendingUp,
      tone: 'text-orange-600 dark:text-orange-400 bg-orange-500/10',
      change: 'leads quentes',
    },
    {
      label: 'Taxa de Conversão',
      value: `${stats?.taxa_conversao ?? 0}%`,
      icon: DollarSign,
      tone: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
      change: `${stats?.fechados ?? 0} fechados`,
    },
  ]

  const timeseriesData = (extra?.timeseries ?? []).map((p) => ({
    ...p,
    label: formatDay(p.day),
  }))

  const statusData = stats?.por_status
    ? Object.entries(stats.por_status).map(([k, v]) => ({
        name: STATUS_LABELS[k] || k,
        value: v,
        key: k,
      }))
    : []

  const categoriasData = (extra?.top_categorias ?? []).map((c) => ({
    name: c.categoria.length > 20 ? c.categoria.slice(0, 18) + '…' : c.categoria,
    leads: c.count,
  }))

  const cidadesData = (extra?.top_cidades ?? []).map((c) => ({
    name: c.cidade.length > 20 ? c.cidade.slice(0, 18) + '…' : c.cidade,
    leads: c.count,
  }))

  const totalLeads = stats?.total_leads ?? 0
  const empty = !loading && totalLeads === 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-fg">Dashboard</h1>
          <p className="text-sm text-fg-subtle mt-1">Visão geral da sua prospecção</p>
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
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.tone}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-fg-faint" />
              </div>
              <div>
                <p className="text-2xl font-bold text-fg">
                  {loading ? (
                    <span className="inline-block w-12 h-6 bg-elevated rounded animate-pulse" />
                  ) : stat.value}
                </p>
                <p className="text-sm text-fg-subtle mt-0.5">{stat.label}</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">{stat.change}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {empty ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-fg-faint mb-4">Você ainda não tem leads cadastrados.</p>
            <Link to="/app/prospecting">
              <Button>Iniciar prospecção</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Timeseries */}
          <Card>
            <CardHeader>
              <CardTitle>Leads por dia (últimos 30 dias)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timeseriesData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="leadsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
                    <XAxis dataKey="label" stroke="rgb(var(--fg-faint))" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="rgb(var(--fg-faint))" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgb(var(--border-strong))', strokeWidth: 1 }} />
                    <Area
                      type="monotone"
                      dataKey="count"
                      name="Leads"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fill="url(#leadsGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Status + Categorias */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Funil de Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={85}
                        paddingAngle={2}
                        stroke="rgb(var(--bg))"
                        strokeWidth={2}
                      >
                        {statusData.map((entry) => (
                          <Cell key={entry.key} fill={STATUS_COLORS[entry.key] || '#71717a'} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                      <Legend
                        verticalAlign="bottom"
                        iconType="circle"
                        formatter={(v) => <span className="text-fg-subtle text-xs">{v}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Categorias</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {categoriasData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoriasData} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" horizontal={false} />
                        <XAxis type="number" stroke="rgb(var(--fg-faint))" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                        <YAxis type="category" dataKey="name" stroke="rgb(var(--fg-faint))" fontSize={11} tickLine={false} axisLine={false} width={120} />
                        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgb(var(--elevated))' }} />
                        <Bar dataKey="leads" name="Leads" fill="#a78bfa" radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-sm text-fg-faint">
                      Sem dados
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cidades + Score */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Cidades</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {cidadesData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={cidadesData} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" horizontal={false} />
                        <XAxis type="number" stroke="rgb(var(--fg-faint))" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                        <YAxis type="category" dataKey="name" stroke="rgb(var(--fg-faint))" fontSize={11} tickLine={false} axisLine={false} width={120} />
                        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgb(var(--elevated))' }} />
                        <Bar dataKey="leads" name="Leads" fill="#34d399" radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-sm text-fg-faint">
                      Sem dados
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={extra?.score_distribution ?? []} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
                      <XAxis dataKey="bucket" stroke="rgb(var(--fg-faint))" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="rgb(var(--fg-faint))" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgb(var(--elevated))' }} />
                      <Bar dataKey="count" name="Leads" fill="#fb923c" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
