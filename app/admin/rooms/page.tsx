import { createAdminClient } from '@/lib/supabase/server'
import { AdminRoomsClient } from './admin-rooms-client'

export default async function AdminRoomsPage() {
  const supabase = await createAdminClient()

  const { data: rooms } = await supabase
    .from('rooms')
    .select('*')
    .order('order_index')

  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, room_id, title, description, hints, task_index, points, created_at')
    .order('task_index')

  const roomsWithTasks = (rooms ?? []).map((room) => ({
    ...room,
    tasks: tasks?.filter((t) => t.room_id === room.id) ?? [],
  }))

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-mono font-bold text-[#e6e6e6]">
          <span className="text-[#ff00ff]">&gt;</span> Rooms & Tasks
        </h1>
        <p className="text-xs text-[#444] font-mono mt-1">
          Manage learning rooms and their tasks
        </p>
      </div>
      <AdminRoomsClient rooms={roomsWithTasks} />
    </div>
  )
}
