import { useState, useMemo } from 'react'
import {
  FileText, Building2, Filter, Loader2, CheckCircle, AlertCircle,
  Phone, Mail, MapPin, Calendar, Sparkles, RefreshCw, Database,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Input from '@/components/ui/Input'
import { receitaApi } from '@/lib/api'
import { useUIStore } from '@/stores/uiStore'

const UFS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
]

interface Candidato {
  cnpj: string
  cnpj_basico: string
  razao_social: string | null
  nome_fantasia: string | null
  cnae_principal: number | null
  cnae_descricao: string | null
  data_inicio_atividade: string | null
  capital_social: number | null
  porte: string | null
  is_mei: boolean
  endereco: string | null
  cep: string | null
  municipio_nome: string | null
  uf: string | null
  telefone: string | null
  email: string | null
}

interface MetaRow {
  ano_mes: string
  arquivo: string
  status: string
  bytes_baixados: number | null
  bytes_total: number | null
  linhas_inseridas: number | null
  iniciado_em: string | null
  finalizado_em: string | null
  erro: string | null
}

const formatCnpj = (raw: string) => {
  const d = raw.replace(/\D/g, '').padStart(14, '0')
  return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12)}`
}

const formatCurrency = (v: number | null) => {
  if (v === null || v === undefined) return '—'
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const PORTE_LABELS: Record<string, string> = {
  '00': 'Não informado',
  '01': 'Microempresa',
  '03': 'Pequeno porte',
  '05': 'Demais',
}

const STATUS_VARIANT: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info' | 'gray'> = {
  pendente: 'gray',
  baixando: 'info',
  ingerindo: 'info',
  concluido: 'success',
  erro: 'danger',
}

export default function ProspectingReceita() {
  const { showSuccess, showError, showInfo } = useUIStore()

  // filtros
  const [uf, setUf] = useState('PR')
  const [municipioNome, setMunicipioNome] = useState('FOZ DO IGUACU')
  const [cnaePrefixo, setCnaePrefixo] = useState('')
  const [abertoDesde, setAbertoDesde] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 6)
    return d.toISOString().slice(0, 10)
  })
  const [abertoAte, setAbertoAte] = useState('')
  const [comTelefone, setComTelefone] = useState(true)
  const [comEmail, setComEmail] = useState(false)
  const [apenasMei, setApenasMei] = useState<'todos' | 'sim' | 'nao'>('todos')
  const [porte, setPorte] = useState<string[]>([])
  const [capitalMin, setCapitalMin] = useState('')
  const [limit, setLimit] = useState(100)

  // resultados
  const [loading, setLoading] = useState(false)
  const [candidatos, setCandidatos] = useState<Candidato[]>([])
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())
  const [importing, setImporting] = useState(false)

  // ingestion status
  const [showStatus, setShowStatus] = useState(false)
  const [meta, setMeta] = useState<MetaRow[]>([])
  const [loadingMeta, setLoadingMeta] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const togglePorte = (p: string) => {
    setPorte((cur) => cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p])
  }

  const buscar = async () => {
    setLoading(true)
    setSelecionados(new Set())
    try {
      const apenas_mei = apenasMei === 'todos' ? null : apenasMei === 'sim'
      const resp = await receitaApi.search({
        uf,
        municipio_nome: municipioNome.trim() || undefined,
        cnae_prefixo: cnaePrefixo.trim() || undefined,
        aberto_desde: abertoDesde || undefined,
        aberto_ate: abertoAte || undefined,
        com_telefone: comTelefone,
        com_email: comEmail,
        porte: porte.length ? porte : undefined,
        apenas_mei,
        capital_min: capitalMin ? Number(capitalMin) : undefined,
        limit,
      })
      setCandidatos(resp.data.candidatos ?? [])
      if ((resp.data.candidatos?.length ?? 0) === 0) {
        showInfo('Nenhum candidato encontrado', 'Tente afrouxar os filtros ou outra cidade.')
      }
    } catch (e: any) {
      showError('Erro na busca', e?.response?.data?.detail || e?.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleAll = () => {
    if (selecionados.size === candidatos.length) {
      setSelecionados(new Set())
    } else {
      setSelecionados(new Set(candidatos.map((c) => c.cnpj)))
    }
  }

  const toggleSelected = (cnpj: string) => {
    setSelecionados((cur) => {
      const next = new Set(cur)
      if (next.has(cnpj)) next.delete(cnpj)
      else next.add(cnpj)
      return next
    })
  }

  const importar = async () => {
    if (!selecionados.size) return
    setImporting(true)
    try {
      const resp = await receitaApi.importLeads(Array.from(selecionados))
      const { total_criados, ja_existiam } = resp.data
      showSuccess(
        `${total_criados} lead(s) criado(s)`,
        ja_existiam ? `${ja_existiam} já estavam na base e foram pulados.` : undefined,
      )
      setSelecionados(new Set())
    } catch (e: any) {
      showError('Erro na importação', e?.response?.data?.detail || e?.message)
    } finally {
      setImporting(false)
    }
  }

  const carregarStatus = async () => {
    setLoadingMeta(true)
    try {
      const resp = await receitaApi.status()
      setMeta(resp.data.meta ?? [])
      setShowStatus(true)
    } catch (e: any) {
      showError('Erro ao carregar status', e?.response?.data?.detail || e?.message)
    } finally {
      setLoadingMeta(false)
    }
  }

  const dispararSync = async (only?: string[]) => {
    setSyncing(true)
    try {
      const resp = await receitaApi.sync(only ? { only } : {})
      showSuccess('Sync enfileirado', `Task ID: ${resp.data.task_id}`)
      setTimeout(carregarStatus, 1500)
    } catch (e: any) {
      showError('Erro ao disparar sync', e?.response?.data?.detail || e?.message)
    } finally {
      setSyncing(false)
    }
  }

  const todosSelecionados = candidatos.length > 0 && selecionados.size === candidatos.length

  const resumoMeta = useMemo(() => {
    if (!meta.length) return null
    const total = meta.length
    const concluidos = meta.filter((m) => m.status === 'concluido').length
    const erros = meta.filter((m) => m.status === 'erro').length
    const ativos = meta.filter((m) => ['baixando', 'ingerindo', 'pendente'].includes(m.status)).length
    return { total, concluidos, erros, ativos }
  }, [meta])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-fg flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-500" />
            Prospecção por CNPJ
            <Badge variant="info" className="ml-2">Receita Federal</Badge>
          </h1>
          <p className="text-sm text-fg-faint mt-1">
            Captura leads do dump público de CNPJ — empresas recém-abertas, MEIs, e negócios
            que não aparecem no Google Maps.
          </p>
        </div>
        <Button variant="outline" onClick={carregarStatus} loading={loadingMeta}>
          <Database className="w-4 h-4" />
          Status do dump
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="w-4 h-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-fg-muted mb-1">UF</label>
              <select
                value={uf}
                onChange={(e) => setUf(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-bg text-fg hover:border-border-strong focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {UFS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <Input
              label="Município (busca por nome)"
              value={municipioNome}
              onChange={(e) => setMunicipioNome(e.target.value)}
              placeholder="ex: FOZ DO IGUACU"
            />
            <Input
              label="Prefixo CNAE"
              value={cnaePrefixo}
              onChange={(e) => setCnaePrefixo(e.target.value)}
              placeholder='ex: "47" varejo, "56" alimentação'
            />
            <Input
              label="Limite"
              type="number"
              min={1}
              max={1000}
              value={limit}
              onChange={(e) => setLimit(Math.max(1, Math.min(1000, Number(e.target.value) || 100)))}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Aberto desde"
              type="date"
              value={abertoDesde}
              onChange={(e) => setAbertoDesde(e.target.value)}
            />
            <Input
              label="Aberto até"
              type="date"
              value={abertoAte}
              onChange={(e) => setAbertoAte(e.target.value)}
            />
            <Input
              label="Capital social mínimo (R$)"
              type="number"
              min={0}
              value={capitalMin}
              onChange={(e) => setCapitalMin(e.target.value)}
              placeholder="0"
            />
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            <label className="flex items-center gap-2 text-sm text-fg-muted cursor-pointer">
              <input
                type="checkbox"
                checked={comTelefone}
                onChange={(e) => setComTelefone(e.target.checked)}
                className="rounded border-border"
              />
              Tem telefone
            </label>
            <label className="flex items-center gap-2 text-sm text-fg-muted cursor-pointer">
              <input
                type="checkbox"
                checked={comEmail}
                onChange={(e) => setComEmail(e.target.checked)}
                className="rounded border-border"
              />
              Tem e-mail
            </label>

            <div className="flex items-center gap-2 text-sm text-fg-muted">
              MEI:
              <div className="flex border border-border rounded-lg overflow-hidden">
                {(['todos', 'sim', 'nao'] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setApenasMei(opt)}
                    className={`px-3 py-1 text-xs ${apenasMei === opt ? 'bg-fg text-bg' : 'hover:bg-elevated'}`}
                  >
                    {opt === 'todos' ? 'Todos' : opt === 'sim' ? 'Só MEI' : 'Sem MEI'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-fg-muted">
              Porte:
              {Object.entries(PORTE_LABELS).map(([code, label]) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => togglePorte(code)}
                  className={`px-2 py-1 text-xs rounded border transition-colors ${
                    porte.includes(code)
                      ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30'
                      : 'border-border hover:border-border-strong'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={buscar} loading={loading}>
              <Sparkles className="w-4 h-4" />
              Buscar candidatos
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Status do dump */}
      {showStatus && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="w-4 h-4" />
              Status da ingestão Receita
              {resumoMeta && (
                <span className="text-xs font-normal text-fg-faint ml-2">
                  {resumoMeta.concluidos}/{resumoMeta.total} concluídos
                  {resumoMeta.ativos ? ` · ${resumoMeta.ativos} em andamento` : ''}
                  {resumoMeta.erros ? ` · ${resumoMeta.erros} com erro` : ''}
                </span>
              )}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={carregarStatus} loading={loadingMeta}>
                <RefreshCw className="w-3.5 h-3.5" />
                Atualizar
              </Button>
              <Button variant="outline" size="sm" onClick={() => dispararSync(['Cnaes','Municipios','Naturezas','Qualificacoes'])} loading={syncing}>
                Sync auxiliares
              </Button>
              <Button variant="primary" size="sm" onClick={() => dispararSync()} loading={syncing}>
                Sync completo
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {meta.length === 0 ? (
              <div className="p-6 text-center text-sm text-fg-faint">
                Nenhum sync registrado ainda. Dispare um sync acima.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-elevated text-fg-muted">
                    <tr>
                      <th className="text-left px-4 py-2 font-medium">Mês</th>
                      <th className="text-left px-4 py-2 font-medium">Arquivo</th>
                      <th className="text-left px-4 py-2 font-medium">Status</th>
                      <th className="text-right px-4 py-2 font-medium">MB</th>
                      <th className="text-right px-4 py-2 font-medium">Linhas</th>
                      <th className="text-left px-4 py-2 font-medium">Erro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {meta.map((m) => (
                      <tr key={`${m.ano_mes}-${m.arquivo}`} className="border-t border-border">
                        <td className="px-4 py-2 text-fg-muted">{m.ano_mes}</td>
                        <td className="px-4 py-2 text-fg font-mono text-xs">{m.arquivo}</td>
                        <td className="px-4 py-2">
                          <Badge variant={STATUS_VARIANT[m.status] ?? 'gray'}>{m.status}</Badge>
                        </td>
                        <td className="px-4 py-2 text-right text-fg-muted">
                          {m.bytes_baixados ? (m.bytes_baixados / 1024 / 1024).toFixed(1) : '—'}
                        </td>
                        <td className="px-4 py-2 text-right text-fg-muted">
                          {m.linhas_inseridas?.toLocaleString('pt-BR') ?? '—'}
                        </td>
                        <td className="px-4 py-2 text-red-500/80 text-xs truncate max-w-[300px]">
                          {m.erro ?? ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Resultados */}
      {candidatos.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="w-4 h-4" />
              {candidatos.length} candidato(s)
              {selecionados.size > 0 && (
                <span className="text-sm font-normal text-blue-600 dark:text-blue-400">
                  · {selecionados.size} selecionado(s)
                </span>
              )}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={toggleAll}>
                {todosSelecionados ? 'Limpar seleção' : 'Selecionar todos'}
              </Button>
              <Button onClick={importar} loading={importing} disabled={!selecionados.size}>
                <CheckCircle className="w-4 h-4" />
                Importar como leads
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {candidatos.map((c) => {
                const checked = selecionados.has(c.cnpj)
                return (
                  <label
                    key={c.cnpj}
                    className={`flex gap-3 p-4 cursor-pointer transition-colors ${
                      checked ? 'bg-blue-500/5' : 'hover:bg-elevated/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSelected(c.cnpj)}
                      className="mt-1 rounded border-border"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="min-w-0">
                          <p className="font-medium text-fg truncate">
                            {c.nome_fantasia || c.razao_social || '(sem nome)'}
                          </p>
                          {c.razao_social && c.nome_fantasia && c.razao_social !== c.nome_fantasia && (
                            <p className="text-xs text-fg-faint truncate">{c.razao_social}</p>
                          )}
                          <p className="font-mono text-xs text-fg-muted mt-1">
                            {formatCnpj(c.cnpj)}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {c.is_mei && <Badge variant="warning">MEI</Badge>}
                          {c.porte && <Badge variant="gray">{PORTE_LABELS[c.porte] ?? c.porte}</Badge>}
                          {c.cnae_principal && (
                            <Badge variant="default">CNAE {c.cnae_principal}</Badge>
                          )}
                        </div>
                      </div>

                      {c.cnae_descricao && (
                        <p className="text-xs text-fg-muted mt-1">{c.cnae_descricao}</p>
                      )}

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-fg-faint mt-2">
                        {c.endereco && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {c.endereco}{c.municipio_nome ? ` · ${c.municipio_nome}/${c.uf ?? ''}` : ''}
                          </span>
                        )}
                        {c.telefone && (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {c.telefone}
                          </span>
                        )}
                        {c.email && (
                          <span className="inline-flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {c.email}
                          </span>
                        )}
                        {c.data_inicio_atividade && (
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Aberta em {new Date(c.data_inicio_atividade).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                        {c.capital_social !== null && c.capital_social > 0 && (
                          <span>Cap. {formatCurrency(c.capital_social)}</span>
                        )}
                      </div>
                    </div>
                  </label>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && candidatos.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-fg-faint">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              Nenhum resultado ainda. Configure os filtros e clique em <strong>Buscar candidatos</strong>.
            </p>
            <p className="text-xs mt-2">
              Se a busca retornar vazio, pode ser que o dump da Receita ainda não tenha sido ingerido.
              Use o botão <strong>Status do dump</strong> acima.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
