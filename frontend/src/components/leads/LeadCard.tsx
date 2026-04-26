import { Lead } from '@/types'
import { Card, CardContent } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import LeadScore from './LeadScore'
import { MapPin, Phone, Globe, Star, MessageCircle } from 'lucide-react'
import { STATUS_LABELS, STATUS_COLORS, cn } from '@/lib/utils'
import { Link } from 'react-router-dom'

interface LeadCardProps {
  lead: Lead
  onGenerateProposal?: (lead: Lead) => void
}

export default function LeadCard({ lead, onGenerateProposal }: LeadCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <Link
              to={`/leads/${lead.id}`}
              className="text-sm font-semibold text-fg hover:text-blue-600 dark:text-blue-400 transition-colors line-clamp-1"
            >
              {lead.nome}
            </Link>
            {lead.categoria && (
              <p className="text-xs text-fg-subtle mt-0.5">{lead.categoria}</p>
            )}
          </div>
          <LeadScore score={lead.lead_score} size="sm" showLabel={false} />
        </div>

        <div className="space-y-1.5 mb-3">
          {lead.cidade && (
            <div className="flex items-center gap-1.5 text-xs text-fg-subtle">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{lead.cidade}{lead.estado ? `, ${lead.estado}` : ''}</span>
            </div>
          )}
          {(lead.telefone || lead.whatsapp) && (
            <div className="flex items-center gap-1.5 text-xs text-fg-subtle">
              <Phone className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{lead.whatsapp || lead.telefone}</span>
            </div>
          )}
          {lead.rating && (
            <div className="flex items-center gap-1.5 text-xs text-fg-subtle">
              <Star className="w-3.5 h-3.5 flex-shrink-0 text-yellow-400" />
              <span>{lead.rating} ({lead.reviews_count} avaliações)</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {!lead.tem_site && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500/10 text-red-600 dark:text-red-400 text-xs rounded-full font-medium">
              <Globe className="w-3 h-3" />
              Sem site
            </span>
          )}
          {lead.whatsapp && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs rounded-full font-medium">
              <MessageCircle className="w-3 h-3" />
              WhatsApp
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', STATUS_COLORS[lead.status])}>
            {STATUS_LABELS[lead.status]}
          </span>
          {lead.status === 'prospectado' && onGenerateProposal && (
            <button
              onClick={() => onGenerateProposal(lead)}
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-200 font-medium"
            >
              Gerar Proposta
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
