import { createClient } from '@/lib/supabase/server'
import { Terminal } from 'lucide-react'

export async function Topbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('username, points')
      .eq('id', user.id)
      .single()
    profile = data
  }

  return (
    <header className="h-12 border-b border-[#1f1f1f] bg-[#0a0a0a] flex items-center justify-between px-4">
      <div className="flex items-center gap-2">
        <Terminal className="h-3 w-3 text-[#00ff66]" />
        <span className="text-[10px] text-[#444] font-mono tracking-widest">
          root@ctf:~$
        </span>
      </div>
      {profile && (
        <div className="flex items-center gap-4">
          <span className="text-[10px] text-[#00ff66] font-mono">
            {profile.points} pts
          </span>
          <span className="text-[10px] text-[#666] font-mono">{profile.username}</span>
        </div>
      )}
    </header>
  )
}
