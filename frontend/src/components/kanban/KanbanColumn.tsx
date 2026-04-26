import { Droppable } from '@hello-pangea/dnd'
import { Lead } from '@/types'
import KanbanCard from './KanbanCard'

interface KanbanColumnProps {
  columnId: string
  label: string
  colorClass: string
  leads: Lead[]
}

export default function KanbanColumn({ columnId, label, colorClass, leads }: KanbanColumnProps) {
  return (
    <div className={`flex flex-col w-72 flex-shrink-0 bg-bg rounded-xl border-t-4 ${colorClass}`}>
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-fg">{label}</h3>
          <span className="text-xs text-fg-subtle bg-surface border border-border px-2 py-0.5 rounded-full font-medium">
            {leads.length}
          </span>
        </div>
      </div>

      <Droppable droppableId={columnId}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 p-3 space-y-2 min-h-32 transition-colors ${
              snapshot.isDraggingOver ? 'bg-blue-500/10' : ''
            }`}
          >
            {leads.map((lead, index) => (
              <KanbanCard key={lead.id} lead={lead} index={index} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  )
}
