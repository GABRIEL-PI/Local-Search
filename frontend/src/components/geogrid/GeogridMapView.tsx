import { useMemo } from 'react'
import { MapContainer, TileLayer, CircleMarker, Marker, Tooltip as LeafletTooltip } from 'react-leaflet'
import L from 'leaflet'
import { GeogridDetail } from '@/types'

const leadIcon = L.divIcon({
  html: `<div style="background:#3b82f6;width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 1px #3b82f6;"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  className: '',
})

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

export default function GeogridMapView({ detail }: { detail: GeogridDetail }) {
  const center: [number, number] = [detail.center_lat, detail.center_lng]

  const cellSize = useMemo(() => Math.max(28, 200 / detail.grid_size), [detail.grid_size])

  return (
    <div className="space-y-4">
      <div style={{ height: 384 }} className="rounded-lg overflow-hidden border border-border">
        <MapContainer
          key={detail.id}
          center={center}
          zoom={14}
          scrollWheelZoom
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='© OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {detail.points.map((p) => (
            <CircleMarker
              key={p.id}
              center={[p.lat, p.lng]}
              radius={18}
              pathOptions={{
                color: rankColor(p.rank),
                fillColor: rankColor(p.rank),
                fillOpacity: p.status === 'concluido' ? 0.65 : 0.25,
                weight: 2,
              }}
            >
              <LeafletTooltip permanent direction="center" className="rank-tooltip">
                <span style={{ color: 'white', fontWeight: 700, fontSize: 12 }}>
                  {p.status === 'rodando' ? '…' : p.status === 'erro' ? '!' : rankLabel(p.rank)}
                </span>
              </LeafletTooltip>
              <LeafletTooltip>
                {p.status === 'concluido'
                  ? p.rank
                    ? `Posição ${p.rank}`
                    : 'Não rankeado (top 21)'
                  : p.status}
              </LeafletTooltip>
            </CircleMarker>
          ))}
          <Marker position={center} icon={leadIcon}>
            <LeafletTooltip permanent direction="top" offset={[0, -10]}>
              <strong>{detail.lead_nome}</strong>
            </LeafletTooltip>
          </Marker>
        </MapContainer>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs text-fg-subtle">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full" style={{ background: '#10b981' }} /> 1-3</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full" style={{ background: '#f59e0b' }} /> 4-10</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full" style={{ background: '#fb923c' }} /> 11-20</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full" style={{ background: '#ef4444' }} /> 21+</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full" style={{ background: '#71717a' }} /> não rankeado</span>
      </div>

      <div>
        <p className="text-xs text-fg-faint mb-2">Visão em grade ({detail.grid_size}×{detail.grid_size}):</p>
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
    </div>
  )
}
