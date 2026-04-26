import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from './profile-form'
import { Badge } from '@/components/ui/badge'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/auth/login')

  const { count: solvedCount } = await supabase
    .from('submissions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'success')

  const { count: rankCount } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .gt('points', profile.points)

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-mono font-bold text-[#e6e6e6]">
          <span className="text-[#00ff66]">&gt;</span> Profile
        </h1>
        <p className="text-xs text-[#444] font-mono mt-1">{user.email}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Points', value: profile.points.toLocaleString(), color: 'text-[#00ff66]' },
          { label: 'Rank', value: `#${(rankCount ?? 0) + 1}`, color: 'text-[#39a0ff]' },
          { label: 'Solved', value: solvedCount ?? 0, color: 'text-[#ffa500]' },
        ].map((stat) => (
          <div key={stat.label} className="border border-[#1f1f1f] bg-[#0f0f0f] p-4 text-center">
            <p className="text-[10px] text-[#444] font-mono tracking-widest">{stat.label}</p>
            <p className={`text-xl font-mono font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Role badge */}
      {profile.role === 'admin' && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#444] font-mono">Role:</span>
          <Badge variant="default" className="bg-[#ff00ff]/10 text-[#ff00ff] border-[#ff00ff]/30">
            admin
          </Badge>
        </div>
      )}

      {/* Edit form */}
      <div className="border border-[#1f1f1f] bg-[#0f0f0f] p-6">
        <h2 className="text-xs font-mono text-[#444] tracking-widest mb-4">EDIT PROFILE</h2>
        <ProfileForm profile={profile} />
      </div>
    </div>
  )
}
