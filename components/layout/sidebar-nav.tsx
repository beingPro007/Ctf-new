'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  BookOpen,
  Flag,
  Trophy,
  User,
  ShieldCheck,
  LogOut,
} from 'lucide-react'
import { signOut } from '@/actions/auth'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/rooms', label: 'Rooms', icon: BookOpen },
  { href: '/challenges', label: 'Challenges', icon: Flag },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/profile', label: 'Profile', icon: User },
]

interface SidebarNavProps {
  isAdmin?: boolean
}

export function SidebarNav({ isAdmin }: SidebarNavProps) {
  const pathname = usePathname()

  return (
    <aside className="w-56 min-h-screen bg-[#0a0a0a] border-r border-[#1f1f1f] flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-[#1f1f1f]">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-[#00ff66] text-lg font-bold tracking-widest">CTF</span>
          <span className="text-[#666] text-xs">PLATFORM</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 text-xs font-mono transition-colors',
              pathname.startsWith(href)
                ? 'text-[#00ff66] bg-[#00ff66]/5 border-l-2 border-[#00ff66]'
                : 'text-[#666] hover:text-[#e6e6e6] hover:bg-[#0f0f0f]'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}

        {isAdmin && (
          <>
            <div className="pt-4 pb-1">
              <span className="px-3 text-[10px] text-[#444] tracking-widest uppercase">Admin</span>
            </div>
            <Link
              href="/admin"
              className={cn(
                'flex items-center gap-3 px-3 py-2 text-xs font-mono transition-colors',
                pathname.startsWith('/admin')
                  ? 'text-[#ff00ff] bg-[#ff00ff]/5 border-l-2 border-[#ff00ff]'
                  : 'text-[#666] hover:text-[#e6e6e6] hover:bg-[#0f0f0f]'
              )}
            >
              <ShieldCheck className="h-4 w-4 shrink-0" />
              Admin Panel
            </Link>
          </>
        )}
      </nav>

      {/* Sign out */}
      <div className="p-3 border-t border-[#1f1f1f]">
        <form action={signOut}>
          <button
            type="submit"
            className="flex items-center gap-3 px-3 py-2 text-xs font-mono text-[#666] hover:text-[#ff4444] transition-colors w-full"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign Out
          </button>
        </form>
      </div>
    </aside>
  )
}
