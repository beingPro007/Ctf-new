'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { submitFlag } from '@/actions/submissions'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { Terminal, CheckCircle2, XCircle, Loader2 } from 'lucide-react'

interface TerminalFlagInputProps {
  targetType: 'task' | 'challenge'
  targetId: string
  alreadySolved?: boolean
}

export function TerminalFlagInput({
  targetType,
  targetId,
  alreadySolved = false,
}: TerminalFlagInputProps) {
  const [flag, setFlag] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'failure' | 'error'>(
    alreadySolved ? 'success' : 'idle'
  )
  const [message, setMessage] = useState(alreadySolved ? 'Already solved!' : '')
  const [awardedPoints, setAwardedPoints] = useState(0)
  const router = useRouter()
  const { toast } = useToast()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!flag.trim() || status === 'loading') return

    setStatus('loading')
    setMessage('')

    const result = await submitFlag({ targetType, targetId, flag })

    setStatus(result.status)
    setMessage(result.message)
    setAwardedPoints(result.awardedPoints)

    if (result.status === 'success') {
      toast({
        title: '🚩 Flag Correct!',
        description: result.awardedPoints > 0
          ? `+${result.awardedPoints} points awarded`
          : result.message,
        variant: 'default',
      })
      router.refresh()
    } else if (result.status === 'failure') {
      toast({
        title: 'Wrong Flag',
        description: result.message,
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="border border-[#1f1f1f] bg-[#050505]">
      {/* Terminal header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#1f1f1f] bg-[#0a0a0a]">
        <div className="w-2.5 h-2.5 rounded-full bg-[#ff4444]" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#ffa500]" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#00ff66]" />
        <span className="ml-2 text-[10px] text-[#444] font-mono">flag-submission</span>
      </div>

      {/* Terminal body */}
      <div className="p-4 space-y-3">
        {status === 'success' && (
          <div className="flex items-center gap-2 text-[#00ff66] text-xs font-mono">
            <CheckCircle2 className="h-4 w-4" />
            <span>{message}</span>
            {awardedPoints > 0 && (
              <span className="ml-2 text-[#00ff66]/60">+{awardedPoints} pts</span>
            )}
          </div>
        )}

        {status === 'failure' && (
          <div className="flex items-center gap-2 text-[#ff4444] text-xs font-mono">
            <XCircle className="h-4 w-4" />
            <span>{message}</span>
          </div>
        )}

        {status === 'error' && (
          <div className="flex items-center gap-2 text-[#ffa500] text-xs font-mono">
            <Terminal className="h-4 w-4" />
            <span>{message}</span>
          </div>
        )}

        {status !== 'success' && (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-[#00ff66] text-sm font-mono shrink-0">$</span>
              <input
                type="text"
                value={flag}
                onChange={(e) => setFlag(e.target.value)}
                placeholder="CTF{your_flag_here}"
                className="flex-1 bg-transparent border-none outline-none text-[#e6e6e6] font-mono text-sm placeholder:text-[#333] caret-[#00ff66]"
                disabled={status === 'loading'}
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                size="sm"
                disabled={!flag.trim() || status === 'loading'}
                className="font-mono text-xs"
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                    Validating...
                  </>
                ) : (
                  'Submit Flag'
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
