import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import type { Difficulty } from '@/types/db'

export default async function ChallengesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: challenges } = await supabase
    .from('challenges')
    .select('id, title, category, difficulty, points, description')
    .order('category')
    .order('points')

  // Get solved challenges
  const { data: solved } = await supabase
    .from('submissions')
    .select('target_id')
    .eq('user_id', user.id)
    .eq('target_type', 'challenge')
    .eq('status', 'success')

  const solvedIds = new Set(solved?.map((s) => s.target_id) ?? [])

  // Group by category
  const byCategory: Record<string, typeof challenges> = {}
  challenges?.forEach((c) => {
    if (!byCategory[c.category]) byCategory[c.category] = []
    byCategory[c.category]!.push(c)
  })

  const categories = Object.keys(byCategory).sort()

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-xl font-mono font-bold text-[#e6e6e6]">
          <span className="text-[#00ff66]">&gt;</span> Challenges
        </h1>
        <p className="text-xs text-[#444] font-mono mt-1">
          {challenges?.length ?? 0} challenges •{' '}
          {solvedIds.size} solved
        </p>
      </div>

      {categories.length === 0 ? (
        <div className="border border-[#1f1f1f] bg-[#0f0f0f] p-12 text-center">
          <p className="text-xs text-[#444] font-mono">No challenges available yet</p>
        </div>
      ) : (
        categories.map((category) => (
          <div key={category} className="space-y-3">
            <h2 className="text-xs font-mono text-[#444] tracking-widest">{category.toUpperCase()}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {byCategory[category]?.map((challenge) => {
                const isSolved = solvedIds.has(challenge.id)
                return (
                  <Link
                    key={challenge.id}
                    href={`/challenges/${challenge.id}`}
                    className={`block border bg-[#0f0f0f] p-4 transition-all hover:bg-[#0a0a0a] ${
                      isSolved
                        ? 'border-[#00ff66]/20 hover:border-[#00ff66]/40'
                        : 'border-[#1f1f1f] hover:border-[#333]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-sm font-mono text-[#e6e6e6] line-clamp-1">
                        {isSolved && <span className="text-[#00ff66] mr-1">✓</span>}
                        {challenge.title}
                      </h3>
                      <span className="text-[10px] font-mono text-[#ffa500] shrink-0">
                        {challenge.points}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#555] font-mono line-clamp-2 mb-3">
                      {challenge.description}
                    </p>
                    <Badge variant={challenge.difficulty as Difficulty}>
                      {challenge.difficulty}
                    </Badge>
                  </Link>
                )
              })}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
