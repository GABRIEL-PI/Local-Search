import { useState } from 'react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { Search, Filter, X } from 'lucide-react'

export interface LeadFiltersState {
  search?: string
  cidade?: string
  categoria?: string
  score_min?: number
  score_max?: number
  status?: string
}

interface LeadFiltersProps {
  onFilter: (filters: LeadFiltersState) => void
  loading?: boolean
}

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'prospectado', label: 'Prospectado' },
  { value: 'proposta_gerada', label: 'Proposta Gerada' },
  { value: 'abordado', label: 'Abordado' },
  { value: 'respondeu', label: 'Respondeu' },
  { value: 'negociando', label: 'Negociando' },
  { value: 'fechado', label: 'Fechado' },
  { value: 'perdido', label: 'Perdido' },
]

export default function LeadFilters({ onFilter, loading }: LeadFiltersProps) {
  const [filters, setFilters] = useState<LeadFiltersState>({})
  const [expanded, setExpanded] = useState(false)

  const handleChange = (key: keyof LeadFiltersState, value: string | number | undefined) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }))
  }

  const handleApply = () => {
    onFilter(filters)
  }

  const handleReset = () => {
    setFilters({})
    onFilter({})
  }

  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar por nome, email, telefone..."
            value={filters.search || ''}
            onChange={(e) => handleChange('search', e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
            className="pl-9 pr-4 py-2 text-sm border border-zinc-700 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setExpanded(!expanded)}
        >
          <Filter className="w-4 h-4" />
          Filtros
        </Button>
        <Button size="sm" onClick={handleApply} loading={loading}>
          Buscar
        </Button>
        {Object.keys(filters).some(k => filters[k as keyof LeadFiltersState]) && (
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {expanded && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-zinc-800">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Cidade</label>
            <input
              type="text"
              placeholder="Ex: São Paulo"
              value={filters.cidade || ''}
              onChange={(e) => handleChange('cidade', e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Categoria</label>
            <input
              type="text"
              placeholder="Ex: Restaurante"
              value={filters.categoria || ''}
              onChange={(e) => handleChange('categoria', e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Score mínimo</label>
            <input
              type="number"
              placeholder="0"
              min="0"
              max="100"
              value={filters.score_min || ''}
              onChange={(e) => handleChange('score_min', Number(e.target.value))}
              className="w-full px-3 py-1.5 text-sm border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Status</label>
            <select
              value={filters.status || ''}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  )
}
