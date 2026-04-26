'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
})

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export type ActionResult = {
  error?: string
  success?: string
}

export async function signUp(formData: FormData): Promise<ActionResult> {
  const parsed = signUpSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    username: formData.get('username'),
  })

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const { email, password, username } = parsed.data
  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/verify-email`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { success: 'Account created! Please check your email to verify your account.' }
}

export async function signIn(formData: FormData): Promise<ActionResult> {
  const parsed = signInSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const { email, password } = parsed.data
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: error.message }
  }

  if (!data.user.email_confirmed_at) {
    return { error: 'Please verify your email before signing in.' }
  }

  redirect('/dashboard')
}

export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/auth/login')
}

export async function requestPasswordReset(formData: FormData): Promise<ActionResult> {
  const email = formData.get('email')
  if (!email || typeof email !== 'string') {
    return { error: 'Email is required' }
  }

  const emailParse = z.string().email().safeParse(email)
  const emailError = emailParse.success ? null : 'Invalid email address'

  if (emailError) return { error: emailError }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: 'Password reset link sent! Check your email.' }
}

export async function resetPassword(formData: FormData): Promise<ActionResult> {
  const password = formData.get('password')
  const confirmPassword = formData.get('confirmPassword')

  if (!password || typeof password !== 'string') {
    return { error: 'Password is required' }
  }

  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters' }
  }

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    return { error: error.message }
  }

  redirect('/dashboard')
}

export async function updateProfile(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: 'Not authenticated' }
  }

  const username = formData.get('username')
  const bio = formData.get('bio')
  const avatar_url = formData.get('avatar_url')

  if (!username || typeof username !== 'string') {
    return { error: 'Username is required' }
  }

  const usernameResult = z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/)
    .safeParse(username)

  if (!usernameResult.success) {
    return { error: 'Invalid username format' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      username,
      bio: typeof bio === 'string' ? bio : null,
      avatar_url: typeof avatar_url === 'string' && avatar_url ? avatar_url : null,
    })
    .eq('id', user.id)

  if (error) {
    if (error.code === '23505') {
      return { error: 'Username already taken' }
    }
    return { error: error.message }
  }

  return { success: 'Profile updated successfully' }
}
