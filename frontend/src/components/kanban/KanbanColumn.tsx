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
    <div className={`flex flex-col w-72 flex-shrink-0 bg-gray-50 rounded-xl border-t-4 ${colorClass}`}>
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">{label}</h3>
          <span className="text-xs text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded-full font-medium">
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
              snapshot.isDraggingOver ? 'bg-blue-50' : ''
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
