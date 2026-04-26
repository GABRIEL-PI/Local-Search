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

export default function GeogridGridFallback({ detail, error }: { detail: GeogridDetail; error?: Error | null }) {
  const cellSize = Math.max(40, 320 / detail.grid_size)
  return (
    <div className="space-y-4">
      <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
        <p className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-1">
          Mapa visual indisponível — mostrando apenas a grade.
        </p>
        {error && (
          <details className="text-[10px] text-amber-600 dark:text-amber-400/80">
            <summary className="cursor-pointer">ver erro técnico</summary>
            <pre className="mt-2 whitespace-pre-wrap font-mono">{error.name}: {error.message}{error.stack ? '\n' + error.stack.split('\n').slice(0, 4).join('\n') : ''}</pre>
          </details>
        )}
      </div>
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
