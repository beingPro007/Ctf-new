'use client'

import { useState } from 'react'
import { createRoom, updateRoom, deleteRoom, createTask, updateTask, deleteTask } from '@/actions/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StatusBanner } from '@/components/status-banner'
import { Badge } from '@/components/ui/badge'
import { Trash2, Plus, ChevronDown, ChevronRight } from 'lucide-react'
import type { Room, Task, Difficulty } from '@/types/db'

interface AdminRoomsClientProps {
  rooms: (Room & { tasks: Omit<Task, 'flag_hash'>[] })[]
}

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard', 'insane']

export function AdminRoomsClient({ rooms: initialRooms }: AdminRoomsClientProps) {
  const [rooms, setRooms] = useState(initialRooms)
  const [expandedRoom, setExpandedRoom] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showCreateRoom, setShowCreateRoom] = useState(false)
  const [showCreateTask, setShowCreateTask] = useState<string | null>(null)

  async function handleCreateRoom(formData: FormData) {
    setLoading(true)
    setError(null)
    const result = await createRoom(formData)
    if (result.error) setError(result.error)
    else { setSuccess(result.success ?? 'Done'); window.location.reload() }
    setLoading(false)
  }

  async function handleDeleteRoom(roomId: string) {
    if (!confirm('Delete this room and all its tasks?')) return
    setLoading(true)
    const result = await deleteRoom(roomId)
    if (result.error) setError(result.error)
    else { setSuccess(result.success ?? 'Deleted'); setRooms((r) => r.filter((x) => x.id !== roomId)) }
    setLoading(false)
  }

  async function handleCreateTask(roomId: string, formData: FormData) {
    setLoading(true)
    setError(null)
    formData.append('room_id', roomId)
    const result = await createTask(formData)
    if (result.error) setError(result.error)
    else { setSuccess(result.success ?? 'Done'); window.location.reload() }
    setLoading(false)
  }

  async function handleDeleteTask(taskId: string) {
    if (!confirm('Delete this task?')) return
    setLoading(true)
    const result = await deleteTask(taskId)
    if (result.error) setError(result.error)
    else { setSuccess(result.success ?? 'Deleted'); window.location.reload() }
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      {error && <StatusBanner type="error" message={error} />}
      {success && <StatusBanner type="success" message={success} />}

      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowCreateRoom(!showCreateRoom)}>
          <Plus className="h-3 w-3 mr-1" />
          New Room
        </Button>
      </div>

      {/* Create Room form */}
      {showCreateRoom && (
        <div className="border border-[#ff00ff]/20 bg-[#0f0f0f] p-4">
          <h3 className="text-xs font-mono text-[#888] mb-3">CREATE ROOM</h3>
          <form action={(fd) => handleCreateRoom(fd)} className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Title</Label>
              <Input name="title" placeholder="Room title" required />
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
              <Label>Order Index</Label>
              <Input name="order_index" type="number" defaultValue="0" />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Description</Label>
              <Input name="description" placeholder="Room description" required />
            </div>
            <div className="col-span-2 flex gap-2">
              <Button type="submit" size="sm" disabled={loading}>Create</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setShowCreateRoom(false)}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      {/* Rooms list */}
      {rooms.map((room) => (
        <div key={room.id} className="border border-[#1f1f1f] bg-[#0f0f0f]">
          <div className="flex items-center justify-between p-4">
            <button
              className="flex items-center gap-2 text-left flex-1"
              onClick={() => setExpandedRoom(expandedRoom === room.id ? null : room.id)}
            >
              {expandedRoom === room.id ? (
                <ChevronDown className="h-4 w-4 text-[#444]" />
              ) : (
                <ChevronRight className="h-4 w-4 text-[#444]" />
              )}
              <span className="text-sm font-mono text-[#e6e6e6]">{room.title}</span>
              <Badge variant={room.difficulty as Difficulty}>{room.difficulty}</Badge>
              <span className="text-[10px] text-[#444] font-mono">{room.tasks.length} tasks</span>
            </button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleDeleteRoom(room.id)}
              disabled={loading}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>

          {expandedRoom === room.id && (
            <div className="border-t border-[#1f1f1f] p-4 space-y-3">
              {/* Tasks */}
              {room.tasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 border border-[#1f1f1f]">
                  <div>
                    <span className="text-xs font-mono text-[#e6e6e6]">
                      [{task.task_index}] {task.title}
                    </span>
                    <span className="text-[10px] text-[#444] font-mono ml-3">{task.points} pts</span>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteTask(task.id)}
                    disabled={loading}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}

              {/* Add task */}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowCreateTask(showCreateTask === room.id ? null : room.id)}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Task
              </Button>

              {showCreateTask === room.id && (
                <div className="border border-[#ff00ff]/20 p-3">
                  <form action={(fd) => handleCreateTask(room.id, fd)} className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Title</Label>
                      <Input name="title" placeholder="Task title" required />
                    </div>
                    <div className="space-y-1">
                      <Label>Task Index</Label>
                      <Input name="task_index" type="number" defaultValue={room.tasks.length} />
                    </div>
                    <div className="space-y-1">
                      <Label>Points</Label>
                      <Input name="points" type="number" defaultValue="100" />
                    </div>
                    <div className="space-y-1">
                      <Label>Flag Hash (HMAC-SHA256)</Label>
                      <Input name="flag_hash" placeholder="Pre-hashed flag" required />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label>Description</Label>
                      <textarea
                        name="description"
                        required
                        rows={3}
                        placeholder="Task description..."
                        className="flex w-full bg-[#0a0a0a] border border-[#1f1f1f] px-3 py-2 text-sm font-mono text-[#e6e6e6] placeholder:text-[#444] focus:outline-none focus:border-[#00ff66] resize-none"
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label>Hints (one per line)</Label>
                      <textarea
                        name="hints"
                        rows={2}
                        placeholder="Hint 1&#10;Hint 2"
                        className="flex w-full bg-[#0a0a0a] border border-[#1f1f1f] px-3 py-2 text-sm font-mono text-[#e6e6e6] placeholder:text-[#444] focus:outline-none focus:border-[#00ff66] resize-none"
                      />
                    </div>
                    <div className="col-span-2 flex gap-2">
                      <Button type="submit" size="sm" disabled={loading}>Create Task</Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => setShowCreateTask(null)}>Cancel</Button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {rooms.length === 0 && (
        <div className="border border-[#1f1f1f] p-8 text-center">
          <p className="text-xs text-[#444] font-mono">No rooms yet. Create one above.</p>
        </div>
      )}
    </div>
  )
}
