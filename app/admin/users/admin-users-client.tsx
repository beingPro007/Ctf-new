'use client'

import { useState } from 'react'
import { updateUserRole } from '@/actions/admin'
import { StatusBanner } from '@/components/status-banner'
import { Badge } from '@/components/ui/badge'
import type { Profile } from '@/types/db'

interface AdminUsersClientProps {
  users: Profile[]
  currentUserId: string
}

export function AdminUsersClient({ users, currentUserId }: AdminUsersClientProps) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [localUsers, setLocalUsers] = useState(users)

  async function handleRoleToggle(userId: string, currentRole: 'user' | 'admin') {
    const newRole = currentRole === 'admin' ? 'user' : 'admin'
    setLoading(userId)
    setError(null)
    const result = await updateUserRole(userId, newRole)
    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(result.success ?? 'Updated')
      setLocalUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      )
    }
    setLoading(null)
  }

  return (
    <div className="space-y-4">
      {error && <StatusBanner type="error" message={error} />}
      {success && <StatusBanner type="success" message={success} />}

      <div className="border border-[#1f1f1f]">
        <div className="grid grid-cols-[1fr_80px_100px_80px] gap-4 px-4 py-2 border-b border-[#1f1f1f] bg-[#0a0a0a]">
          {['Username', 'Points', 'Joined', 'Role'].map((h) => (
            <span key={h} className="text-[10px] text-[#444] font-mono tracking-widest">{h}</span>
          ))}
        </div>

        {localUsers.map((user) => (
          <div
            key={user.id}
            className="grid grid-cols-[1fr_80px_100px_80px] gap-4 px-4 py-3 border-b border-[#0f0f0f] items-center"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[#e6e6e6]">{user.username}</span>
              {user.id === currentUserId && (
                <span className="text-[10px] text-[#444] font-mono">(you)</span>
              )}
            </div>
            <span className="text-xs font-mono text-[#ffa500]">{user.points}</span>
            <span className="text-[10px] font-mono text-[#444]">
              {new Date(user.created_at).toLocaleDateString()}
            </span>
            <button
              onClick={() => handleRoleToggle(user.id, user.role)}
              disabled={loading === user.id || user.id === currentUserId}
              className="disabled:opacity-50"
            >
              <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                {loading === user.id ? '...' : user.role}
              </Badge>
            </button>
          </div>
        ))}

        {localUsers.length === 0 && (
          <div className="py-8 text-center text-[#444] text-xs font-mono">No users</div>
        )}
      </div>

      <p className="text-[10px] text-[#444] font-mono">
        Click a role badge to toggle admin access. You cannot change your own role.
      </p>
    </div>
  )
}
