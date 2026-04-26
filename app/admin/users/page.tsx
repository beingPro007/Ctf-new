import { redirect } from 'next/navigation'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { AdminUsersClient } from './admin-users-client'

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const adminSupabase = await createAdminClient()
  const { data: users } = await adminSupabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-mono font-bold text-[#e6e6e6]">
          <span className="text-[#ff00ff]">&gt;</span> Users
        </h1>
        <p className="text-xs text-[#444] font-mono mt-1">
          {users?.length ?? 0} registered users
        </p>
      </div>
      <AdminUsersClient users={users ?? []} currentUserId={user.id} />
    </div>
  )
}
