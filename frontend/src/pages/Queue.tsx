import { useState, useEffect } from 'react'
import { proposalsApi, leadsApi } from '@/lib/api'
import { Proposal, Lead } from '@/types'
import { Card, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import LandingPagePreview from '@/components/proposals/LandingPagePreview'
import { useUIStore } from '@/stores/uiStore'
import {
  CheckCircle, XCircle, Eye, MessageCircle,
  Send, RefreshCw, InboxIcon, FileText, Sparkles
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface QueueItem {
  proposal: Proposal
  lead?: Lead
}

export default function Queue() {
  const { showSuccess, showError } = useUIStore()
  const [items, setItems] = useState<QueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProposal, setSelectedProposal] = useState<QueueItem | null>(null)
  const [activeMessage, setActiveMessage] = useState<'formal' | 'descontraida' | 'urgencia'>('formal')
  const [sendingId, setSendingId] = useState<number | null>(null)

  useEffect(() => {
    loadQueue()
  }, [])

  const loadQueue = async () => {
    setLoading(true)
    try {
      const res = await proposalsApi.getQueue()
      const proposals: Proposal[] = res.data

      const itemsWithLeads = await Promise.all(
        proposals.map(async (p) => {
          try {
            const leadRes = await leadsApi.get(p.lead_id)
            return { proposal: p, lead: leadRes.data }
          } catch {
            return { proposal: p }
          }
        })
      )
      setItems(itemsWithLeads)
    } catch {
      showError('Erro ao carregar fila')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (proposalId: number) => {
    try {
      await proposalsApi.approve(proposalId)
      showSuccess('Proposta aprovada!')
      setItems((prev) => prev.filter((i) => i.proposal.id !== proposalId))
      if (selectedProposal?.proposal.id === proposalId) {
        setSelectedProposal(null)
      }
    } catch {
      showError('Erro ao aprovar proposta')
    }
  }

  const handleReject = async (proposalId: number) => {
    try {
      await proposalsApi.reject(proposalId)
      showSuccess('Proposta rejeitada')
      setItems((prev) => prev.filter((i) => i.proposal.id !== proposalId))
      if (selectedProposal?.proposal.id === proposalId) {
        setSelectedProposal(null)
      }
    } catch {
      showError('Erro ao rejeitar proposta')
    }
  }

  const getMessage = (proposal: Proposal): string => {
    const map = {
      formal: proposal.mensagem_formal,
      descontraida: proposal.mensagem_descontraida,
      urgencia: proposal.mensagem_urgencia,
    }
    return map[activeMessage] || ''
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
        <span className="ml-2 text-gray-500">Carregando fila...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fila de Aprovação</h1>
          <p className="text-sm text-gray-500 mt-1">Revise e aprove as propostas geradas pela IA</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={items.length > 0 ? 'warning' : 'gray'} className="text-sm px-3 py-1">
            {items.length} pendentes
          </Badge>
          <Button variant="outline" size="sm" onClick={loadQueue}>
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-24 text-center">
            <InboxIcon className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700">Fila vazia</h2>
            <p className="text-gray-400 mt-2 max-w-md mx-auto">
              Nenhuma proposta aguardando aprovação. Prospecte novos leads e gere propostas com IA!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((item) => (
            <Card key={item.proposal.id} className="flex flex-col">
              <CardContent className="p-4 flex-1">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {item.lead?.nome || `Lead #${item.proposal.lead_id}`}
                    </h3>
                    {item.lead?.categoria && (
                      <p className="text-xs text-gray-500 mt-0.5">{item.lead.categoria}</p>
                    )}
                    {item.lead?.cidade && (
                      <p className="text-xs text-gray-400">{item.lead.cidade}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 bg-purple-50 text-purple-600 px-2 py-1 rounded-full text-xs font-medium">
                    <Sparkles className="w-3 h-3" />
                    IA
                  </div>
                </div>

                {/* Argument */}
                {item.proposal.argumento_venda && (
                  <p className="text-xs text-gray-600 line-clamp-3 mb-3 p-2 bg-gray-50 rounded-lg">
                    {item.proposal.argumento_venda}
                  </p>
                )}

                {/* Pricing */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-blue-50 rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-500">Setup</p>
                    <p className="text-sm font-bold text-blue-700">
                      {formatCurrency(item.proposal.preco_sugerido)}
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-500">Mensal</p>
                    <p className="text-sm font-bold text-green-700">
                      {formatCurrency(item.proposal.mensalidade_sugerida)}
                    </p>
                  </div>
                </div>

                {/* Message preview */}
                {item.proposal.mensagem_formal && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <div className="flex items-center gap-1 mb-1">
                      <MessageCircle className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-400">Mensagem gerada</span>
                    </div>
                    <p className="text-xs text-gray-700 line-clamp-2">
                      {item.proposal.mensagem_formal}
                    </p>
                  </div>
                )}

                <p className="text-xs text-gray-400">{formatDate(item.proposal.criado_em)}</p>
              </CardContent>

              {/* Actions */}
              <div className="p-4 pt-0 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedProposal(item)}
                  className="flex-1"
                >
                  <Eye className="w-4 h-4" />
                  Revisar
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleApprove(item.proposal.id)}
                  className="flex-1"
                >
                  <CheckCircle className="w-4 h-4" />
                  Aprovar
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleReject(item.proposal.id)}
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        open={!!selectedProposal}
        onClose={() => setSelectedProposal(null)}
        title={selectedProposal?.lead?.nome || 'Revisão de Proposta'}
        size="xl"
      >
        {selectedProposal && (
          <div className="p-6 space-y-6">
            {/* Argument */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Argumento de Venda</h4>
              <div className="prose prose-sm max-w-none text-gray-700 bg-gray-50 rounded-xl p-4 text-sm leading-relaxed whitespace-pre-wrap">
                {selectedProposal.proposal.argumento_venda || 'Sem argumento gerado'}
              </div>
            </div>

            {/* Messages */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Mensagens para Envio</h4>
              <div className="flex gap-2 mb-3">
                {(['formal', 'descontraida', 'urgencia'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setActiveMessage(type)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      activeMessage === type
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {type === 'formal' ? 'Formal' : type === 'descontraida' ? 'Casual' : 'Urgência'}
                  </button>
                ))}
              </div>
              <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MessageCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">WhatsApp</span>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {getMessage(selectedProposal.proposal) || 'Mensagem não disponível'}
                </p>
              </div>
            </div>

            {/* Landing Page */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Landing Page</h4>
              <LandingPagePreview html={selectedProposal.proposal.landing_page_html} />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <Button
                variant="danger"
                onClick={() => handleReject(selectedProposal.proposal.id)}
                className="flex-1"
              >
                <XCircle className="w-4 h-4" />
                Rejeitar
              </Button>
              <Button
                variant="primary"
                onClick={() => handleApprove(selectedProposal.proposal.id)}
                className="flex-1"
              >
                <CheckCircle className="w-4 h-4" />
                Aprovar e Programar Envio
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
