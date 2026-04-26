import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center px-2 py-0.5 text-xs font-mono font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-[#00ff66]/10 text-[#00ff66] border border-[#00ff66]/30',
        secondary: 'bg-[#1f1f1f] text-[#888] border border-[#1f1f1f]',
        destructive: 'bg-[#ff4444]/10 text-[#ff4444] border border-[#ff4444]/30',
        outline: 'border border-[#1f1f1f] text-[#888]',
        easy: 'bg-[#00ff66]/10 text-[#00ff66] border border-[#00ff66]/30',
        medium: 'bg-[#ffa500]/10 text-[#ffa500] border border-[#ffa500]/30',
        hard: 'bg-[#ff4444]/10 text-[#ff4444] border border-[#ff4444]/30',
        insane: 'bg-[#ff00ff]/10 text-[#ff00ff] border border-[#ff00ff]/30',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
