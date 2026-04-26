import { Draggable } from '@hello-pangea/dnd'
import { Lead } from '@/types'
import { MapPin, Phone, Star, Globe } from 'lucide-react'
import LeadScore from '@/components/leads/LeadScore'
import { Link } from 'react-router-dom'

interface KanbanCardProps {
  lead: Lead
  index: number
}

export default function KanbanCard({ lead, index }: KanbanCardProps) {
  return (
    <Draggable draggableId={String(lead.id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-zinc-900 rounded-lg border p-3 cursor-grab active:cursor-grabbing transition-shadow ${
            snapshot.isDragging ? 'shadow-lg rotate-1 border-blue-500/30' : 'shadow-sm border-zinc-800 hover:shadow-md'
          }`}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <Link
              to={`/app/leads/${lead.id}`}
              onClick={(e) => snapshot.isDragging && e.preventDefault()}
              className="text-sm font-medium text-zinc-100 hover:text-blue-400 line-clamp-2 leading-tight"
            >
              {lead.nome}
            </Link>
            <LeadScore score={lead.lead_score} size="sm" showLabel={false} />
          </div>

          {lead.categoria && (
            <p className="text-xs text-zinc-400 mb-2">{lead.categoria}</p>
          )}

          <div className="space-y-1">
            {lead.cidade && (
              <div className="flex items-center gap-1 text-xs text-zinc-500">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{lead.cidade}</span>
              </div>
            )}
            {lead.rating && (
              <div className="flex items-center gap-1 text-xs text-zinc-500">
                <Star className="w-3 h-3 text-yellow-400" />
                <span>{lead.rating}</span>
              </div>
            )}
          </div>

          {!lead.tem_site && (
            <div className="mt-2 flex items-center gap-1 text-xs text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full w-fit">
              <Globe className="w-3 h-3" />
              Sem site
            </div>
          )}
        </div>
      )}
    </Draggable>
  )
}
