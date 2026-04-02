import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {}

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn('bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/[0.06] shadow-lg shadow-black/10', className)}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: CardProps) {
  return <div className={cn('p-6 border-b border-white/[0.06]', className)} {...props} />
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-lg font-semibold text-gray-100', className)} {...props} />
}

export function CardContent({ className, ...props }: CardProps) {
  return <div className={cn('p-6', className)} {...props} />
}

export function CardFooter({ className, ...props }: CardProps) {
  return <div className={cn('px-6 py-4 border-t border-white/[0.06]', className)} {...props} />
}
