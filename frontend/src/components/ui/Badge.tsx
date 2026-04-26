import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'gray'
}

const variants = {
  default: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20',
  success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20',
  danger: 'bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20',
  info: 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/20',
  gray: 'bg-elevated text-fg-muted border border-border-strong',
}

export default function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variants[variant],
        className
      )}
      {...props}
    />
  )
}
