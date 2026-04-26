'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import type { Difficulty } from '@/types/db'

export type AdminActionResult = {
  error?: string
  success?: string
  data?: unknown
}

async function requireAdmin(): Promise<{ userId: string } | { error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if ((profile as { role: string } | null)?.role !== 'admin') return { error: 'Forbidden: Admin access required' }

  return { userId: user.id }
}

// ── Rooms ────────────────────────────────────────────────────────────────────

export async function createRoom(formData: FormData): Promise<AdminActionResult> {
  const auth = await requireAdmin()
  if ('error' in auth) return auth

  const supabase = await createAdminClient()
  const { error } = await supabase.from('rooms').insert({
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    difficulty: formData.get('difficulty') as Difficulty,
    order_index: parseInt(formData.get('order_index') as string) || 0,
  })

  if (error) return { error: error.message }
  return { success: 'Room created successfully' }
}

export async function updateRoom(
  roomId: string,
  formData: FormData
): Promise<AdminActionResult> {
  const auth = await requireAdmin()
  if ('error' in auth) return auth

  const supabase = await createAdminClient()
  const { error } = await supabase
    .from('rooms')
    .update({
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      difficulty: formData.get('difficulty') as Difficulty,
      order_index: parseInt(formData.get('order_index') as string) || 0,
    })
    .eq('id', roomId)

  if (error) return { error: error.message }
  return { success: 'Room updated successfully' }
}

export async function deleteRoom(roomId: string): Promise<AdminActionResult> {
  const auth = await requireAdmin()
  if ('error' in auth) return auth

  const supabase = await createAdminClient()
  const { error } = await supabase.from('rooms').delete().eq('id', roomId)

  if (error) return { error: error.message }
  return { success: 'Room deleted successfully' }
}

// ── Tasks ────────────────────────────────────────────────────────────────────

export async function createTask(formData: FormData): Promise<AdminActionResult> {
  const auth = await requireAdmin()
  if ('error' in auth) return auth

  const supabase = await createAdminClient()
  const hintsRaw = formData.get('hints') as string
  let hints: string[] = []
  try {
    hints = hintsRaw ? JSON.parse(hintsRaw) : []
  } catch {
    hints = hintsRaw ? hintsRaw.split('\n').filter(Boolean) : []
  }

  const { error } = await supabase.from('tasks').insert({
    room_id: formData.get('room_id') as string,
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    hints,
    flag_hash: formData.get('flag_hash') as string,
    task_index: parseInt(formData.get('task_index') as string) || 0,
    points: parseInt(formData.get('points') as string) || 0,
  })

  if (error) return { error: error.message }
  return { success: 'Task created successfully' }
}

export async function updateTask(
  taskId: string,
  formData: FormData
): Promise<AdminActionResult> {
  const auth = await requireAdmin()
  if ('error' in auth) return auth

  const supabase = await createAdminClient()
  const hintsRaw = formData.get('hints') as string
  let hints: string[] = []
  try {
    hints = hintsRaw ? JSON.parse(hintsRaw) : []
  } catch {
    hints = hintsRaw ? hintsRaw.split('\n').filter(Boolean) : []
  }

  const updateData: Record<string, unknown> = {
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    hints,
    task_index: parseInt(formData.get('task_index') as string) || 0,
    points: parseInt(formData.get('points') as string) || 0,
  }

  const newFlagHash = formData.get('flag_hash') as string
  if (newFlagHash) {
    updateData.flag_hash = newFlagHash
  }

  const { error } = await supabase.from('tasks').update(updateData).eq('id', taskId)

  if (error) return { error: error.message }
  return { success: 'Task updated successfully' }
}

export async function deleteTask(taskId: string): Promise<AdminActionResult> {
  const auth = await requireAdmin()
  if ('error' in auth) return auth

  const supabase = await createAdminClient()
  const { error } = await supabase.from('tasks').delete().eq('id', taskId)

  if (error) return { error: error.message }
  return { success: 'Task deleted successfully' }
}

// ── Challenges ───────────────────────────────────────────────────────────────

export async function createChallenge(formData: FormData): Promise<AdminActionResult> {
  const auth = await requireAdmin()
  if ('error' in auth) return auth

  const supabase = await createAdminClient()
  const attachmentsRaw = formData.get('attachment_paths') as string
  let attachment_paths: string[] = []
  try {
    attachment_paths = attachmentsRaw ? JSON.parse(attachmentsRaw) : []
  } catch {
    attachment_paths = attachmentsRaw ? attachmentsRaw.split('\n').filter(Boolean) : []
  }

  const { error } = await supabase.from('challenges').insert({
    title: formData.get('title') as string,
    category: formData.get('category') as string,
    difficulty: formData.get('difficulty') as Difficulty,
    points: parseInt(formData.get('points') as string) || 0,
    description: formData.get('description') as string,
    flag_hash: formData.get('flag_hash') as string,
    attachment_paths,
  })

  if (error) return { error: error.message }
  return { success: 'Challenge created successfully' }
}

export async function updateChallenge(
  challengeId: string,
  formData: FormData
): Promise<AdminActionResult> {
  const auth = await requireAdmin()
  if ('error' in auth) return auth

  const supabase = await createAdminClient()
  const attachmentsRaw = formData.get('attachment_paths') as string
  let attachment_paths: string[] = []
  try {
    attachment_paths = attachmentsRaw ? JSON.parse(attachmentsRaw) : []
  } catch {
    attachment_paths = attachmentsRaw ? attachmentsRaw.split('\n').filter(Boolean) : []
  }

  const updateData: Record<string, unknown> = {
    title: formData.get('title') as string,
    category: formData.get('category') as string,
    difficulty: formData.get('difficulty') as Difficulty,
    points: parseInt(formData.get('points') as string) || 0,
    description: formData.get('description') as string,
    attachment_paths,
  }

  const newFlagHash = formData.get('flag_hash') as string
  if (newFlagHash) {
    updateData.flag_hash = newFlagHash
  }

  const { error } = await supabase
    .from('challenges')
    .update(updateData)
    .eq('id', challengeId)

  if (error) return { error: error.message }
  return { success: 'Challenge updated successfully' }
}

export async function deleteChallenge(challengeId: string): Promise<AdminActionResult> {
  const auth = await requireAdmin()
  if ('error' in auth) return auth

  const supabase = await createAdminClient()
  const { error } = await supabase.from('challenges').delete().eq('id', challengeId)

  if (error) return { error: error.message }
  return { success: 'Challenge deleted successfully' }
}

// ── Users ────────────────────────────────────────────────────────────────────

export async function getUsers(): Promise<AdminActionResult> {
  const auth = await requireAdmin()
  if ('error' in auth) return auth

  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return { error: error.message }
  return { data }
}

export async function updateUserRole(
  userId: string,
  role: 'user' | 'admin'
): Promise<AdminActionResult> {
  const auth = await requireAdmin()
  if ('error' in auth) return auth

  // Prevent self-demotion
  if (userId === auth.userId && role !== 'admin') {
    return { error: 'Cannot change your own admin role' }
  }

  const supabase = await createAdminClient()
  const { error } = await supabase.from('profiles').update({ role }).eq('id', userId)

  if (error) return { error: error.message }
  return { success: `User role updated to ${role}` }
}
