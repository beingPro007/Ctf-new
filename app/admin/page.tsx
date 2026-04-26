import { createClient } from '@/lib/supabase/server'

export default async function AdminPage() {
  const supabase = await createClient()

  const [roomsResult, challengesResult, usersResult, submissionsResult] = await Promise.all([
    supabase.from('rooms').select('id', { count: 'exact', head: true }),
    supabase.from('challenges').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('submissions').select('id', { count: 'exact', head: true }).eq('status', 'success'),
  ])

  const stats = [
    { label: 'Total Rooms', value: roomsResult.count ?? 0, color: 'text-[#00ff66]' },
    { label: 'Challenges', value: challengesResult.count ?? 0, color: 'text-[#39a0ff]' },
    { label: 'Users', value: usersResult.count ?? 0, color: 'text-[#ffa500]' },
    { label: 'Solves', value: submissionsResult.count ?? 0, color: 'text-[#ff00ff]' },
  ]

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-mono font-bold text-[#e6e6e6]">
          <span className="text-[#ff00ff]">&gt;</span> Admin Overview
        </h1>
        <p className="text-xs text-[#444] font-mono mt-1">Platform statistics</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="border border-[#ff00ff]/10 bg-[#0f0f0f] p-4">
            <p className="text-[10px] text-[#444] font-mono tracking-widest mb-1">
              {stat.label.toUpperCase()}
            </p>
            <p className={`text-3xl font-mono font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { href: '/admin/rooms', label: 'Manage Rooms & Tasks', desc: 'Create learning paths' },
          { href: '/admin/challenges', label: 'Manage Challenges', desc: 'Add CTF challenges' },
          { href: '/admin/users', label: 'Manage Users', desc: 'User roles and access' },
        ].map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="border border-[#ff00ff]/10 bg-[#0f0f0f] p-4 hover:border-[#ff00ff]/30 transition-colors group"
          >
            <p className="text-sm font-mono text-[#e6e6e6] group-hover:text-[#ff00ff] transition-colors">
              {item.label}
            </p>
            <p className="text-xs text-[#444] font-mono mt-1">{item.desc}</p>
          </a>
        ))}
      </div>
    </div>
  )
}
