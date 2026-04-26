import { GeogridDetail } from '@/types'

function rankColor(rank: number | null): string {
  if (rank === null) return '#71717a'
  if (rank <= 3) return '#10b981'
  if (rank <= 10) return '#f59e0b'
  if (rank <= 20) return '#fb923c'
  return '#ef4444'
}

function rankLabel(rank: number | null): string {
  if (rank === null) return '—'
  return String(rank)
}

export default function GeogridGridFallback({ detail }: { detail: GeogridDetail }) {
  const cellSize = Math.max(40, 320 / detail.grid_size)
  return (
    <div className="space-y-4">
      <p className="text-xs text-amber-600 dark:text-amber-400">
        Mapa visual indisponível — mostrando apenas a grade.
      </p>
      <div
        className="inline-grid gap-1 p-2 bg-elevated rounded-lg"
        style={{ gridTemplateColumns: `repeat(${detail.grid_size}, ${cellSize}px)` }}
      >
        {Array.from({ length: detail.grid_size * detail.grid_size }).map((_, i) => {
          const p = detail.points.find((pt) => pt.idx === i)
          return (
            <div
              key={i}
              className="rounded flex items-center justify-center text-xs font-bold"
              style={{
                width: cellSize,
                height: cellSize,
                background: p ? rankColor(p.rank) : '#71717a',
                color: 'white',
                opacity: p?.status === 'concluido' ? 1 : 0.4,
              }}
              title={p ? (p.rank ? `pos ${p.rank}` : p.status) : ''}
            >
              {p ? (p.status === 'rodando' ? '…' : p.status === 'erro' ? '!' : rankLabel(p.rank)) : '?'}
            </div>
          )
        })}
      </div>
    </div>
  )
}
