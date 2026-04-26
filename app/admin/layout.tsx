import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const adminNav = [
  { href: '/admin', label: 'Overview', exact: true },
  { href: '/admin/rooms', label: 'Rooms & Tasks' },
  { href: '/admin/challenges', label: 'Challenges' },
  { href: '/admin/users', label: 'Users' },
]

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  return (
    <div className="flex min-h-screen">
      {/* Admin sidebar */}
      <aside className="w-56 min-h-screen bg-[#0a0a0a] border-r border-[#ff00ff]/10 flex flex-col">
        <div className="p-4 border-b border-[#ff00ff]/10">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="text-[#ff00ff] text-sm font-bold tracking-widest">ADMIN</span>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {adminNav.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2 text-xs font-mono text-[#666] hover:text-[#e6e6e6] hover:bg-[#0f0f0f] transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-[#ff00ff]/10">
          <Link
            href="/dashboard"
            className="text-xs font-mono text-[#444] hover:text-[#00ff66] transition-colors"
          >
            ← Back to App
          </Link>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">{children}</div>
    </div>
  )
}
