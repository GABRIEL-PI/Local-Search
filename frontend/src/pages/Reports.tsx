import { useState, useEffect } from 'react'
import { reportsApi } from '@/lib/api'
import { FunnelReport, RevenueReport, PerformanceReport } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  FunnelChart, Funnel, LabelList, Cell, PieChart, Pie
} from 'recharts'
import { RefreshCw, TrendingUp, DollarSign, Users, BarChart3 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#6b7280']

export default function Reports() {
  const [funnel, setFunnel] = useState<FunnelReport | null>(null)
  const [revenue, setRevenue] = useState<RevenueReport | null>(null)
  const [performance, setPerformance] = useState<PerformanceReport | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAll()
  }, [])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [f, r, p] = await Promise.all([
        reportsApi.getFunnel(),
        reportsApi.getRevenue(),
        reportsApi.getPerformance(),
      ])
      setFunnel(f.data)
      setRevenue(r.data)
      setPerformance(p.data)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <RefreshCw className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-spin" />
        <span className="ml-2 text-fg-subtle">Carregando relatórios...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-fg">Relatórios</h1>
        <p className="text-sm text-fg-subtle mt-1">Performance e análise do funil de vendas</p>
      </div>

      {/* Revenue KPIs */}
      {revenue && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Receita Total', value: formatCurrency(revenue.total_revenue), icon: DollarSign, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10' },
            { label: 'MRR', value: formatCurrency(revenue.mrr), icon: TrendingUp, color: 'text-blue-600 dark:text-blue-400 bg-blue-500/10' },
            { label: 'ARR', value: formatCurrency(revenue.arr), icon: TrendingUp, color: 'text-violet-600 dark:text-violet-400 bg-violet-500/10' },
            { label: 'Clientes Ativos', value: revenue.active_clients, icon: Users, color: 'text-orange-600 dark:text-orange-400 bg-orange-500/10' },
          ].map((kpi, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${kpi.color}`}>
                  <kpi.icon className="w-5 h-5" />
                </div>
                <p className="text-xl font-bold text-fg">{kpi.value}</p>
                <p className="text-xs text-fg-subtle mt-0.5">{kpi.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funnel */}
        {funnel && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Funil de Vendas</CardTitle>
                <span className="text-sm text-fg-subtle">
                  Conversão: <strong className="text-emerald-600 dark:text-emerald-400">{funnel.taxa_conversao}%</strong>
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {funnel.funnel.map((stage, i) => {
                  const maxCount = Math.max(...funnel.funnel.map(s => s.count), 1)
                  const pct = (stage.count / maxCount) * 100
                  return (
                    <div key={stage.status}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-fg-muted">{stage.label}</span>
                        <span className="font-bold">{stage.count}</span>
                      </div>
                      <div className="h-3 bg-elevated rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: COLORS[i % COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Revenue Chart */}
        {revenue && revenue.monthly.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Receita Mensal</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={revenue.monthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${v}`} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Performance */}
      {performance && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Performance de Alcance</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-sm text-fg-muted">Total de Leads</span>
                  <span className="font-bold text-fg">{performance.total_leads}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-sm text-fg-muted">Mensagens Enviadas</span>
                  <span className="font-bold text-fg">{performance.total_sent}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-sm text-fg-muted">Respostas Recebidas</span>
                  <span className="font-bold text-fg">{performance.total_replied}</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm text-fg-muted">Taxa de Resposta</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{performance.response_rate}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {performance.by_category.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Fechamentos por Nicho</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {performance.by_category.slice(0, 8).map((cat, i) => (
                    <div key={cat.categoria} className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      />
                      <span className="text-sm text-fg-muted flex-1 truncate">{cat.categoria || 'Sem categoria'}</span>
                      <span className="font-bold text-sm text-fg">{cat.fechados}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
