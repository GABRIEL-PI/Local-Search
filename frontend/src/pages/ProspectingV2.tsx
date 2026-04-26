import { useState, useEffect, useMemo, KeyboardEvent, lazy, Suspense } from 'react'
import { leadsApi, geogridApi } from '@/lib/api'
import { SessionScraping, Geogrid, GeogridDetail, Lead } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import {
  Search, MapPin, Tag as TagIcon, Clock, CheckCircle, AlertCircle,
  Loader2, X, Plus, Star, Globe, Filter, RotateCcw, Map as MapIcon, Target,
} from 'lucide-react'
import { useUIStore } from '@/stores/uiStore'
import { formatDate } from '@/lib/utils'
import ErrorBoundary from '@/components/ErrorBoundary'
import GeogridGridFallback from '@/components/geogrid/GeogridGridFallback'

const GeogridMapView = lazy(() => import('@/components/geogrid/GeogridMapView'))

const SUGGESTED_CATEGORIES = [
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

interface ChipInputProps {
  values: string[]
  onChange: (next: string[]) => void
  placeholder: string
  suggestions?: string[]
}

function ChipInput({ values, onChange, placeholder, suggestions }: ChipInputProps) {
  const [draft, setDraft] = useState('')
  const [open, setOpen] = useState(false)

  const add = (raw: string) => {
    const v = raw.trim()
    if (!v) return
    const lower = v.toLowerCase()
    if (values.some((x) => x.toLowerCase() === lower)) return
    onChange([...values, v])
    setDraft('')
  }

  const remove = (i: number) => {
    onChange(values.filter((_, idx) => idx !== i))
  }

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      add(draft)
    } else if (e.key === 'Backspace' && !draft && values.length) {
      remove(values.length - 1)
    }
  }

  const filteredSuggestions = useMemo(() => {
    if (!suggestions) return []
    const q = draft.toLowerCase()
    return suggestions
      .filter((s) => !values.some((v) => v.toLowerCase() === s.toLowerCase()))
      .filter((s) => s.toLowerCase().includes(q))
      .slice(0, 6)
  }, [suggestions, values, draft])

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-1.5 p-2 border border-border-strong rounded-lg bg-bg min-h-[42px] focus-within:ring-2 focus-within:ring-blue-500">
        {values.map((v, i) => (
          <span
            key={`${v}-${i}`}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 text-xs"
          >
            {v}
            <button
              type="button"
              onClick={() => remove(i)}
              className="hover:text-blue-900 dark:hover:text-blue-100"
              aria-label={`remover ${v}`}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={draft}
          onChange={(e) => { setDraft(e.target.value); setOpen(true) }}
          onKeyDown={onKey}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={values.length ? '' : placeholder}
          className="flex-1 min-w-[120px] bg-transparent text-sm focus:outline-none text-fg placeholder:text-fg-faint"
        />
      </div>

      {open && filteredSuggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-lg shadow-2xl z-20 max-h-56 overflow-y-auto">
          {filteredSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); add(s) }}
              className="w-full text-left px-3 py-2 text-sm text-fg-muted hover:bg-elevated transition-colors flex items-center gap-2"
            >
              <Plus className="w-3.5 h-3.5 text-fg-faint" />
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function BatchScrapeTab() {
  const { showSuccess, showError } = useUIStore()
  const [loading, setLoading] = useState(false)
  const [sessions, setSessions] = useState<SessionScraping[]>([])

  const [cidades, setCidades] = useState<string[]>([])
  const [estado, setEstado] = useState('')
  const [categorias, setCategorias] = useState<string[]>([])
  const [limite, setLimite] = useState(50)
  const [minRating, setMinRating] = useState(0)
  const [onlyNoWebsite, setOnlyNoWebsite] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

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

  const presets = useMemo(() => {
    const seen = new Set<string>()
    const out: { cidade: string; categoria: string; estado: string | null }[] = []
    for (const s of sessions) {
      const key = `${s.cidade}::${s.categoria}`
      if (seen.has(key)) continue
      seen.add(key)
      out.push({ cidade: s.cidade, categoria: s.categoria, estado: s.estado || null })
      if (out.length >= 6) break
    }
    return out
  }, [sessions])

  const totalJobs = cidades.length * categorias.length

  const applyPreset = (p: { cidade: string; categoria: string; estado: string | null }) => {
    if (!cidades.some((c) => c.toLowerCase() === p.cidade.toLowerCase())) {
      setCidades((prev) => [...prev, p.cidade])
    }
    if (!categorias.some((c) => c.toLowerCase() === p.categoria.toLowerCase())) {
      setCategorias((prev) => [...prev, p.categoria])
    }
    if (p.estado && !estado) setEstado(p.estado)
  }

  const clear = () => {
    setCidades([]); setCategorias([]); setEstado(''); setLimite(50)
    setMinRating(0); setOnlyNoWebsite(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cidades.length) return showError('Adicione ao menos uma cidade')
    if (!categorias.length) return showError('Adicione ao menos uma categoria')

    setLoading(true)
    try {
      const res = await leadsApi.scrapeBatch({
        cidades,
        estado: estado || undefined,
        categorias,
        limite,
        min_rating: minRating > 0 ? minRating : undefined,
        only_no_website: onlyNoWebsite,
      })
      showSuccess('Prospecção em lote iniciada', res.data.message)
      loadSessions()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } }
      showError('Erro ao iniciar', e?.response?.data?.detail || 'Tente novamente')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Nova Busca</CardTitle>
              {(cidades.length > 0 || categorias.length > 0) && (
                <button type="button" onClick={clear} className="text-xs text-fg-faint hover:text-fg-muted flex items-center gap-1">
                  <RotateCcw className="w-3 h-3" /> limpar
                </button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-fg-muted mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Cidades
                </label>
                <ChipInput values={cidades} onChange={setCidades} placeholder="Digite e Enter (ex: São Paulo)" />
              </div>

              <div>
                <label className="block text-xs font-medium text-fg-muted mb-1">Estado (opcional)</label>
                <input
                  type="text"
                  value={estado}
                  onChange={(e) => setEstado(e.target.value.toUpperCase().slice(0, 2))}
                  placeholder="SP"
                  maxLength={2}
                  className="w-20 px-3 py-2 text-sm border border-border-strong rounded-lg bg-bg text-fg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-fg-muted mb-1 flex items-center gap-1">
                  <TagIcon className="w-3 h-3" /> Categorias
                </label>
                <ChipInput values={categorias} onChange={setCategorias} placeholder="Digite ou escolha" suggestions={SUGGESTED_CATEGORIES} />
              </div>

              <div>
                <label className="block text-xs font-medium text-fg-muted mb-1">
                  Limite por busca: <span className="font-bold text-blue-600 dark:text-blue-400">{limite}</span>
                </label>
                <input
                  type="range"
                  min={10}
                  max={500}
                  step={10}
                  value={limite}
                  onChange={(e) => setLimite(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>

              <button type="button" onClick={() => setShowFilters((v) => !v)} className="text-xs text-fg-subtle hover:text-fg-muted flex items-center gap-1">
                <Filter className="w-3 h-3" />
                {showFilters ? 'Esconder filtros' : 'Filtros'}
              </button>

              {showFilters && (
                <div className="space-y-3 p-3 rounded-lg border border-border bg-bg">
                  <div>
                    <label className="block text-xs font-medium text-fg-muted mb-1 flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      Rating mín.: <span className="font-bold text-amber-600 dark:text-amber-400">{minRating > 0 ? minRating.toFixed(1) : 'qualquer'}</span>
                    </label>
                    <input type="range" min={0} max={5} step={0.5} value={minRating} onChange={(e) => setMinRating(Number(e.target.value))} className="w-full accent-amber-500" />
                  </div>
                  <label className="flex items-center gap-2 text-xs text-fg-muted cursor-pointer">
                    <input type="checkbox" checked={onlyNoWebsite} onChange={(e) => setOnlyNoWebsite(e.target.checked)} className="accent-blue-600" />
                    <Globe className="w-3 h-3" /> Só salvar leads SEM site
                  </label>
                </div>
              )}

              {totalJobs > 0 && (
                <div className="text-xs text-fg-subtle bg-elevated rounded-md px-3 py-2">
                  Vai disparar <span className="font-bold text-fg">{totalJobs}</span> sessão(ões)
                </div>
              )}

              <Button type="submit" className="w-full" loading={loading} disabled={!totalJobs}>
                <Search className="w-4 h-4" />
                {totalJobs > 1 ? `Disparar ${totalJobs} buscas` : 'Iniciar Prospecção'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {presets.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Buscas recentes</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {presets.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className="w-full flex items-center gap-2 text-left px-3 py-2 rounded-lg border border-border hover:bg-elevated transition-colors text-xs"
                >
                  <Plus className="w-3.5 h-3.5 text-fg-faint flex-shrink-0" />
                  <span className="text-fg">{p.categoria}</span>
                  <span className="text-fg-faint">em {p.cidade}{p.estado ? `, ${p.estado}` : ''}</span>
                </button>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Sessões de Prospecção</CardTitle>
              <span className="text-xs text-fg-faint">{sessions.length} total</span>
            </div>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-fg-faint mx-auto mb-3" />
                <p className="text-fg-subtle">Nenhuma sessão iniciada</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[640px] overflow-y-auto">
                {sessions.map((session) => {
                  const config = SESSION_STATUS_CONFIG[session.status] || SESSION_STATUS_CONFIG.pausado
                  const Icon = config.icon
                  return (
                    <div key={session.id} className="flex items-center gap-4 p-4 border border-border rounded-xl hover:bg-bg">
                      <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className={`w-5 h-5 text-blue-600 dark:text-blue-400 ${session.status === 'rodando' ? 'animate-spin' : ''}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-fg truncate">{session.categoria}</p>
                          <Badge variant={config.variant} className="text-xs">{config.label}</Badge>
                        </div>
                        <p className="text-xs text-fg-subtle">{session.cidade}{session.estado ? `, ${session.estado}` : ''}</p>
                        <p className="text-xs text-fg-faint mt-0.5">{formatDate(session.iniciado_em)}</p>
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
  )
}

function GeogridView({ detail }: { detail: GeogridDetail }) {
  return (
    <ErrorBoundary fallback={(err) => <GeogridGridFallback detail={detail} error={err} />}>
      <Suspense fallback={
        <div className="h-96 flex items-center justify-center text-sm text-fg-faint">
          <Loader2 className="w-5 h-5 animate-spin" /> Carregando mapa…
        </div>
      }>
        <GeogridMapView detail={detail} />
      </Suspense>
    </ErrorBoundary>
  )
}

function GeogridTab() {
  const { showSuccess, showError } = useUIStore()
  const [leads, setLeads] = useState<Lead[]>([])
  const [sessions, setSessions] = useState<Geogrid[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null)
  const [detail, setDetail] = useState<GeogridDetail | null>(null)
  const [loadingStart, setLoadingStart] = useState(false)

  const [leadId, setLeadId] = useState<number | ''>('')
  const [keyword, setKeyword] = useState('')
  const [gridSize, setGridSize] = useState(5)
  const [spacing, setSpacing] = useState(400)

  useEffect(() => {
    loadLeads()
  }, [])

  useEffect(() => {
    let active = true
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const tick = async () => {
      if (!active) return
      try {
        const res = await geogridApi.list()
        if (!active) return
        setSessions(res.data)
        setSelectedSessionId((cur) => cur ?? (res.data.length > 0 ? res.data[0].id : null))
        const anyRunning = (res.data as Geogrid[]).some((s) => s.status === 'rodando')
        if (anyRunning) {
          timeoutId = setTimeout(tick, 8000)
        }
      } catch {
        if (active) timeoutId = setTimeout(tick, 15000)
      }
    }
    tick()
    return () => { active = false; if (timeoutId) clearTimeout(timeoutId) }
  }, [])

  useEffect(() => {
    if (!selectedSessionId) {
      setDetail(null)
      return
    }
    let active = true
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const tick = async () => {
      if (!active) return
      try {
        const res = await geogridApi.get(selectedSessionId)
        if (!active) return
        setDetail(res.data)
        if (res.data.status === 'rodando') {
          timeoutId = setTimeout(tick, 5000)
        } else {
          // sessão terminou — atualiza a lista 1x e para
          geogridApi.list().then((r) => active && setSessions(r.data)).catch(() => {})
        }
      } catch {
        if (active) timeoutId = setTimeout(tick, 10000)
      }
    }
    tick()
    return () => { active = false; if (timeoutId) clearTimeout(timeoutId) }
  }, [selectedSessionId])

  const loadLeads = async () => {
    try {
      const res = await leadsApi.list({ limit: 200 })
      const items: Lead[] = res.data.items || []
      setLeads(items.filter((l) => l.latitude && l.longitude))
    } catch {
      // silent
    }
  }

  const loadSessions = async () => {
    try {
      const res = await geogridApi.list()
      setSessions(res.data)
      if (!selectedSessionId && res.data.length > 0) {
        setSelectedSessionId(res.data[0].id)
      }
    } catch {
      // silent
    }
  }

  const selectedLead = leads.find((l) => l.id === leadId)

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!leadId) return showError('Selecione um lead com lat/lng')
    setLoadingStart(true)
    try {
      const res = await geogridApi.start({
        lead_id: Number(leadId),
        keyword: keyword.trim() || undefined,
        grid_size: gridSize,
        spacing_meters: spacing,
      })
      if (res.data.error) {
        showError('Erro', res.data.error)
      } else {
        showSuccess('Geogrid iniciado', `${gridSize * gridSize} pontos enfileirados`)
        loadSessions()
        setSelectedSessionId(res.data.geogrid_id)
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } }
      showError('Erro', e?.response?.data?.detail || 'Tente novamente')
    } finally {
      setLoadingStart(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-4 h-4" /> Novo Mapa de Calor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleStart} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-fg-muted mb-1">Lead (precisa ter lat/lng)</label>
                <select
                  value={leadId}
                  onChange={(e) => setLeadId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 text-sm border border-border-strong rounded-lg bg-bg text-fg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Selecionar lead...</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.nome} {l.cidade ? `— ${l.cidade}` : ''}
                    </option>
                  ))}
                </select>
                {leads.length === 0 && (
                  <p className="text-xs text-fg-faint mt-1">Nenhum lead com coordenadas. Faça uma prospecção primeiro.</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-fg-muted mb-1">Palavra-chave (default: categoria do lead)</label>
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder={selectedLead?.categoria || 'ex: pizzaria'}
                  className="w-full px-3 py-2 text-sm border border-border-strong rounded-lg bg-bg text-fg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-fg-muted mb-1">
                  Grade: <span className="font-bold text-violet-600 dark:text-violet-400">{gridSize}×{gridSize}</span> = <span className="font-bold text-fg">{gridSize * gridSize}</span> pontos
                </label>
                <input
                  type="range"
                  min={3}
                  max={9}
                  step={2}
                  value={gridSize}
                  onChange={(e) => setGridSize(Number(e.target.value))}
                  className="w-full accent-violet-600"
                />
                <div className="flex justify-between text-xs text-fg-faint mt-1">
                  <span>3×3</span><span>5×5</span><span>7×7</span><span>9×9</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-fg-muted mb-1">
                  Espaçamento entre pontos: <span className="font-bold text-violet-600 dark:text-violet-400">{spacing}m</span>
                </label>
                <input
                  type="range"
                  min={100}
                  max={2000}
                  step={100}
                  value={spacing}
                  onChange={(e) => setSpacing(Number(e.target.value))}
                  className="w-full accent-violet-600"
                />
                <div className="flex justify-between text-xs text-fg-faint mt-1">
                  <span>100m</span><span>2km</span>
                </div>
              </div>

              <div className="text-xs text-fg-subtle bg-elevated rounded-md px-3 py-2">
                Cobertura: <span className="font-bold text-fg">~{((gridSize - 1) * spacing / 1000).toFixed(1)} km</span> de lado.
                Cada ponto = 1 chamada ao scraper. <span className="text-amber-600 dark:text-amber-400">Pode levar alguns minutos.</span>
              </div>

              <Button type="submit" className="w-full" loading={loadingStart} disabled={!leadId}>
                <Target className="w-4 h-4" />
                Iniciar Geogrid
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Sessões anteriores</CardTitle></CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <p className="text-xs text-fg-faint text-center py-4">Nenhuma ainda</p>
            ) : (
              <div className="space-y-1 max-h-80 overflow-y-auto">
                {sessions.map((s) => {
                  const config = SESSION_STATUS_CONFIG[s.status] || SESSION_STATUS_CONFIG.pausado
                  const Icon = config.icon
                  const isSelected = s.id === selectedSessionId
                  const pct = s.total_pontos > 0 ? Math.round((s.pontos_concluidos / s.total_pontos) * 100) : 0
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSessionId(s.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        isSelected ? 'border-violet-500/50 bg-violet-500/5' : 'border-border hover:bg-elevated'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className={`w-3.5 h-3.5 ${config.variant === 'info' ? 'text-blue-500 animate-spin' : config.variant === 'success' ? 'text-emerald-500' : 'text-red-500'}`} />
                        <span className="text-xs font-medium text-fg truncate flex-1">{s.keyword}</span>
                        <span className="text-[10px] text-fg-faint">{s.grid_size}×{s.grid_size}</span>
                      </div>
                      <div className="h-1 bg-bg rounded overflow-hidden">
                        <div className="h-full bg-violet-500 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-[10px] text-fg-faint mt-1">
                        {s.pontos_concluidos}/{s.total_pontos} pontos · {formatDate(s.iniciado_em)}
                      </p>
                    </button>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapIcon className="w-4 h-4" />
              {detail ? `${detail.lead_nome} — "${detail.keyword}"` : 'Mapa de calor'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!detail ? (
              <div className="text-center py-16">
                <MapIcon className="w-16 h-16 text-fg-faint mx-auto mb-3" />
                <p className="text-fg-subtle">Selecione ou inicie um geogrid</p>
              </div>
            ) : (
              <GeogridView detail={detail} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function ProspectingV2() {
  const [tab, setTab] = useState<'batch' | 'geogrid'>('batch')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-fg">Prospecção</h1>
            <span className="px-2 py-0.5 text-xs font-bold bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/30 rounded-md">
              v2 BETA
            </span>
          </div>
          <p className="text-sm text-fg-subtle mt-1">Versão experimental — busca em lote + mapa de calor de ranking</p>
        </div>
      </div>

      <div className="border-b border-border">
        <nav className="flex gap-6">
          <button
            onClick={() => setTab('batch')}
            className={`pb-3 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-2 ${
              tab === 'batch' ? 'border-blue-500 text-fg' : 'border-transparent text-fg-faint hover:text-fg-muted'
            }`}
          >
            <Search className="w-4 h-4" />
            Buscar leads
          </button>
          <button
            onClick={() => setTab('geogrid')}
            className={`pb-3 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-2 ${
              tab === 'geogrid' ? 'border-violet-500 text-fg' : 'border-transparent text-fg-faint hover:text-fg-muted'
            }`}
          >
            <Target className="w-4 h-4" />
            Mapa de calor
          </button>
        </nav>
      </div>

      {tab === 'batch' ? <BatchScrapeTab /> : <GeogridTab />}
    </div>
  )
}
