import { useState, useEffect, useCallback } from 'react'
import { outreachApi, leadsApi } from '@/lib/api'
import { Disparo, Lead } from '@/types'
import { Card, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import { useUIStore } from '@/stores/uiStore'
import {
  Send, RefreshCw, MessageCircle, Mail, Clock,
  CheckCircle, AlertCircle, Eye, Phone, Search,
  Filter, ArrowRight, Zap
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface OutreachItem {
  disparo: Disparo
  lead?: Lead
}

const STATUS_MAP: Record<string, { label: string; variant: 'gray' | 'info' | 'success' | 'warning' | 'danger' }> = {
  pendente: { label: 'Pendente', variant: 'warning' },
  enviado: { label: 'Enviado', variant: 'info' },
  entregue: { label: 'Entregue', variant: 'info' },
  lido: { label: 'Lido', variant: 'success' },
  respondido: { label: 'Respondido', variant: 'success' },
  erro: { label: 'Erro', variant: 'danger' },
}

export default function Outreach() {
  const { showSuccess, showError } = useUIStore()
  const [items, setItems] = useState<OutreachItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<OutreachItem | null>(null)
  const [showSendModal, setShowSendModal] = useState(false)
  const [sendForm, setSendForm] = useState({ lead_id: '', canal: 'whatsapp' as 'whatsapp' | 'email', mensagem: '' })
  const [sending, setSending] = useState(false)
  const [filter, setFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const loadQueue = useCallback(async () => {
    setLoading(true)
    try {
      const res = await outreachApi.getQueue()
      const disparos: Disparo[] = res.data

      const itemsWithLeads: OutreachItem[] = await Promise.all(
        disparos.map(async (d) => {
          try {
            const leadRes = await leadsApi.get(d.lead_id)
            return { disparo: d, lead: leadRes.data }
          } catch {
            return { disparo: d, lead: { id: d.lead_id, nome: `Lead #${d.lead_id}` } as Lead }
          }
        })
      )

      setItems(itemsWithLeads)
    } catch {
      showError('Erro ao carregar fila de disparos')
    } finally {
      setLoading(false)
    }
  }, [showError])

  useEffect(() => {
    loadQueue()
  }, [loadQueue])

  const handleSend = async () => {
    if (!sendForm.lead_id || !sendForm.mensagem) {
      showError('Preencha todos os campos')
      return
    }
    setSending(true)
    try {
      await outreachApi.send({
        lead_id: parseInt(sendForm.lead_id),
        canal: sendForm.canal,
        mensagem: sendForm.mensagem,
      })
      showSuccess('Mensagem enviada para a fila!')
      setShowSendModal(false)
      setSendForm({ lead_id: '', canal: 'whatsapp', mensagem: '' })
      loadQueue()
    } catch {
      showError('Erro ao enviar mensagem')
    } finally {
      setSending(false)
    }
  }

  const filteredItems = items.filter((item) => {
    if (filter !== 'all' && item.disparo.status !== filter) return false
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      const name = item.lead?.nome?.toLowerCase() || ''
      return name.includes(term)
    }
    return true
  })

  const stats = {
    total: items.length,
    pendentes: items.filter((i) => i.disparo.status === 'pendente').length,
    enviados: items.filter((i) => ['enviado', 'entregue'].includes(i.disparo.status)).length,
    respondidos: items.filter((i) => i.disparo.status === 'respondido').length,
    erros: items.filter((i) => i.disparo.status === 'erro').length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <RefreshCw className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-spin" />
        <span className="ml-2 text-fg-subtle">Carregando disparos...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-fg">Disparos</h1>
          <p className="text-sm text-fg-subtle mt-1">Gerencie mensagens WhatsApp e emails enviados aos leads</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={loadQueue}>
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </Button>
          <Button variant="primary" size="sm" onClick={() => setShowSendModal(true)}>
            <Send className="w-4 h-4" />
            Novo Disparo
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-fg">{stats.total}</p>
            <p className="text-xs text-fg-subtle">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.pendentes}</p>
            <p className="text-xs text-fg-subtle">Pendentes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.enviados}</p>
            <p className="text-xs text-fg-subtle">Enviados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.respondidos}</p>
            <p className="text-xs text-fg-subtle">Respondidos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.erros}</p>
            <p className="text-xs text-fg-subtle">Erros</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-faint" />
          <input
            type="text"
            placeholder="Buscar por nome do lead..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm bg-bg border border-border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-1">
          {[
            { key: 'all', label: 'Todos' },
            { key: 'pendente', label: 'Pendentes' },
            { key: 'enviado', label: 'Enviados' },
            { key: 'respondido', label: 'Respondidos' },
            { key: 'erro', label: 'Erros' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filter === f.key
                  ? 'bg-blue-600 text-fg'
                  : 'bg-elevated text-fg-muted hover:bg-elevated'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {filteredItems.length === 0 ? (
        <Card>
          <CardContent className="py-24 text-center">
            <Send className="w-16 h-16 text-fg-faint mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-fg">Nenhum disparo encontrado</h2>
            <p className="text-fg-faint mt-2">
              {filter !== 'all'
                ? 'Nenhum disparo com esse filtro'
                : 'Aprove propostas para gerar follow-ups automaticos ou envie mensagens manualmente'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredItems.map((item) => {
            const st = STATUS_MAP[item.disparo.status] || STATUS_MAP.pendente
            return (
              <Card key={item.disparo.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {/* Channel icon */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        item.disparo.canal === 'whatsapp' ? 'bg-emerald-500/10' : 'bg-blue-500/10'
                      }`}>
                        {item.disparo.canal === 'whatsapp' ? (
                          <Phone className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-fg truncate">
                            {item.lead?.nome || `Lead #${item.disparo.lead_id}`}
                          </p>
                          <Badge variant={st.variant} className="text-xs flex-shrink-0">
                            {st.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-fg-subtle truncate mt-0.5">
                          {item.disparo.mensagem_enviada?.substring(0, 80)}
                          {(item.disparo.mensagem_enviada?.length || 0) > 80 ? '...' : ''}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-fg-faint">
                          <span className="capitalize">{item.disparo.canal}</span>
                          <span>{formatDate(item.disparo.criado_em)}</span>
                          {item.disparo.tentativas > 1 && (
                            <span className="text-orange-500">{item.disparo.tentativas} tentativas</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                      {item.disparo.status === 'respondido' && item.disparo.resposta_recebida && (
                        <div className="hidden md:flex items-center gap-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded-lg text-xs max-w-[200px]">
                          <MessageCircle className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{item.disparo.resposta_recebida}</span>
                        </div>
                      )}
                      {item.disparo.status === 'erro' && (
                        <div className="hidden md:flex items-center gap-1 bg-red-500/10 text-red-600 dark:text-red-400 px-2 py-1 rounded-lg text-xs max-w-[200px]">
                          <AlertCircle className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{item.disparo.erro_descricao || 'Erro no envio'}</span>
                        </div>
                      )}
                      <Button variant="outline" size="sm" onClick={() => setSelectedItem(item)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        open={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title="Detalhes do Disparo"
        size="lg"
      >
        {selectedItem && (
          <div className="p-6 space-y-5">
            {/* Lead info */}
            <div className="flex items-center gap-3 pb-4 border-b border-border">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                selectedItem.disparo.canal === 'whatsapp' ? 'bg-emerald-500/10' : 'bg-blue-500/10'
              }`}>
                {selectedItem.disparo.canal === 'whatsapp' ? (
                  <Phone className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                )}
              </div>
              <div>
                <p className="font-semibold text-fg">{selectedItem.lead?.nome}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant={STATUS_MAP[selectedItem.disparo.status]?.variant || 'gray'}>
                    {STATUS_MAP[selectedItem.disparo.status]?.label || selectedItem.disparo.status}
                  </Badge>
                  <span className="text-xs text-fg-faint capitalize">{selectedItem.disparo.canal}</span>
                </div>
              </div>
            </div>

            {/* Message sent */}
            <div>
              <h4 className="text-sm font-semibold text-fg mb-2">Mensagem Enviada</h4>
              <div className="bg-bg rounded-xl p-4 text-sm text-fg whitespace-pre-wrap">
                {selectedItem.disparo.mensagem_enviada || 'Nenhuma mensagem'}
              </div>
            </div>

            {/* Response */}
            {selectedItem.disparo.resposta_recebida && (
              <div>
                <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 mb-2">Resposta Recebida</h4>
                <div className="bg-emerald-500/10 border border-green-100 rounded-xl p-4 text-sm text-fg whitespace-pre-wrap">
                  {selectedItem.disparo.resposta_recebida}
                </div>
              </div>
            )}

            {/* Error */}
            {selectedItem.disparo.erro_descricao && (
              <div>
                <h4 className="text-sm font-semibold text-red-700 dark:text-red-300 mb-2">Erro</h4>
                <div className="bg-red-500/10 border border-red-100 rounded-xl p-4 text-sm text-red-700 dark:text-red-300">
                  {selectedItem.disparo.erro_descricao}
                </div>
              </div>
            )}

            {/* Timeline */}
            <div>
              <h4 className="text-sm font-semibold text-fg mb-3">Timeline</h4>
              <div className="space-y-3">
                <TimelineItem label="Criado" date={selectedItem.disparo.criado_em} icon={<Clock className="w-4 h-4" />} />
                {selectedItem.disparo.agendado_para && (
                  <TimelineItem label="Agendado para" date={selectedItem.disparo.agendado_para} icon={<Clock className="w-4 h-4" />} />
                )}
                {selectedItem.disparo.enviado_em && (
                  <TimelineItem label="Enviado" date={selectedItem.disparo.enviado_em} icon={<Send className="w-4 h-4" />} active />
                )}
                {selectedItem.disparo.lido_em && (
                  <TimelineItem label="Lido" date={selectedItem.disparo.lido_em} icon={<Eye className="w-4 h-4" />} active />
                )}
                {selectedItem.disparo.respondido_em && (
                  <TimelineItem label="Respondido" date={selectedItem.disparo.respondido_em} icon={<CheckCircle className="w-4 h-4" />} success />
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Send Modal */}
      <Modal
        open={showSendModal}
        onClose={() => setShowSendModal(false)}
        title="Novo Disparo"
        size="md"
      >
        <div className="p-6 space-y-4">
          <Input
            label="ID do Lead"
            type="number"
            placeholder="Ex: 1"
            value={sendForm.lead_id}
            onChange={(e) => setSendForm((f) => ({ ...f, lead_id: e.target.value }))}
          />

          <div>
            <label className="block text-sm font-medium text-fg mb-1">Canal</label>
            <div className="flex gap-2">
              <button
                onClick={() => setSendForm((f) => ({ ...f, canal: 'whatsapp' }))}
                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                  sendForm.canal === 'whatsapp'
                    ? 'border-green-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                    : 'border-border text-fg-subtle hover:border-border-strong'
                }`}
              >
                <Phone className="w-5 h-5" />
                WhatsApp
              </button>
              <button
                onClick={() => setSendForm((f) => ({ ...f, canal: 'email' }))}
                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                  sendForm.canal === 'email'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-300'
                    : 'border-border text-fg-subtle hover:border-border-strong'
                }`}
              >
                <Mail className="w-5 h-5" />
                Email
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-fg mb-1">Mensagem</label>
            <textarea
              rows={5}
              value={sendForm.mensagem}
              onChange={(e) => setSendForm((f) => ({ ...f, mensagem: e.target.value }))}
              placeholder="Digite a mensagem a ser enviada..."
              className="w-full px-3 py-2 text-sm border border-border-strong rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowSendModal(false)} className="flex-1">
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleSend} loading={sending} className="flex-1">
              <Send className="w-4 h-4" />
              Enviar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function TimelineItem({ label, date, icon, active, success }: {
  label: string; date: string; icon: React.ReactNode; active?: boolean; success?: boolean
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        success ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : active ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'bg-elevated text-fg-faint'
      }`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-fg">{label}</p>
        <p className="text-xs text-fg-faint">{formatDate(date)}</p>
      </div>
    </div>
  )
}
