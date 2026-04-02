import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr))
}

export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '-'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-yellow-600'
  if (score >= 40) return 'text-orange-500'
  return 'text-red-500'
}

export function getScoreBg(score: number): string {
  if (score >= 80) return 'bg-green-100 text-green-800'
  if (score >= 60) return 'bg-yellow-100 text-yellow-800'
  if (score >= 40) return 'bg-orange-100 text-orange-800'
  return 'bg-red-100 text-red-800'
}

export const STATUS_LABELS: Record<string, string> = {
  prospectado: 'Prospectado',
  proposta_gerada: 'Proposta Gerada',
  abordado: 'Abordado',
  respondeu: 'Respondeu',
  negociando: 'Negociando',
  fechado: 'Fechado',
  perdido: 'Perdido',
}

export const STATUS_COLORS: Record<string, string> = {
  prospectado: 'bg-gray-500/15 text-gray-400',
  proposta_gerada: 'bg-blue-500/15 text-blue-400',
  abordado: 'bg-purple-500/15 text-purple-400',
  respondeu: 'bg-yellow-500/15 text-yellow-400',
  negociando: 'bg-orange-500/15 text-orange-400',
  fechado: 'bg-green-500/15 text-green-400',
  perdido: 'bg-red-500/15 text-red-400',
}

export const KANBAN_COLUMNS = [
  { id: 'prospectado', label: 'Prospectados', color: 'border-gray-500/50' },
  { id: 'proposta_gerada', label: 'Proposta Gerada', color: 'border-blue-500/50' },
  { id: 'abordado', label: 'Abordados', color: 'border-purple-500/50' },
  { id: 'respondeu', label: 'Responderam', color: 'border-yellow-500/50' },
  { id: 'negociando', label: 'Negociando', color: 'border-orange-500/50' },
  { id: 'fechado', label: 'Fechados', color: 'border-green-500/50' },
  { id: 'perdido', label: 'Perdidos', color: 'border-red-500/50' },
]
