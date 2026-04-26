import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { LabStatusBanner } from '@/components/lab-status-banner'
import { cn } from '@/lib/utils'
import { CheckCircle2, Lock, ArrowRight, ChevronLeft } from 'lucide-react'

interface PageProps {
  params: Promise<{ roomId: string }>
}

export default async function RoomDetailPage({ params }: PageProps) {
  const { roomId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: room } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', roomId)
    .single()

  if (!room) notFound()

  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title, description, points, task_index, hints, attachment_paths')
    .eq('room_id', roomId)
    .order('task_index')

  const { data: progress } = await supabase
    .from('user_progress')
    .select('task_id, status')
    .eq('user_id', user.id)
    .eq('room_id', roomId)

  const progressMap: Record<string, string> = {}
    ; (progress as any)?.forEach((p: any) => { progressMap[p.task_id] = p.status })

  const solvedCount = (progress as any)?.filter((p: any) => p.status === 'solved').length ?? 0
  const totalCount = tasks?.length ?? 0

  const hasMachines = (tasks as any)?.some((t: any) => (t.attachment_paths?.length ?? 0) > 0) ?? false

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Breadcrumb */}
      <Link
        href="/rooms"
        className="flex items-center gap-1 text-xs text-[#444] font-mono hover:text-[#00ff66] transition-colors"
      >
        <ChevronLeft className="h-3 w-3" />
        Back to Rooms
      </Link>

      {/* Room header */}
      <div className="border border-[#1f1f1f] bg-[#0f0f0f] p-6">
        <div className="flex items-start justify-between gap-4 mb-3">
          <h1 className="text-xl font-mono font-bold text-[#e6e6e6]">{(room as any).title}</h1>
          <Badge variant={(room as any).difficulty as 'easy' | 'medium' | 'hard' | 'insane'}>
            {(room as any).difficulty}
          </Badge>
        </div>
        <p className="text-sm text-[#666] font-mono mb-4">{(room as any).description}</p>
        <div className="flex items-center gap-4">
          <span className="text-xs text-[#444] font-mono">
            Progress: <span className="text-[#00ff66]">{solvedCount}/{totalCount}</span>
          </span>
          <div className="flex-1 h-1 bg-[#1f1f1f] max-w-xs">
            <div
              className="h-full bg-[#00ff66]/50 transition-all"
              style={{ width: totalCount > 0 ? `${(solvedCount / totalCount) * 100}%` : '0%' }}
            />
          </div>
        </div>
      </div>

      {/* Lab Banner */}
      <LabStatusBanner hasMachines={hasMachines} />

      {/* Task list */}
      <div className="space-y-2">
        <h2 className="text-xs font-mono text-[#444] tracking-widest px-1 uppercase mb-3">Tasks</h2>
        {!tasks || tasks.length === 0 ? (
          <div className="border border-[#1f1f1f] p-8 text-center">
            <p className="text-xs text-[#444] font-mono">No tasks in this room yet</p>
          </div>
        ) : (
          tasks.map((task, index) => {
            const taskProgress = progressMap[(task as any).id]
            const isSolved = taskProgress === 'solved'
            const isUnlocked = taskProgress === 'unlocked' || isSolved
            const isAccessible = index === 0 || isUnlocked

            return (
              <div
                key={(task as any).id}
                className={cn(
                  'border transition-all',
                  isSolved
                    ? 'border-[#00ff66]/20 bg-[#00ff66]/5'
                    : isAccessible
                      ? 'border-[#1f1f1f] bg-[#0f0f0f] hover:border-[#333]'
                      : 'border-[#0f0f0f] bg-[#070707] opacity-50'
                )}
              >
                <div className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[10px] text-[#444] font-mono shrink-0 w-6">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    {isSolved ? (
                      <CheckCircle2 className="h-4 w-4 text-[#00ff66] shrink-0" />
                    ) : !isAccessible ? (
                      <Lock className="h-4 w-4 text-[#333] shrink-0" />
                    ) : (
                      <div className="h-4 w-4 border border-[#333] shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p
                        className={cn(
                          'text-sm font-mono truncate',
                          isSolved
                            ? 'text-[#00ff66]'
                            : isAccessible
                              ? 'text-[#e6e6e6]'
                              : 'text-[#333]'
                        )}
                      >
                        {(task as any).title}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] font-mono">
                        <span className="text-[#555]">{(task as any).points} PTS</span>
                        {(task as any).hints?.length > 0 && (
                          <span className="text-[#333]">• {(task as any).hints.length} hints</span>
                        )}
                        {((task as any).attachment_paths?.length ?? 0) > 0 && (
                          <span className="text-[#00ff66] uppercase font-bold text-[9px] border border-[#00ff66]/30 px-1 ml-1 tracking-tighter">Lab Ready</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {isAccessible && (
                    <Link
                      href={`/rooms/${roomId}/tasks/${(task as any).id}`}
                      className="flex items-center gap-1 text-xs font-mono text-[#444] hover:text-[#00ff66] transition-colors shrink-0"
                    >
                      {isSolved ? 'Review' : 'Deploy & Attack'}
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
