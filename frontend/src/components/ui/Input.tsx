import { forwardRef, InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-zinc-300">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-3 py-2 text-sm border rounded-lg bg-zinc-950 text-zinc-100 placeholder:text-zinc-500 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500',
            error
              ? 'border-red-500/50 bg-red-500/5 focus:ring-red-500 focus:border-red-500'
              : 'border-zinc-800 hover:border-zinc-700',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        {helperText && !error && <p className="text-xs text-zinc-500">{helperText}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
export default Input
