import { useState, useEffect, useCallback } from 'react'
import { leadsApi } from '@/lib/api'
import { Lead, LeadStatus } from '@/types'
import KanbanBoard from '@/components/kanban/KanbanBoard'
import LeadFilters from '@/components/leads/LeadFilters'
import { useUIStore } from '@/stores/uiStore'
import { RefreshCw, Kanban } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function CRM() {
  const { showSuccess, showError } = useUIStore()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<Record<string, unknown>>({})

  const loadLeads = useCallback(async (filterParams = {}) => {
    setLoading(true)
    try {
      const res = await leadsApi.list({ limit: 200, ...filterParams })
      setLeads(res.data.items)
    } catch {
      showError('Erro ao carregar leads')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadLeads()
  }, [loadLeads])

  const handleFilter = (newFilters: Record<string, unknown>) => {
    setFilters(newFilters)
    loadLeads(newFilters)
  }

  const handleStatusChange = async (leadId: number, newStatus: LeadStatus) => {
    // Optimistic update
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
    )

    try {
      await leadsApi.updateStatus(leadId, newStatus)
      showSuccess('Status atualizado')
    } catch {
      // Revert on error
      loadLeads(filters)
      showError('Erro ao atualizar status')
    }
  }

  const totalByStatus = leads.reduce<Record<string, number>>((acc, lead) => {
    acc[lead.status] = (acc[lead.status] || 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CRM Kanban</h1>
          <p className="text-sm text-gray-500 mt-1">
            {leads.length} leads · Arraste para mover entre colunas
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => loadLeads(filters)}
          loading={loading}
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </Button>
      </div>

      <LeadFilters onFilter={handleFilter} loading={loading} />

      {loading && leads.length === 0 ? (
        <div className="flex items-center justify-center py-24">
          <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
          <span className="ml-2 text-gray-500">Carregando leads...</span>
        </div>
      ) : leads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Kanban className="w-16 h-16 text-gray-200 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Nenhum lead encontrado</h2>
          <p className="text-gray-400 mt-2">Ajuste os filtros ou inicie uma nova prospecção</p>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-6 px-6">
          <KanbanBoard leads={leads} onStatusChange={handleStatusChange} />
        </div>
      )}
    </div>
  )
}
