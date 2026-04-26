import { cn } from '@/lib/utils'
import type { Profile } from '@/types/db'
import { Trophy, Medal, Award } from 'lucide-react'

interface LeaderboardEntry extends Pick<Profile, 'id' | 'username' | 'points' | 'avatar_url'> {
  rank: number
  solvedCount: number
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[]
  currentUserId?: string
}

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Trophy className="h-4 w-4 text-[#ffd700]" />
  if (rank === 2) return <Medal className="h-4 w-4 text-[#c0c0c0]" />
  if (rank === 3) return <Award className="h-4 w-4 text-[#cd7f32]" />
  return <span className="text-[#444] font-mono text-xs w-4 text-center">{rank}</span>
}

export function LeaderboardTable({ entries, currentUserId }: LeaderboardTableProps) {
  return (
    <div className="border border-[#1f1f1f]">
      {/* Header */}
      <div className="grid grid-cols-[48px_1fr_80px_80px] gap-4 px-4 py-2 border-b border-[#1f1f1f] bg-[#0a0a0a]">
        <span className="text-[10px] text-[#444] font-mono tracking-widest">#</span>
        <span className="text-[10px] text-[#444] font-mono tracking-widest">PLAYER</span>
        <span className="text-[10px] text-[#444] font-mono tracking-widest text-right">SOLVED</span>
        <span className="text-[10px] text-[#444] font-mono tracking-widest text-right">POINTS</span>
      </div>

      {/* Rows */}
      {entries.map((entry) => {
        const isCurrentUser = entry.id === currentUserId
        return (
          <div
            key={entry.id}
            className={cn(
              'grid grid-cols-[48px_1fr_80px_80px] gap-4 px-4 py-3 border-b border-[#0f0f0f] items-center transition-colors',
              isCurrentUser
                ? 'bg-[#00ff66]/5 border-l-2 border-[#00ff66]'
                : 'hover:bg-[#0f0f0f]'
            )}
          >
            <div className="flex justify-center">
              <RankIcon rank={entry.rank} />
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 bg-[#1f1f1f] border border-[#2a2a2a] flex items-center justify-center shrink-0">
                <span className="text-[10px] font-mono text-[#00ff66]">
                  {entry.username[0].toUpperCase()}
                </span>
              </div>
              <span
                className={cn(
                  'text-sm font-mono truncate',
                  isCurrentUser ? 'text-[#00ff66]' : 'text-[#e6e6e6]'
                )}
              >
                {entry.username}
                {isCurrentUser && (
                  <span className="ml-2 text-[10px] text-[#00ff66]/50">(you)</span>
                )}
              </span>
            </div>
            <span className="text-xs font-mono text-[#666] text-right">{entry.solvedCount}</span>
            <span
              className={cn(
                'text-sm font-mono text-right',
                entry.rank <= 3 ? 'text-[#ffa500]' : 'text-[#e6e6e6]'
              )}
            >
              {entry.points.toLocaleString()}
            </span>
          </div>
        )
      })}

      {entries.length === 0 && (
        <div className="py-12 text-center text-[#444] text-xs font-mono">
          No entries yet
        </div>
      )}
    </div>
  )
}
