'use client'

import { useState } from 'react'
import { updateProfile } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StatusBanner } from '@/components/status-banner'
import { Loader2 } from 'lucide-react'
import type { Profile } from '@/types/db'

interface ProfileFormProps {
  profile: Profile
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    setSuccess(null)
    const result = await updateProfile(formData)
    if (result?.error) setError(result.error)
    else if (result?.success) setSuccess(result.success)
    setLoading(false)
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      {error && <StatusBanner type="error" message={error} />}
      {success && <StatusBanner type="success" message={success} />}

      <div className="space-y-1.5">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          name="username"
          defaultValue={profile.username}
          required
          minLength={3}
          maxLength={20}
          pattern="[a-zA-Z0-9_]+"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bio">Bio</Label>
        <textarea
          id="bio"
          name="bio"
          defaultValue={profile.bio ?? ''}
          maxLength={200}
          rows={3}
          placeholder="Tell us about yourself..."
          className="flex w-full bg-[#0a0a0a] border border-[#1f1f1f] px-3 py-2 text-sm font-mono text-[#e6e6e6] placeholder:text-[#444] focus:outline-none focus:border-[#00ff66] focus:ring-1 focus:ring-[#00ff66] disabled:cursor-not-allowed disabled:opacity-50 transition-colors resize-none"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="avatar_url">Avatar URL</Label>
        <Input
          id="avatar_url"
          name="avatar_url"
          type="url"
          defaultValue={profile.avatar_url ?? ''}
          placeholder="https://example.com/avatar.png"
        />
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          'Save Changes'
        )}
      </Button>
    </form>
  )
}
