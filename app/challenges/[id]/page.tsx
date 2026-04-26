import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { TerminalFlagInput } from '@/components/terminal-flag-input'
import { LabAccess } from '@/components/lab-access'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, Download, Server, Activity } from 'lucide-react'
import type { Challenge, Difficulty } from '@/types/db'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ChallengeDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: rawChallenge } = await supabase
    .from('challenges')
    .select('id, title, category, difficulty, points, description, attachment_paths')
    .eq('id', id)
    .single()

  if (!rawChallenge) notFound()

  // Cast once — avoids 'never' type issues from Supabase generic mismatch
  const c = rawChallenge as unknown as Challenge & { attachment_paths: string[] }

  // Check if already solved
  const { data: existingSolve } = await supabase
    .from('submissions')
    .select('id')
    .eq('user_id', user.id)
    .eq('target_type', 'challenge')
    .eq('target_id', id)
    .eq('status', 'success')
    .maybeSingle()

  const alreadySolved = !!existingSolve

  // Get solve count
  const { count: solveCount } = await supabase
    .from('submissions')
    .select('id', { count: 'exact', head: true })
    .eq('target_type', 'challenge')
    .eq('target_id', id)
    .eq('status', 'success')

  const connections = (c.attachment_paths ?? []).filter(
    p => p.startsWith('http') || p.startsWith('nc') || p.startsWith('ssh')
  )
  const files = (c.attachment_paths ?? []).filter(
    p => !p.startsWith('http') && !p.startsWith('nc') && !p.startsWith('ssh')
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {/* Breadcrumb */}
        <Link
          href="/challenges"
          className="flex items-center gap-1 text-xs text-[#444] font-mono hover:text-[#00ff66] transition-colors"
        >
          <ChevronLeft className="h-3 w-3" />
          Back to Challenges
        </Link>

        {/* Header */}
        <div className="border border-[#1f1f1f] bg-[#0f0f0f] p-6">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <p className="text-[10px] text-[#444] font-mono tracking-widest mb-1">
                {c.category.toUpperCase()}
              </p>
              <h1 className="text-xl font-mono font-bold text-[#e6e6e6]">{c.title}</h1>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant={c.difficulty as Difficulty}>{c.difficulty}</Badge>
              <span className="text-xs font-mono text-[#ffa500] border border-[#ffa500]/30 px-2 py-0.5">
                {c.points} pts
              </span>
            </div>
          </div>
          <p className="text-[10px] text-[#444] font-mono">
            {solveCount ?? 0} solve{solveCount !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Description */}
        <div className="border border-[#1f1f1f] bg-[#0f0f0f] p-6">
          <h2 className="text-[10px] font-mono text-[#444] tracking-widest mb-3 uppercase">Description</h2>
          <div className="text-sm font-mono text-[#ccc] leading-relaxed whitespace-pre-wrap">
            {c.description}
          </div>
        </div>

        {/* File downloads (non-URL attachments) */}
        {files.length > 0 && (
          <div className="border border-[#1f1f1f] bg-[#0f0f0f] p-6">
            <h2 className="text-[10px] font-mono text-[#444] tracking-widest mb-3 uppercase">Downloads</h2>
            <div className="space-y-2">
              {files.map((path, i) => (
                <a
                  key={i}
                  href={path}
                  download
                  className="flex items-center gap-2 px-3 py-2 border border-[#1a1a1a] bg-[#0a0a0a] text-xs font-mono text-[#39a0ff] hover:text-[#00ff66] transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="h-3 w-3" />
                  {path.split('/').pop() ?? path}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Flag submission */}
        <div>
          <h2 className="text-[10px] font-mono text-[#444] tracking-widest mb-3">SUBMIT FLAG</h2>
          <TerminalFlagInput
            targetType="challenge"
            targetId={c.id}
            alreadySolved={alreadySolved}
          />
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        <div>
          <h2 className="text-[10px] font-mono text-[#444] tracking-widest mb-3 uppercase flex items-center gap-2">
            <Server className="h-3 w-3" />
            Lab Access
          </h2>
          <LabAccess connections={connections} type="challenge" />
        </div>

        <div className="border border-[#1f1f1f] bg-[#0f0f0f] p-4">
          <h3 className="text-[10px] font-mono text-[#444] tracking-widest mb-3 uppercase flex items-center gap-2">
            <Activity className="h-3 w-3" />
            Meta
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-[10px] font-mono">
              <span className="text-[#666]">SOLVES</span>
              <span className="text-[#888]">{solveCount ?? 0}</span>
            </div>
            <div className="flex justify-between items-center text-[10px] font-mono">
              <span className="text-[#666]">DIFFICULTY</span>
              <span className={c.difficulty === 'easy' ? 'text-[#00ff66]' : 'text-[#ffa500]'}>
                {c.difficulty.toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between items-center text-[10px] font-mono">
              <span className="text-[#666]">POINTS</span>
              <span className="text-[#ffa500]">{c.points} PTS</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
