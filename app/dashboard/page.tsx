import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const [profileResult, submissionsResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('username, points, role, created_at')
      .eq('id', user.id)
      .single(),
    supabase
      .from('submissions')
      .select('id, target_type, target_id, status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const profile = profileResult.data
  const recentSubmissions = submissionsResult.data ?? []

  // Get user rank
  const { count: rankCount } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .gt('points', profile?.points ?? 0)

  const rank = (rankCount ?? 0) + 1

  // Get solved counts
  const { count: solvedCount } = await supabase
    .from('submissions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'success')

  // Get rooms with user progress
  const { data: rooms } = await supabase
    .from('rooms')
    .select('id, title, difficulty')
    .order('order_index')
    .limit(3)

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-mono font-bold text-[#e6e6e6]">
          <span className="text-[#00ff66]">&gt;</span> Dashboard
        </h1>
        <p className="text-xs text-[#444] font-mono mt-1">
          Welcome back, {profile?.username}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Points', value: (profile?.points ?? 0).toLocaleString(), color: 'text-[#00ff66]' },
          { label: 'Global Rank', value: `#${rank}`, color: 'text-[#39a0ff]' },
          { label: 'Solved', value: solvedCount ?? 0, color: 'text-[#ffa500]' },
          { label: 'Joined', value: profile?.created_at ? new Date(profile.created_at).getFullYear() : '—', color: 'text-[#888]' },
        ].map((stat) => (
          <div key={stat.label} className="border border-[#1f1f1f] bg-[#0f0f0f] p-4">
            <p className="text-[10px] text-[#444] font-mono tracking-widest mb-1">
              {stat.label.toUpperCase()}
            </p>
            <p className={`text-2xl font-mono font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Recent activity + Continue learning */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recent Activity */}
        <div className="border border-[#1f1f1f] bg-[#0f0f0f]">
          <div className="px-4 py-3 border-b border-[#1f1f1f]">
            <h2 className="text-xs font-mono text-[#888] tracking-widest">RECENT ACTIVITY</h2>
          </div>
          <div className="divide-y divide-[#0f0f0f]">
            {recentSubmissions.length === 0 ? (
              <p className="px-4 py-6 text-xs text-[#444] font-mono text-center">
                No activity yet. Start solving challenges!
              </p>
            ) : (
              recentSubmissions.map((sub) => (
                <div key={sub.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <span
                      className={`text-[10px] font-mono ${sub.status === 'success' ? 'text-[#00ff66]' : 'text-[#ff4444]'}`}
                    >
                      {sub.status === 'success' ? '[SOLVED]' : '[FAILED]'}
                    </span>
                    <span className="text-[10px] text-[#444] font-mono ml-2">
                      {sub.target_type}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#333] font-mono">
                    {new Date(sub.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Continue Learning */}
        <div className="border border-[#1f1f1f] bg-[#0f0f0f]">
          <div className="px-4 py-3 border-b border-[#1f1f1f]">
            <h2 className="text-xs font-mono text-[#888] tracking-widest">CONTINUE LEARNING</h2>
          </div>
          <div className="p-4 space-y-2">
            {!rooms || rooms.length === 0 ? (
              <p className="text-xs text-[#444] font-mono text-center py-4">
                No rooms available yet
              </p>
            ) : (
              rooms.map((room) => (
                <a
                  key={room.id}
                  href={`/rooms/${room.id}`}
                  className="flex items-center justify-between p-3 border border-[#1f1f1f] hover:border-[#00ff66]/30 transition-colors group"
                >
                  <span className="text-xs font-mono text-[#e6e6e6] group-hover:text-[#00ff66] transition-colors">
                    {room.title}
                  </span>
                  <span
                    className={`text-[10px] font-mono ${
                      room.difficulty === 'easy'
                        ? 'text-[#00ff66]'
                        : room.difficulty === 'medium'
                          ? 'text-[#ffa500]'
                          : room.difficulty === 'hard'
                            ? 'text-[#ff4444]'
                            : 'text-[#ff00ff]'
                    }`}
                  >
                    {room.difficulty}
                  </span>
                </a>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
