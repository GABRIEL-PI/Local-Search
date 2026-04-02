import { DragDropContext, DropResult } from '@hello-pangea/dnd'
import { Lead, LeadStatus } from '@/types'
import KanbanColumn from './KanbanColumn'
import { KANBAN_COLUMNS } from '@/lib/utils'

interface KanbanBoardProps {
  leads: Lead[]
  onStatusChange: (leadId: number, newStatus: LeadStatus) => Promise<void>
}

export default function KanbanBoard({ leads, onStatusChange }: KanbanBoardProps) {
  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result

    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    const leadId = parseInt(draggableId)
    const newStatus = destination.droppableId as LeadStatus

    await onStatusChange(leadId, newStatus)
  }

  const getLeadsForColumn = (columnId: string) => {
    return leads.filter((lead) => lead.status === columnId)
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((column) => (
          <KanbanColumn
            key={column.id}
            columnId={column.id}
            label={column.label}
            colorClass={column.color}
            leads={getLeadsForColumn(column.id)}
          />
        ))}
      </div>
    </DragDropContext>
  )
}
