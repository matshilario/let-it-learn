"use client"

import { Trophy, Medal } from "lucide-react"
import { cn } from "@/lib/utils"

export interface LeaderboardPlayer {
  id: string
  nickname: string
  score: number
  questions_answered: number
}

interface LeaderboardProps {
  players: LeaderboardPlayer[]
  className?: string
  compact?: boolean
}

const podiumColors: Record<number, string> = {
  0: "bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400",
  1: "bg-slate-400/15 border-slate-400/30 text-slate-600 dark:text-slate-300",
  2: "bg-orange-600/15 border-orange-600/30 text-orange-700 dark:text-orange-400",
}

const rankBadgeColors: Record<number, string> = {
  0: "bg-amber-500 text-white",
  1: "bg-slate-400 text-white",
  2: "bg-orange-600 text-white",
}

export function Leaderboard({ players, className, compact }: LeaderboardProps) {
  const sorted = [...players].sort((a, b) => b.score - a.score)

  if (sorted.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-8 text-muted-foreground", className)}>
        <Trophy className="mb-2 h-8 w-8 opacity-40" />
        <p className="text-sm">Nenhum participante ainda</p>
      </div>
    )
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      {sorted.map((player, index) => {
        const isPodium = index < 3
        return (
          <div
            key={player.id}
            className={cn(
              "flex items-center gap-3 rounded-lg border px-3 py-2 transition-all",
              isPodium
                ? podiumColors[index]
                : "border-transparent hover:bg-muted/50"
            )}
          >
            {/* Rank */}
            <div
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                isPodium
                  ? rankBadgeColors[index]
                  : "bg-muted text-muted-foreground"
              )}
            >
              {index + 1}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <p className={cn("truncate text-sm font-medium", isPodium && "font-semibold")}>
                {isPodium && index === 0 && <Medal className="mr-1 inline h-3.5 w-3.5" />}
                {player.nickname}
              </p>
              {!compact && (
                <p className="text-xs text-muted-foreground">
                  {player.questions_answered} {player.questions_answered === 1 ? "resposta" : "respostas"}
                </p>
              )}
            </div>

            {/* Score */}
            <span className={cn("shrink-0 text-sm font-bold tabular-nums", isPodium && "text-base")}>
              {player.score}
            </span>
          </div>
        )
      })}
    </div>
  )
}
