import { cn } from '@/lib/utils'
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'

type StatusType = 'info' | 'success' | 'warning' | 'error'

interface StatusBannerProps {
  type: StatusType
  message: string
  className?: string
}

const icons = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
}

const styles = {
  info: 'border-[#39a0ff]/30 bg-[#39a0ff]/5 text-[#39a0ff]',
  success: 'border-[#00ff66]/30 bg-[#00ff66]/5 text-[#00ff66]',
  warning: 'border-[#ffa500]/30 bg-[#ffa500]/5 text-[#ffa500]',
  error: 'border-[#ff4444]/30 bg-[#ff4444]/5 text-[#ff4444]',
}

export function StatusBanner({ type, message, className }: StatusBannerProps) {
  const Icon = icons[type]
  return (
    <div
      className={cn(
        'flex items-center gap-3 border px-4 py-3 text-xs font-mono',
        styles[type],
        className
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  )
}
