import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap text-sm font-mono font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#00ff66] disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-[#00ff66] text-black hover:bg-[#00cc52] border border-[#00ff66]',
        destructive:
          'bg-transparent text-[#ff4444] border border-[#ff4444] hover:bg-[#ff4444] hover:text-black',
        outline:
          'bg-transparent border border-[#1f1f1f] text-[#e6e6e6] hover:border-[#00ff66] hover:text-[#00ff66]',
        secondary:
          'bg-[#0f0f0f] text-[#e6e6e6] border border-[#1f1f1f] hover:border-[#333]',
        ghost: 'hover:bg-[#0f0f0f] hover:text-[#00ff66]',
        link: 'text-[#00ff66] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-7 px-3 text-xs',
        lg: 'h-11 px-8',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
