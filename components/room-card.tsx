import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { cn, getDifficultyColor } from '@/lib/utils'
import type { Room } from '@/types/db'
import { Lock, CheckCircle2, BookOpen } from 'lucide-react'

interface RoomCardProps {
  room: Room
  totalTasks: number
  solvedTasks: number
  isLocked?: boolean
}

export function RoomCard({ room, totalTasks, solvedTasks, isLocked = false }: RoomCardProps) {
  const progress = totalTasks > 0 ? Math.round((solvedTasks / totalTasks) * 100) : 0
  const isCompleted = solvedTasks === totalTasks && totalTasks > 0

  return (
    <Link
      href={isLocked ? '#' : `/rooms/${room.id}`}
      className={cn(
        'block border bg-[#0f0f0f] p-4 transition-all',
        isLocked
          ? 'border-[#1f1f1f] opacity-50 cursor-not-allowed'
          : 'border-[#1f1f1f] hover:border-[#00ff66]/50 hover:bg-[#0a0a0a]',
        isCompleted && 'border-[#00ff66]/30'
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          {isLocked ? (
            <Lock className="h-4 w-4 text-[#444] shrink-0" />
          ) : isCompleted ? (
            <CheckCircle2 className="h-4 w-4 text-[#00ff66] shrink-0" />
          ) : (
            <BookOpen className="h-4 w-4 text-[#666] shrink-0" />
          )}
          <h3 className="text-sm font-mono font-medium text-[#e6e6e6]">{room.title}</h3>
        </div>
        <Badge variant={room.difficulty as 'easy' | 'medium' | 'hard' | 'insane'}>
          {room.difficulty}
        </Badge>
      </div>

      <p className="text-xs text-[#666] font-mono mb-4 line-clamp-2">{room.description}</p>

      <div className="space-y-1.5">
        <div className="flex justify-between text-[10px] font-mono">
          <span className="text-[#444]">progress</span>
          <span className={getDifficultyColor(room.difficulty)}>
            {solvedTasks}/{totalTasks} tasks
          </span>
        </div>
        <div className="h-1 bg-[#1f1f1f] w-full">
          <div
            className={cn(
              'h-full transition-all',
              isCompleted ? 'bg-[#00ff66]' : 'bg-[#00ff66]/50'
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </Link>
  )
}
