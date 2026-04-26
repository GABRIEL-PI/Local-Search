import { useState, useEffect } from 'react'
import { leadsApi } from '@/lib/api'
import { SessionScraping } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import { Search, MapPin, Tag, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { useUIStore } from '@/stores/uiStore'
import { formatDate } from '@/lib/utils'

const CATEGORIES = [
  'Restaurante', 'Pizzaria', 'Hamburgueria', 'Padaria', 'Lanchonete',
  'Barbearia', 'Salão de Beleza', 'Manicure', 'Estética',
  'Academia', 'Pilates', 'Yoga',
  'Clínica Médica', 'Dentista', 'Psicólogo', 'Fisioterapia',
  'Farmácia', 'Pet Shop', 'Veterinário',
  'Oficina Mecânica', 'Lava-jato',
  'Loja de Roupas', 'Calçados',
  'Advocacia', 'Contabilidade', 'Imobiliária',
]

const SESSION_STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'gray'; icon: typeof CheckCircle }> = {
  rodando: { label: 'Rodando', variant: 'info', icon: Loader2 },
  concluido: { label: 'Concluído', variant: 'success', icon: CheckCircle },
  erro: { label: 'Erro', variant: 'danger', icon: AlertCircle },
  pausado: { label: 'Pausado', variant: 'warning', icon: Clock },
}

export default function Prospecting() {
  const { showSuccess, showError } = useUIStore()
  const [loading, setLoading] = useState(false)
  const [sessions, setSessions] = useState<SessionScraping[]>([])

  const [form, setForm] = useState({
    cidade: '',
    estado: '',
    categoria: '',
    customCategoria: '',
    limite: 50,
  })

  useEffect(() => {
    loadSessions()
    const interval = setInterval(loadSessions, 10000)
    return () => clearInterval(interval)
  }, [])

  const loadSessions = async () => {
    try {
      const res = await leadsApi.getScrapingSessions()
      setSessions(res.data)
    } catch {
      // silent
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.cidade) return showError('Informe a cidade')
    const cat = form.categoria === '__custom__' ? form.customCategoria : form.categoria
    if (!cat) return showError('Informe a categoria')

    setLoading(true)
    try {
      const res = await leadsApi.scrape({
        cidade: form.cidade,
        estado: form.estado || undefined,
        categoria: cat,
        limite: form.limite,
      })
      showSuccess('Prospecção iniciada!', res.data.message)
      loadSessions()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } }
      showError('Erro ao iniciar', e?.response?.data?.detail || 'Tente novamente')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-fg">Prospecção</h1>
        <p className="text-sm text-fg-subtle mt-1">Encontre novos leads no Google Maps</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Nova Busca</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-fg-muted mb-1">Cidade *</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-faint" />
                      <input
                        type="text"
                        value={form.cidade}
                        onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                        placeholder="Ex: São Paulo"
                        className="pl-9 pr-3 py-2 text-sm border border-border-strong rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                  <div className="w-20">
                    <label className="block text-xs font-medium text-fg-muted mb-1">Estado</label>
                    <input
                      type="text"
                      value={form.estado}
                      onChange={(e) => setForm({ ...form, estado: e.target.value.toUpperCase().slice(0, 2) })}
                      placeholder="SP"
                      maxLength={2}
                      className="px-3 py-2 text-sm border border-border-strong rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-fg-muted mb-1">Categoria *</label>
                  <select
                    value={form.categoria}
                    onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-border-strong rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Selecionar categoria</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    <option value="__custom__">Outra (digitar)</option>
                  </select>
                </div>

                {form.categoria === '__custom__' && (
                  <Input
                    label="Categoria personalizada"
                    value={form.customCategoria}
                    onChange={(e) => setForm({ ...form, customCategoria: e.target.value })}
                    placeholder="Ex: Loja de Bicicletas"
                    required
                  />
                )}

                <div>
                  <label className="block text-xs font-medium text-fg-muted mb-1">
                    Limite de leads: <span className="font-bold text-blue-600 dark:text-blue-400">{form.limite}</span>
                  </label>
                  <input
                    type="range"
                    min={10}
                    max={200}
                    step={10}
                    value={form.limite}
                    onChange={(e) => setForm({ ...form, limite: Number(e.target.value) })}
                    className="w-full accent-blue-600"
                  />
                  <div className="flex justify-between text-xs text-fg-faint mt-1">
                    <span>10</span><span>200</span>
                  </div>
                </div>

                <Button type="submit" className="w-full" loading={loading}>
                  <Search className="w-4 h-4" />
                  Iniciar Prospecção
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sessions */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Sessões de Prospecção</CardTitle>
            </CardHeader>
            <CardContent>
              {sessions.length === 0 ? (
                <div className="text-center py-12">
                  <Search className="w-12 h-12 text-fg-faint mx-auto mb-3" />
                  <p className="text-fg-subtle">Nenhuma sessão iniciada ainda</p>
                  <p className="text-xs text-fg-faint mt-1">Inicie sua primeira prospecção</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions.map((session) => {
                    const config = SESSION_STATUS_CONFIG[session.status]
                    const Icon = config.icon
                    return (
                      <div
                        key={session.id}
                        className="flex items-center gap-4 p-4 border border-border rounded-xl hover:bg-bg"
                      >
                        <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Icon className={`w-5 h-5 text-blue-600 dark:text-blue-400 ${session.status === 'rodando' ? 'animate-spin' : ''}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-fg">{session.categoria}</p>
                            <Badge variant={config.variant} className="text-xs">{config.label}</Badge>
                          </div>
                          <p className="text-xs text-fg-subtle">
                            {session.cidade}{session.estado ? `, ${session.estado}` : ''}
                          </p>
                          <p className="text-xs text-fg-faint mt-0.5">
                            {formatDate(session.iniciado_em)}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-lg font-bold text-fg">{session.leads_salvos}</p>
                          <p className="text-xs text-fg-faint">salvos</p>
                          <p className="text-xs text-fg-faint">{session.leads_encontrados} encontrados</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
