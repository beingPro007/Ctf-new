'use client'

import { useState } from 'react'
import { createChallenge, deleteChallenge } from '@/actions/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StatusBanner } from '@/components/status-banner'
import { Badge } from '@/components/ui/badge'
import { Trash2, Plus } from 'lucide-react'
import type { Challenge, Difficulty } from '@/types/db'

interface AdminChallengesClientProps {
  challenges: Challenge[]
}

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard', 'insane']
const CATEGORIES = ['Web', 'Crypto', 'Forensics', 'Reverse', 'Pwn', 'Misc', 'OSINT', 'Steganography']

export function AdminChallengesClient({ challenges: initialChallenges }: AdminChallengesClientProps) {
  const [challenges, setChallenges] = useState(initialChallenges)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)

  async function handleCreate(formData: FormData) {
    setLoading(true)
    setError(null)
    const result = await createChallenge(formData)
    if (result.error) setError(result.error)
    else { setSuccess(result.success ?? 'Created'); window.location.reload() }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this challenge?')) return
    setLoading(true)
    const result = await deleteChallenge(id)
    if (result.error) setError(result.error)
    else { setSuccess(result.success ?? 'Deleted'); setChallenges((c) => c.filter((x) => x.id !== id)) }
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      {error && <StatusBanner type="error" message={error} />}
      {success && <StatusBanner type="success" message={success} />}

      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowCreate(!showCreate)}>
          <Plus className="h-3 w-3 mr-1" />
          New Challenge
        </Button>
      </div>

      {showCreate && (
        <div className="border border-[#ff00ff]/20 bg-[#0f0f0f] p-4">
          <h3 className="text-xs font-mono text-[#888] mb-3">CREATE CHALLENGE</h3>
          <form action={(fd) => handleCreate(fd)} className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Title</Label>
              <Input name="title" placeholder="Challenge title" required />
            </div>
            <div className="space-y-1">
              <Label>Category</Label>
              <select
                name="category"
                className="flex h-9 w-full bg-[#0a0a0a] border border-[#1f1f1f] px-3 text-sm font-mono text-[#e6e6e6] focus:outline-none focus:border-[#00ff66]"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Difficulty</Label>
              <select
                name="difficulty"
                className="flex h-9 w-full bg-[#0a0a0a] border border-[#1f1f1f] px-3 text-sm font-mono text-[#e6e6e6] focus:outline-none focus:border-[#00ff66]"
              >
                {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Points</Label>
              <Input name="points" type="number" defaultValue="100" required />
            </div>
            <div className="space-y-1 col-span-2">
              <Label>Flag Hash (HMAC-SHA256 with pepper)</Label>
              <Input name="flag_hash" placeholder="Pre-computed HMAC hash" required />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Description</Label>
              <textarea
                name="description"
                required
                rows={4}
                placeholder="Challenge description..."
                className="flex w-full bg-[#0a0a0a] border border-[#1f1f1f] px-3 py-2 text-sm font-mono text-[#e6e6e6] placeholder:text-[#444] focus:outline-none focus:border-[#00ff66] resize-none"
              />
            </div>
            <div className="col-span-2 flex gap-2">
              <Button type="submit" size="sm" disabled={loading}>Create</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      {/* Challenges list */}
      <div className="border border-[#1f1f1f]">
        <div className="grid grid-cols-[1fr_100px_80px_80px_48px] gap-4 px-4 py-2 border-b border-[#1f1f1f] bg-[#0a0a0a]">
          {['Title', 'Category', 'Difficulty', 'Points', ''].map((h) => (
            <span key={h} className="text-[10px] text-[#444] font-mono tracking-widest">{h}</span>
          ))}
        </div>
        {challenges.map((c) => (
          <div key={c.id} className="grid grid-cols-[1fr_100px_80px_80px_48px] gap-4 px-4 py-3 border-b border-[#0f0f0f] items-center">
            <span className="text-xs font-mono text-[#e6e6e6] truncate">{c.title}</span>
            <span className="text-[10px] font-mono text-[#666]">{c.category}</span>
            <Badge variant={c.difficulty as Difficulty}>{c.difficulty}</Badge>
            <span className="text-xs font-mono text-[#ffa500]">{c.points}</span>
            <Button
              size="icon"
              variant="destructive"
              onClick={() => handleDelete(c.id)}
              disabled={loading}
              className="h-7 w-7"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
        {challenges.length === 0 && (
          <div className="py-8 text-center text-[#444] text-xs font-mono">
            No challenges yet
          </div>
        )}
      </div>
    </div>
  )
}
