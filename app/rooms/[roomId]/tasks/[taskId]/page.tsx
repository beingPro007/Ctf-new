import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { TerminalFlagInput } from '@/components/terminal-flag-input'
import { LabAccess } from '@/components/lab-access'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, Lightbulb, Server } from 'lucide-react'
import type { Task, Room } from '@/types/db'

interface PageProps {
  params: Promise<{ roomId: string; taskId: string }>
}

type TaskWithAttachments = Task & { attachment_paths: string[] }
type RoomInfo = Pick<Room, 'title' | 'difficulty'>

export default async function TaskDetailPage({ params }: PageProps) {
  const { roomId, taskId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: rawTask } = await supabase
    .from('tasks')
    .select('id, title, description, hints, points, task_index, room_id, attachment_paths')
    .eq('id', taskId)
    .eq('room_id', roomId)
    .single()

  if (!rawTask) notFound()

  // Cast once to avoid Supabase PostgrestVersion "12" generic mismatch
  const t = rawTask as unknown as TaskWithAttachments

  const { data: rawRoom } = await supabase
    .from('rooms')
    .select('title, difficulty')
    .eq('id', roomId)
    .single()

  const r = rawRoom as unknown as RoomInfo | null

  const { data: existingSolve } = await supabase
    .from('submissions')
    .select('id')
    .eq('user_id', user.id)
    .eq('target_type', 'task')
    .eq('target_id', taskId)
    .eq('status', 'success')
    .maybeSingle()

  const alreadySolved = !!existingSolve
  const connections = t.attachment_paths ?? []

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[10px] font-mono text-[#444]">
          <Link href="/rooms" className="hover:text-[#00ff66] transition-colors">rooms</Link>
          <span>/</span>
          <Link href={`/rooms/${roomId}`} className="hover:text-[#00ff66] transition-colors">
            {r?.title ?? roomId}
          </Link>
          <span>/</span>
          <span className="text-[#666]">task {t.task_index + 1}</span>
        </div>

        {/* Task header */}
        <div className="border border-[#1f1f1f] bg-[#0f0f0f] p-6">
          <div className="flex items-start justify-between gap-4 mb-2">
            <h1 className="text-xl font-mono font-bold text-[#e6e6e6]">{t.title}</h1>
            <div className="flex items-center gap-2 shrink-0">
              {r && (
                <Badge variant={r.difficulty as 'easy' | 'medium' | 'hard' | 'insane'}>
                  {r.difficulty}
                </Badge>
              )}
              <span className="text-xs font-mono text-[#ffa500] border border-[#ffa500]/30 px-2 py-0.5">
                {t.points} pts
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="border border-[#1f1f1f] bg-[#0f0f0f] p-6">
          <h2 className="text-[10px] font-mono text-[#444] tracking-widest mb-3 uppercase">Description</h2>
          <div className="text-sm font-mono text-[#ccc] leading-relaxed whitespace-pre-wrap">
            {t.description}
          </div>
        </div>

        {/* Hints */}
        {t.hints && t.hints.length > 0 && (
          <details className="border border-[#1f1f1f] bg-[#0f0f0f] group">
            <summary className="flex items-center gap-2 px-4 py-3 cursor-pointer select-none text-xs font-mono text-[#444] hover:text-[#ffa500] transition-colors">
              <Lightbulb className="h-3 w-3" />
              <span>{t.hints.length} hint{t.hints.length > 1 ? 's' : ''} available</span>
            </summary>
            <div className="border-t border-[#1f1f1f] p-4 space-y-2">
              {t.hints.map((hint: string, i: number) => (
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
          <h2 className="text-[10px] font-mono text-[#444] tracking-widest mb-3">SUBMIT FLAG</h2>
          <TerminalFlagInput targetType="task" targetId={t.id} alreadySolved={alreadySolved} />
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

      {/* Sidebar - Machine Access */}
      <div className="space-y-6">
        <div>
          <h2 className="text-[10px] font-mono text-[#444] tracking-widest mb-3 uppercase flex items-center gap-2">
            <Server className="h-3 w-3" />
            Machine Info
          </h2>
          <LabAccess connections={connections} type="task" />
        </div>

        <div className="border border-[#1f1f1f] bg-[#0f0f0f] p-4">
          <h3 className="text-[10px] font-mono text-[#444] tracking-widest mb-3 uppercase">Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-[10px] font-mono">
              <span className="text-[#666]">DIFFICULTY</span>
              <span className={r?.difficulty === 'easy' ? 'text-[#00ff66]' : 'text-[#ffa500]'}>
                {r?.difficulty?.toUpperCase() ?? '—'}
              </span>
            </div>
            <div className="flex justify-between items-center text-[10px] font-mono">
              <span className="text-[#666]">POINTS</span>
              <span className="text-[#ffa500]">{t.points} PTS</span>
            </div>
            <div className="flex justify-between items-center text-[10px] font-mono">
              <span className="text-[#666]">LAB</span>
              <span className={connections.length > 0 ? 'text-[#00ff66]' : 'text-[#444]'}>
                {connections.length > 0 ? 'ACTIVE' : 'NONE'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
