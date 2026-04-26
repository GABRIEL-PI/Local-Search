import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { proposalsApi, leadsApi } from '@/lib/api'
import { Proposal, Lead } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import LandingPagePreview from '@/components/proposals/LandingPagePreview'
import { useUIStore } from '@/stores/uiStore'
import { ArrowLeft, Save, CheckCircle, XCircle, Send, RefreshCw } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function ProposalBuilder() {
  const { id } = useParams<{ id: string }>()
  const { showSuccess, showError } = useUIStore()

  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [edits, setEdits] = useState<Partial<Proposal>>({})

  useEffect(() => {
    if (!id) return
    loadProposal()
  }, [id])

  const loadProposal = async () => {
    setLoading(true)
    try {
      const res = await proposalsApi.get(Number(id))
      setProposal(res.data)
      setEdits(res.data)

      const leadRes = await leadsApi.get(res.data.lead_id)
      setLead(leadRes.data)
    } catch {
      showError('Proposta não encontrada')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!id) return
    setSaving(true)
    try {
      const res = await proposalsApi.update(Number(id), {
        argumento_venda: edits.argumento_venda,
        mensagem_formal: edits.mensagem_formal,
        mensagem_descontraida: edits.mensagem_descontraida,
        mensagem_urgencia: edits.mensagem_urgencia,
        landing_page_html: edits.landing_page_html,
        preco_sugerido: edits.preco_sugerido,
        mensalidade_sugerida: edits.mensalidade_sugerida,
      })
      setProposal(res.data)
      showSuccess('Proposta salva!')
    } catch {
      showError('Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const handleApprove = async () => {
    if (!id) return
    try {
      await proposalsApi.approve(Number(id))
      showSuccess('Proposta aprovada!')
      loadProposal()
    } catch {
      showError('Erro ao aprovar')
    }
  }

  const handleReject = async () => {
    if (!id) return
    try {
      await proposalsApi.reject(Number(id))
      showSuccess('Proposta rejeitada')
      loadProposal()
    } catch {
      showError('Erro ao rejeitar')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <RefreshCw className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-spin" />
      </div>
    )
  }

  if (!proposal) return null

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link to={lead ? `/leads/${lead.id}` : '/queue'}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-fg">
              {lead?.nome || `Proposta #${proposal.id}`}
            </h1>
            <p className="text-sm text-fg-subtle">
              Criada em {formatDate(proposal.criado_em)} · Status: <strong>{proposal.status}</strong>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleSave} loading={saving}>
            <Save className="w-4 h-4" />
            Salvar
          </Button>
          {proposal.status === 'rascunho' && (
            <>
              <Button variant="primary" size="sm" onClick={handleApprove}>
                <CheckCircle className="w-4 h-4" />
                Aprovar
              </Button>
              <Button variant="danger" size="sm" onClick={handleReject}>
                <XCircle className="w-4 h-4" />
                Rejeitar
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Pricing */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-fg-subtle mb-1">Valor de Setup</p>
            <input
              type="number"
              value={edits.preco_sugerido || ''}
              onChange={(e) => setEdits({ ...edits, preco_sugerido: Number(e.target.value) })}
              className="w-full text-2xl font-bold text-fg border-b border-border focus:outline-none focus:border-blue-500 pb-1"
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-fg-subtle mb-1">Mensalidade</p>
            <input
              type="number"
              value={edits.mensalidade_sugerida || ''}
              onChange={(e) => setEdits({ ...edits, mensalidade_sugerida: Number(e.target.value) })}
              className="w-full text-2xl font-bold text-emerald-600 dark:text-emerald-400 border-b border-border focus:outline-none focus:border-blue-500 pb-1"
            />
          </CardContent>
        </Card>
      </div>

      {/* Argument */}
      <Card>
        <CardHeader><CardTitle>Argumento de Venda</CardTitle></CardHeader>
        <CardContent>
          <textarea
            value={edits.argumento_venda || ''}
            onChange={(e) => setEdits({ ...edits, argumento_venda: e.target.value })}
            rows={6}
            className="w-full px-3 py-2 text-sm border border-border-strong rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Argumento de venda personalizado..."
          />
        </CardContent>
      </Card>

      {/* Messages */}
      <Card>
        <CardHeader><CardTitle>Mensagens para Envio</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: 'mensagem_formal', label: 'Mensagem Formal', placeholder: 'Olá! Somos especialistas...' },
            { key: 'mensagem_descontraida', label: 'Mensagem Casual', placeholder: 'Oi! Vi que vocês...' },
            { key: 'mensagem_urgencia', label: 'Mensagem de Urgência', placeholder: 'Última chance...' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-fg mb-1">{label}</label>
              <textarea
                value={(edits as Record<string, unknown>)[key] as string || ''}
                onChange={(e) => setEdits({ ...edits, [key]: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-border-strong rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder={placeholder}
              />
              <p className="text-xs text-fg-faint mt-0.5">
                {((edits as Record<string, unknown>)[key] as string || '').length} caracteres
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Landing Page */}
      <Card>
        <CardHeader><CardTitle>Landing Page</CardTitle></CardHeader>
        <CardContent>
          <LandingPagePreview
            html={edits.landing_page_html || null}
            onEditHtml={(html) => setEdits({ ...edits, landing_page_html: html })}
          />
        </CardContent>
      </Card>
    </div>
  )
}
