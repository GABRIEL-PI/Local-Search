import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { leadsApi, proposalsApi } from '@/lib/api'
import { Lead, Nota, Proposal } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import LeadScore from '@/components/leads/LeadScore'
import { useUIStore } from '@/stores/uiStore'
import {
  ArrowLeft, Globe, Phone, Mail, MapPin, Star,
  FileText, MessageCircle, Plus, Clock, CheckCircle,
  Sparkles, RefreshCw, Camera, Wifi, WifiOff
} from 'lucide-react'
import { STATUS_LABELS, STATUS_COLORS, formatDate, formatCurrency, cn } from '@/lib/utils'

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showSuccess, showError } = useUIStore()

  const [lead, setLead] = useState<Lead | null>(null)
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [noteText, setNoteText] = useState('')
  const [addingNote, setAddingNote] = useState(false)
  const [generatingProposal, setGeneratingProposal] = useState(false)
  const [activeTab, setActiveTab] = useState<'info' | 'proposals' | 'notes'>('info')

  useEffect(() => {
    if (!id) return
    loadLead()
  }, [id])

  const loadLead = async () => {
    setLoading(true)
    try {
      const res = await leadsApi.get(Number(id))
      setLead(res.data)
    } catch {
      showError('Lead não encontrado')
      navigate('/crm')
    } finally {
      setLoading(false)
    }
  }

  const handleAddNote = async () => {
    if (!noteText.trim() || !id) return
    setAddingNote(true)
    try {
      await leadsApi.addNote(Number(id), noteText)
      setNoteText('')
      showSuccess('Nota adicionada')
      loadLead()
    } catch {
      showError('Erro ao adicionar nota')
    } finally {
      setAddingNote(false)
    }
  }

  const handleGenerateProposal = async () => {
    if (!id) return
    setGeneratingProposal(true)
    try {
      const res = await proposalsApi.generate(Number(id))
      showSuccess('Proposta em geração!', 'Você será notificado quando estiver pronta')
    } catch {
      showError('Erro ao gerar proposta')
    } finally {
      setGeneratingProposal(false)
    }
  }

  const handleStatusChange = async (status: string) => {
    if (!id) return
    try {
      await leadsApi.updateStatus(Number(id), status)
      showSuccess('Status atualizado')
      loadLead()
    } catch {
      showError('Erro ao atualizar status')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
      </div>
    )
  }

  if (!lead) return null

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link to="/crm">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{lead.nome}</h1>
              {lead.categoria && (
                <p className="text-gray-500 mt-0.5">{lead.categoria}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <LeadScore score={lead.lead_score} size="lg" />
              <select
                value={lead.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(STATUS_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={handleGenerateProposal} loading={generatingProposal}>
          <Sparkles className="w-4 h-4" />
          Gerar Proposta IA
        </Button>
        {lead.whatsapp && (
          <a
            href={`https://wa.me/${lead.whatsapp.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100">
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </Button>
          </a>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-1">
          {(['info', 'proposals', 'notes'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              {tab === 'info' ? 'Informações' : tab === 'proposals' ? 'Propostas' : 'Notas'}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'info' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Contact */}
          <Card>
            <CardHeader><CardTitle>Contato</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {lead.telefone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">{lead.telefone}</span>
                </div>
              )}
              {lead.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">{lead.email}</span>
                </div>
              )}
              {lead.endereco && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">{lead.endereco}</span>
                </div>
              )}
              {lead.horario && (
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">{lead.horario}</span>
                </div>
              )}
              {lead.rating && (
                <div className="flex items-center gap-3">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm">{lead.rating} ({lead.reviews_count} avaliações)</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Digital Presence */}
          <Card>
            <CardHeader><CardTitle>Presença Digital</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">Site</span>
                </div>
                {lead.tem_site ? (
                  <div>
                    <Badge variant="success">Possui site</Badge>
                    {lead.url_site && (
                      <a href={lead.url_site} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline block mt-0.5">
                        {lead.url_site}
                      </a>
                    )}
                  </div>
                ) : (
                  <Badge variant="danger">Sem site</Badge>
                )}
              </div>

              {lead.tem_site && (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wifi className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">SSL</span>
                    </div>
                    <Badge variant={lead.ssl_valido ? 'success' : 'danger'}>
                      {lead.ssl_valido ? 'Válido' : 'Inválido'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Mobile Friendly</span>
                    <Badge variant={lead.mobile_friendly ? 'success' : 'danger'}>
                      {lead.mobile_friendly ? 'Sim' : 'Não'}
                    </Badge>
                  </div>
                  {lead.site_score !== null && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Score do Site</span>
                      <span className="font-bold text-sm">{lead.site_score}/100</span>
                    </div>
                  )}
                </>
              )}

              {lead.dominio_disponivel && lead.dominio_sugerido && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-700 font-medium">Domínio disponível:</p>
                  <p className="text-sm font-bold text-blue-900">{lead.dominio_sugerido}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'proposals' && (
        <div className="space-y-3">
          <Button onClick={handleGenerateProposal} loading={generatingProposal}>
            <Sparkles className="w-4 h-4" />
            Nova Proposta IA
          </Button>

          {!lead.propostas || lead.propostas.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500">Nenhuma proposta gerada ainda</p>
              </CardContent>
            </Card>
          ) : (
            lead.propostas.map((p: Proposal) => (
              <Card key={p.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium',
                        p.status === 'aprovada' ? 'bg-green-100 text-green-700' :
                        p.status === 'recusada' ? 'bg-red-100 text-red-700' :
                        p.status === 'enviada' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      )}>
                        {p.status}
                      </span>
                      <span className="text-xs text-gray-400">{formatDate(p.criado_em)}</span>
                    </div>
                    <p className="text-sm mt-1">
                      Setup: <strong>{formatCurrency(p.preco_sugerido)}</strong> |
                      Mensal: <strong>{formatCurrency(p.mensalidade_sugerida)}</strong>
                    </p>
                  </div>
                  <Link to={`/proposals/${p.id}`}>
                    <Button variant="outline" size="sm">Ver</Button>
                  </Link>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'notes' && (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Adicionar uma nota..."
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <div className="flex justify-end mt-2">
                <Button
                  size="sm"
                  onClick={handleAddNote}
                  loading={addingNote}
                  disabled={!noteText.trim()}
                >
                  <Plus className="w-4 h-4" />
                  Adicionar
                </Button>
              </div>
            </CardContent>
          </Card>

          {lead.notas && lead.notas.length > 0 ? (
            lead.notas.map((nota: Nota) => (
              <Card key={nota.id}>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{nota.conteudo}</p>
                  <p className="text-xs text-gray-400 mt-2">{formatDate(nota.criado_em)}</p>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8 text-gray-400">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Nenhuma nota ainda</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
