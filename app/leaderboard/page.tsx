import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LeaderboardTable } from '@/components/leaderboard-table'

export const revalidate = 60 // Revalidate every minute

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // Get top 100 profiles sorted by points
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, points, avatar_url')
    .order('points', { ascending: false })
    .limit(100)

  // Get solved counts for each user
  const { data: solveCounts } = await supabase
    .from('submissions')
    .select('user_id')
    .eq('status', 'success')

  const solveCountMap: Record<string, number> = {}
  solveCounts?.forEach((s) => {
    solveCountMap[s.user_id] = (solveCountMap[s.user_id] ?? 0) + 1
  })

  const entries = (profiles ?? []).map((p, idx) => ({
    ...p,
    rank: idx + 1,
    solvedCount: solveCountMap[p.id] ?? 0,
  }))

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-mono font-bold text-[#e6e6e6]">
          <span className="text-[#00ff66]">&gt;</span> Leaderboard
        </h1>
        <p className="text-xs text-[#444] font-mono mt-1">
          Top {entries.length} players • Updates every minute
        </p>
      </div>

      <LeaderboardTable entries={entries} currentUserId={user.id} />
    </div>
  )
}
