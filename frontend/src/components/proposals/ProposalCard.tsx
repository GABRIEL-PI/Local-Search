import { Proposal, Lead } from '@/types'
import { Card, CardContent, CardFooter } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { CheckCircle, XCircle, Eye, Send } from 'lucide-react'
import { Link } from 'react-router-dom'

interface ProposalCardProps {
  proposal: Proposal
  lead?: Lead
  onApprove?: (id: number) => void
  onReject?: (id: number) => void
  onSend?: (proposal: Proposal) => void
}

const statusVariants: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info' | 'gray'> = {
  rascunho: 'gray',
  aprovada: 'success',
  enviada: 'info',
  recusada: 'danger',
}

const statusLabels: Record<string, string> = {
  rascunho: 'Rascunho',
  aprovada: 'Aprovada',
  enviada: 'Enviada',
  recusada: 'Recusada',
}

export default function ProposalCard({ proposal, lead, onApprove, onReject, onSend }: ProposalCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-semibold text-zinc-100">
              {lead?.nome || `Proposta #${proposal.id}`}
            </p>
            {lead?.categoria && (
              <p className="text-xs text-zinc-400">{lead.categoria}</p>
            )}
          </div>
          <Badge variant={statusVariants[proposal.status]}>
            {statusLabels[proposal.status]}
          </Badge>
        </div>

        {proposal.argumento_venda && (
          <p className="text-sm text-zinc-300 line-clamp-3 mb-3">
            {proposal.argumento_venda}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-zinc-950 rounded-lg p-3">
            <p className="text-xs text-zinc-400">Setup</p>
            <p className="font-bold text-zinc-100">{formatCurrency(proposal.preco_sugerido)}</p>
          </div>
          <div className="bg-emerald-500/10 rounded-lg p-3">
            <p className="text-xs text-zinc-400">Mensalidade</p>
            <p className="font-bold text-emerald-300">{formatCurrency(proposal.mensalidade_sugerida)}</p>
          </div>
        </div>

        <p className="text-xs text-zinc-500 mt-3">
          Criado em {formatDate(proposal.criado_em)}
        </p>
      </CardContent>

      <CardFooter className="flex gap-2 flex-wrap">
        <Link to={`/proposals/${proposal.id}`} className="flex-1">
          <Button variant="outline" size="sm" className="w-full">
            <Eye className="w-4 h-4" />
            Ver / Editar
          </Button>
        </Link>

        {proposal.status === 'rascunho' && (
          <>
            {onApprove && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onApprove(proposal.id)}
                className="flex-1"
              >
                <CheckCircle className="w-4 h-4" />
                Aprovar
              </Button>
            )}
            {onReject && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => onReject(proposal.id)}
              >
                <XCircle className="w-4 h-4" />
              </Button>
            )}
          </>
        )}

        {proposal.status === 'aprovada' && onSend && (
          <Button
            size="sm"
            onClick={() => onSend(proposal)}
            className="flex-1 bg-green-600 hover:bg-green-700 text-zinc-100"
          >
            <Send className="w-4 h-4" />
            Enviar
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
