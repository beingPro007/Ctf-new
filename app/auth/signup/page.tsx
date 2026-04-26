'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signUp } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StatusBanner } from '@/components/status-banner'
import { Loader2, Terminal } from 'lucide-react'

export default function SignUpPage() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    setSuccess(null)
    const result = await signUp(formData)
    if (result?.error) {
      setError(result.error)
    } else if (result?.success) {
      setSuccess(result.success)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Terminal className="h-6 w-6 text-[#00ff66]" />
            <span className="text-[#00ff66] text-2xl font-bold tracking-widest">CTF</span>
          </div>
          <h1 className="text-lg font-mono text-[#e6e6e6]">Create Account</h1>
          <p className="text-xs text-[#444] font-mono mt-1">
            join the platform and start hacking
          </p>
        </div>

        {/* Form */}
        <div className="border border-[#1f1f1f] bg-[#0f0f0f] p-6 space-y-4">
          {error && <StatusBanner type="error" message={error} />}
          {success && <StatusBanner type="success" message={success} />}

          {!success && (
            <form action={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="h4cker_name"
                  required
                  autoComplete="username"
                  pattern="[a-zA-Z0-9_]+"
                  minLength={3}
                  maxLength={20}
                />
                <p className="text-[10px] text-[#444] font-mono">
                  3-20 characters, letters, numbers, underscores
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="user@example.com"
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  minLength={8}
                />
                <p className="text-[10px] text-[#444] font-mono">Minimum 8 characters</p>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>
          )}

          <div className="border-t border-[#1f1f1f] pt-4 text-center">
            <span className="text-xs text-[#444] font-mono">Already have an account? </span>
            <Link
              href="/auth/login"
              className="text-xs text-[#00ff66] font-mono hover:underline"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
