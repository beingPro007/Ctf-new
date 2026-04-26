import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { TerminalFlagInput } from '@/components/terminal-flag-input'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, Lightbulb } from 'lucide-react'

interface PageProps {
  params: Promise<{ roomId: string; taskId: string }>
}

export default async function TaskDetailPage({ params }: PageProps) {
  const { roomId, taskId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: task } = await supabase
    .from('tasks')
    .select('id, title, description, hints, points, task_index, room_id')
    .eq('id', taskId)
    .eq('room_id', roomId)
    .single()

  if (!task) notFound()

  const { data: room } = await supabase
    .from('rooms')
    .select('title, difficulty')
    .eq('id', roomId)
    .single()

  // Check if already solved
  const { data: existingSolve } = await supabase
    .from('submissions')
    .select('id')
    .eq('user_id', user.id)
    .eq('target_type', 'task')
    .eq('target_id', taskId)
    .eq('status', 'success')
    .maybeSingle()

  const alreadySolved = !!existingSolve

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[10px] font-mono text-[#444]">
        <Link href="/rooms" className="hover:text-[#00ff66] transition-colors">
          rooms
        </Link>
        <span>/</span>
        <Link href={`/rooms/${roomId}`} className="hover:text-[#00ff66] transition-colors">
          {room?.title ?? roomId}
        </Link>
        <span>/</span>
        <span className="text-[#666]">task {task.task_index + 1}</span>
      </div>

      {/* Task header */}
      <div className="border border-[#1f1f1f] bg-[#0f0f0f] p-6">
        <div className="flex items-start justify-between gap-4 mb-2">
          <h1 className="text-xl font-mono font-bold text-[#e6e6e6]">{task.title}</h1>
          <div className="flex items-center gap-2 shrink-0">
            {room && (
              <Badge variant={room.difficulty as 'easy' | 'medium' | 'hard' | 'insane'}>
                {room.difficulty}
              </Badge>
            )}
            <span className="text-xs font-mono text-[#ffa500] border border-[#ffa500]/30 px-2 py-0.5">
              {task.points} pts
            </span>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="border border-[#1f1f1f] bg-[#0f0f0f] p-6">
        <h2 className="text-[10px] font-mono text-[#444] tracking-widest mb-3">DESCRIPTION</h2>
        <div className="text-sm font-mono text-[#ccc] leading-relaxed whitespace-pre-wrap">
          {task.description}
        </div>
      </div>

      {/* Hints */}
      {task.hints && task.hints.length > 0 && (
        <details className="border border-[#1f1f1f] bg-[#0f0f0f] group">
          <summary className="flex items-center gap-2 px-4 py-3 cursor-pointer select-none text-xs font-mono text-[#444] hover:text-[#ffa500] transition-colors">
            <Lightbulb className="h-3 w-3" />
            <span>{task.hints.length} hint{task.hints.length > 1 ? 's' : ''} available</span>
          </summary>
          <div className="border-t border-[#1f1f1f] p-4 space-y-2">
            {task.hints.map((hint: string, i: number) => (
              <div key={i} className="flex gap-3 text-xs font-mono">
                <span className="text-[#ffa500] shrink-0">[{i + 1}]</span>
                <span className="text-[#888]">{hint}</span>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Flag submission */}
      <div>
        <h2 className="text-[10px] font-mono text-[#444] tracking-widest mb-3">
          SUBMIT FLAG
        </h2>
        <TerminalFlagInput
          targetType="task"
          targetId={task.id}
          alreadySolved={alreadySolved}
        />
      </div>

      {/* Navigation */}
      <div className="flex justify-start">
        <Link
          href={`/rooms/${roomId}`}
          className="flex items-center gap-1 text-xs font-mono text-[#444] hover:text-[#00ff66] transition-colors"
        >
          <ChevronLeft className="h-3 w-3" />
          Back to room
        </Link>
      </div>
    </div>
  )
}
