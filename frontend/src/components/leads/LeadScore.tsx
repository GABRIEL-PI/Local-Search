import { cn, getScoreBg } from '@/lib/utils'

interface LeadScoreProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export default function LeadScore({ score, size = 'md', showLabel = true }: LeadScoreProps) {
  const label = score >= 80 ? 'Quente' : score >= 60 ? 'Morno' : score >= 40 ? 'Frio' : 'Gelado'

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  }

  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          'font-bold rounded-full',
          getScoreBg(score),
          sizeClasses[size]
        )}
      >
        {score}
      </span>
      {showLabel && (
        <span className="text-xs text-zinc-400">{label}</span>
      )}
    </div>
  )
}
