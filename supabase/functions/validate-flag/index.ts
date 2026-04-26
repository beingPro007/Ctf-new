import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from 'https://deno.land/std@0.177.0/crypto/mod.ts'
import { encode as encodeHex } from 'https://deno.land/std@0.177.0/encoding/hex.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-forwarded-for',
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const flagPepper = Deno.env.get('FLAG_PEPPER') ?? 'default-pepper-change-me'

    // Verify Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }
    const jwt = authHeader.replace('Bearer ', '')

    // Service-role client
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Verify user JWT
    const {
      data: { user },
      error: authError,
    } = await adminClient.auth.getUser(jwt)

    if (authError || !user) {
      return jsonResponse({ error: 'Invalid token' }, 401)
    }

    const body = await req.json()
    const { targetType, targetId, flag } = body

    if (!targetType || !targetId || !flag) {
      return jsonResponse({ error: 'Missing required fields' }, 400)
    }

    if (!['task', 'challenge'].includes(targetType)) {
      return jsonResponse({ error: 'Invalid targetType' }, 400)
    }

    const userId = user.id
    const ipAddress =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      'unknown'

    // ── Rate limiting ──────────────────────────────────────────────────────────
    const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString()

    const [userRateResult, ipRateResult] = await Promise.all([
      adminClient
        .from('rate_limits')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('action', 'flag_submit')
        .gte('created_at', oneMinuteAgo),
      adminClient
        .from('rate_limits')
        .select('id', { count: 'exact', head: true })
        .eq('ip_address', ipAddress)
        .eq('action', 'flag_submit')
        .gte('created_at', oneMinuteAgo),
    ])

    if ((userRateResult.count ?? 0) >= 5) {
      return jsonResponse(
        { error: 'Rate limit exceeded. Try again in a minute.' },
        429
      )
    }

    if ((ipRateResult.count ?? 0) >= 10) {
      return jsonResponse(
        { error: 'Rate limit exceeded for your IP. Try again in a minute.' },
        429
      )
    }

    // Log attempt
    await adminClient.from('rate_limits').insert({
      user_id: userId,
      ip_address: ipAddress,
      action: 'flag_submit',
    })

    // ── Idempotency ────────────────────────────────────────────────────────────
    const { data: existingSolve } = await adminClient
      .from('submissions')
      .select('id')
      .eq('user_id', userId)
      .eq('target_type', targetType)
      .eq('target_id', targetId)
      .eq('status', 'success')
      .maybeSingle()

    if (existingSolve) {
      return jsonResponse({
        status: 'success',
        message: 'Already solved! No additional points awarded.',
        awardedPoints: 0,
      })
    }

    // ── Fetch flag_hash ────────────────────────────────────────────────────────
    let flagHash: string | null = null
    let targetPoints = 0
    let roomId: string | null = null
    let taskIndex: number | null = null

    if (targetType === 'task') {
      const { data: task, error: taskError } = await adminClient
        .from('tasks')
        .select('flag_hash, points, room_id, task_index')
        .eq('id', targetId)
        .single()

      if (taskError || !task) {
        return jsonResponse({ error: 'Target not found' }, 404)
      }

      flagHash = task.flag_hash
      targetPoints = task.points
      roomId = task.room_id
      taskIndex = task.task_index
    } else {
      const { data: challenge, error: challengeError } = await adminClient
        .from('challenges')
        .select('flag_hash, points')
        .eq('id', targetId)
        .single()

      if (challengeError || !challenge) {
        return jsonResponse({ error: 'Target not found' }, 404)
      }

      flagHash = challenge.flag_hash
      targetPoints = challenge.points
    }

    // ── HMAC-SHA256 comparison ─────────────────────────────────────────────────
    const encoder = new TextEncoder()
    const keyData = encoder.encode(flagPepper)
    const flagData = encoder.encode((flag as string).trim())

    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const signature = await crypto.subtle.sign('HMAC', key, flagData)
    const submittedHash = encodeHex(new Uint8Array(signature))

    const isCorrect = submittedHash === flagHash

    if (!isCorrect) {
      await adminClient.from('submissions').insert({
        user_id: userId,
        target_type: targetType,
        target_id: targetId,
        status: 'failure',
      })

      return jsonResponse({
        status: 'failure',
        message: 'Incorrect flag. Try again.',
        awardedPoints: 0,
      })
    }

    // ── Record success + award points ──────────────────────────────────────────
    await adminClient.from('submissions').insert({
      user_id: userId,
      target_type: targetType,
      target_id: targetId,
      status: 'success',
    })

    await adminClient.rpc('increment_points', {
      p_user_id: userId,
      p_points: targetPoints,
    })

    // Update user_progress for tasks
    if (targetType === 'task' && roomId !== null && taskIndex !== null) {
      await adminClient.from('user_progress').upsert(
        {
          user_id: userId,
          room_id: roomId,
          task_id: targetId,
          status: 'solved',
          solved_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,task_id' }
      )

      // Unlock next task
      const { data: nextTask } = await adminClient
        .from('tasks')
        .select('id')
        .eq('room_id', roomId)
        .eq('task_index', taskIndex + 1)
        .maybeSingle()

      if (nextTask) {
        await adminClient.from('user_progress').upsert(
          {
            user_id: userId,
            room_id: roomId,
            task_id: nextTask.id,
            status: 'unlocked',
          },
          { onConflict: 'user_id,task_id' }
        )
      }
    }

    return jsonResponse({
      status: 'success',
      message: 'Flag correct! Points awarded.',
      awardedPoints: targetPoints,
    })
  } catch (error) {
    console.error('Edge function error:', error)
    return jsonResponse({ error: 'Internal server error' }, 500)
  }
})
