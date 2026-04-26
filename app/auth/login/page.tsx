'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signIn } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StatusBanner } from '@/components/status-banner'
import { Loader2, Terminal } from 'lucide-react'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    const result = await signIn(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
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
          <h1 className="text-lg font-mono text-[#e6e6e6]">Sign In</h1>
          <p className="text-xs text-[#444] font-mono mt-1">
            authenticate to access the platform
          </p>
        </div>

        {/* Form */}
        <div className="border border-[#1f1f1f] bg-[#0f0f0f] p-6 space-y-4">
          {error && <StatusBanner type="error" message={error} />}

          <form action={handleSubmit} className="space-y-4">
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/auth/forgot-password"
                  className="text-[10px] text-[#444] font-mono hover:text-[#00ff66] transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="border-t border-[#1f1f1f] pt-4 text-center">
            <span className="text-xs text-[#444] font-mono">No account? </span>
            <Link
              href="/auth/signup"
              className="text-xs text-[#00ff66] font-mono hover:underline"
            >
              Create one
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
