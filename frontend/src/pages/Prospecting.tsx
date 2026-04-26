import { useState, useEffect, useMemo, KeyboardEvent } from 'react'
import { leadsApi } from '@/lib/api'
import { SessionScraping } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import {
  Search, MapPin, Tag as TagIcon, Clock, CheckCircle, AlertCircle,
  Loader2, X, Plus, Star, Globe, Filter, RotateCcw,
} from 'lucide-react'
import { useUIStore } from '@/stores/uiStore'
import { formatDate } from '@/lib/utils'

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

export default function Prospecting() {
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-fg">Prospecção</h1>
        <p className="text-sm text-fg-subtle mt-1">Encontre novos leads no Google Maps em lote</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Nova Busca</CardTitle>
                {(cidades.length > 0 || categorias.length > 0) && (
                  <button
                    type="button"
                    onClick={clear}
                    className="text-xs text-fg-faint hover:text-fg-muted flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    limpar
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
                  <ChipInput
                    values={cidades}
                    onChange={setCidades}
                    placeholder="Digite e Enter (ex: São Paulo)"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-fg-muted mb-1">Estado (opcional, aplicado a todas)</label>
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
                  <ChipInput
                    values={categorias}
                    onChange={setCategorias}
                    placeholder="Digite ou escolha"
                    suggestions={SUGGESTED_CATEGORIES}
                  />
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
                  <div className="flex justify-between text-xs text-fg-faint mt-1">
                    <span>10</span><span>500</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowFilters((v) => !v)}
                  className="text-xs text-fg-subtle hover:text-fg-muted flex items-center gap-1"
                >
                  <Filter className="w-3 h-3" />
                  {showFilters ? 'Esconder filtros' : 'Filtros (rating mínimo, sem site)'}
                </button>

                {showFilters && (
                  <div className="space-y-3 p-3 rounded-lg border border-border bg-bg">
                    <div>
                      <label className="block text-xs font-medium text-fg-muted mb-1 flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        Rating mínimo: <span className="font-bold text-amber-600 dark:text-amber-400">{minRating > 0 ? minRating.toFixed(1) : 'qualquer'}</span>
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={5}
                        step={0.5}
                        value={minRating}
                        onChange={(e) => setMinRating(Number(e.target.value))}
                        className="w-full accent-amber-500"
                      />
                    </div>
                    <label className="flex items-center gap-2 text-xs text-fg-muted cursor-pointer">
                      <input
                        type="checkbox"
                        checked={onlyNoWebsite}
                        onChange={(e) => setOnlyNoWebsite(e.target.checked)}
                        className="accent-blue-600"
                      />
                      <Globe className="w-3 h-3" />
                      Só salvar leads SEM site (oportunidade direta)
                    </label>
                  </div>
                )}

                {totalJobs > 0 && (
                  <div className="text-xs text-fg-subtle bg-elevated rounded-md px-3 py-2">
                    Vai disparar <span className="font-bold text-fg">{totalJobs}</span> sessão(ões){' '}
                    <span className="text-fg-faint">({cidades.length} cidade × {categorias.length} categoria, até {limite} cada)</span>
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
              <CardHeader>
                <CardTitle className="text-sm">Buscas recentes</CardTitle>
              </CardHeader>
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

        {/* Sessions */}
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
                  <p className="text-fg-subtle">Nenhuma sessão iniciada ainda</p>
                  <p className="text-xs text-fg-faint mt-1">Inicie sua primeira prospecção</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[640px] overflow-y-auto">
                  {sessions.map((session) => {
                    const config = SESSION_STATUS_CONFIG[session.status] || SESSION_STATUS_CONFIG.pausado
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
                            <p className="text-sm font-medium text-fg truncate">{session.categoria}</p>
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
