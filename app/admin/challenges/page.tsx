import { createAdminClient } from '@/lib/supabase/server'
import { AdminChallengesClient } from './admin-challenges-client'

export default async function AdminChallengesPage() {
  const supabase = await createAdminClient()

  const { data: challenges } = await supabase
    .from('challenges')
    .select('id, title, category, difficulty, points, description, attachment_paths, created_at')
    .order('category')
    .order('points')

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-mono font-bold text-[#e6e6e6]">
          <span className="text-[#ff00ff]">&gt;</span> Challenges
        </h1>
        <p className="text-xs text-[#444] font-mono mt-1">
          Manage CTF challenges
        </p>
      </div>
      <AdminChallengesClient challenges={challenges ?? []} />
    </div>
  )
}
