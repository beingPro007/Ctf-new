'use server'

import { createClient } from '@/lib/supabase/server'

export type FlagSubmitResult = {
  status: 'success' | 'failure' | 'error'
  message: string
  awardedPoints: number
}

export async function submitFlag({
  targetType,
  targetId,
  flag,
}: {
  targetType: 'task' | 'challenge'
  targetId: string
  flag: string
}): Promise<FlagSubmitResult> {
  const supabase = await createClient()
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError || !session) {
    return { status: 'error', message: 'Not authenticated', awardedPoints: 0 }
  }

  if (!flag.trim()) {
    return { status: 'error', message: 'Flag cannot be empty', awardedPoints: 0 }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) {
    return { status: 'error', message: 'Server configuration error', awardedPoints: 0 }
  }

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/validate-flag`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      },
      body: JSON.stringify({ targetType, targetId, flag: flag.trim() }),
    })

    if (response.status === 429) {
      const data = await response.json()
      return {
        status: 'error',
        message: data.error ?? 'Rate limit exceeded. Try again in a minute.',
        awardedPoints: 0,
      }
    }

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      return {
        status: 'error',
        message: data.error ?? 'Submission failed. Please try again.',
        awardedPoints: 0,
      }
    }

    const result = await response.json()
    return {
      status: result.status === 'success' ? 'success' : 'failure',
      message: result.message,
      awardedPoints: result.awardedPoints ?? 0,
    }
  } catch {
    return { status: 'error', message: 'Network error. Please try again.', awardedPoints: 0 }
  }
}
