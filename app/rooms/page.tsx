import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RoomCard } from '@/components/room-card'

export default async function RoomsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: rooms } = await supabase
    .from('rooms')
    .select('*')
    .order('order_index')

  // Get task counts per room
  const { data: taskCounts } = await supabase
    .from('tasks')
    .select('room_id, id')

  // Get user progress
  const { data: progress } = await supabase
    .from('user_progress')
    .select('room_id, task_id, status')
    .eq('user_id', user.id)

  const taskCountByRoom: Record<string, number> = {}
  taskCounts?.forEach((t) => {
    taskCountByRoom[t.room_id] = (taskCountByRoom[t.room_id] ?? 0) + 1
  })

  const solvedByRoom: Record<string, number> = {}
  progress?.forEach((p) => {
    if (p.status === 'solved') {
      solvedByRoom[p.room_id] = (solvedByRoom[p.room_id] ?? 0) + 1
    }
  })

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-mono font-bold text-[#e6e6e6]">
          <span className="text-[#00ff66]">&gt;</span> Learning Rooms
        </h1>
        <p className="text-xs text-[#444] font-mono mt-1">
          Guided learning paths with sequential tasks
        </p>
      </div>

      {!rooms || rooms.length === 0 ? (
        <div className="border border-[#1f1f1f] bg-[#0f0f0f] p-12 text-center">
          <p className="text-xs text-[#444] font-mono">No rooms available yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              totalTasks={taskCountByRoom[room.id] ?? 0}
              solvedTasks={solvedByRoom[room.id] ?? 0}
            />
          ))}
        </div>
      )}
    </div>
  )
}
