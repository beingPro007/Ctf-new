import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-9 w-full bg-[#0a0a0a] border border-[#1f1f1f] px-3 py-2 text-sm font-mono text-[#e6e6e6] placeholder:text-[#444] focus:outline-none focus:border-[#00ff66] focus:ring-1 focus:ring-[#00ff66] disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
