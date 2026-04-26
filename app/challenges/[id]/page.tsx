import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { TerminalFlagInput } from '@/components/terminal-flag-input'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, Download } from 'lucide-react'
import type { Difficulty } from '@/types/db'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ChallengeDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: challenge } = await supabase
    .from('challenges')
    .select('id, title, category, difficulty, points, description, attachment_paths')
    .eq('id', id)
    .single()

  if (!challenge) notFound()

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

  return (
    <div className="space-y-6 max-w-3xl">
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
              {challenge.category.toUpperCase()}
            </p>
            <h1 className="text-xl font-mono font-bold text-[#e6e6e6]">{challenge.title}</h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant={challenge.difficulty as Difficulty}>{challenge.difficulty}</Badge>
            <span className="text-xs font-mono text-[#ffa500] border border-[#ffa500]/30 px-2 py-0.5">
              {challenge.points} pts
            </span>
          </div>
        </div>
        <p className="text-[10px] text-[#444] font-mono">
          {solveCount ?? 0} solve{solveCount !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Description */}
      <div className="border border-[#1f1f1f] bg-[#0f0f0f] p-6">
        <h2 className="text-[10px] font-mono text-[#444] tracking-widest mb-3">DESCRIPTION</h2>
        <div className="text-sm font-mono text-[#ccc] leading-relaxed whitespace-pre-wrap">
          {challenge.description}
        </div>
      </div>

      {/* Attachments */}
      {challenge.attachment_paths && challenge.attachment_paths.length > 0 && (
        <div className="border border-[#1f1f1f] bg-[#0f0f0f] p-6">
          <h2 className="text-[10px] font-mono text-[#444] tracking-widest mb-3">FILES</h2>
          <div className="space-y-2">
            {(challenge.attachment_paths as string[]).map((path, i) => (
              <a
                key={i}
                href={path}
                download
                className="flex items-center gap-2 text-xs font-mono text-[#39a0ff] hover:text-[#00ff66] transition-colors"
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
        <h2 className="text-[10px] font-mono text-[#444] tracking-widest mb-3">
          SUBMIT FLAG
        </h2>
        <TerminalFlagInput
          targetType="challenge"
          targetId={challenge.id}
          alreadySolved={alreadySolved}
        />
      </div>
    </div>
  )
}
