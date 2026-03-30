"use client"

import { useEffect, useState } from "react"
import { Trophy, Medal, Award } from "lucide-react"
import { cn } from "@/lib/utils"

interface PodiumPlayer {
  id: string
  nickname: string
  score: number
}

interface AnimatedPodiumProps {
  players: PodiumPlayer[]
}

const podiumConfig = [
  {
    place: 2,
    height: "h-24",
    icon: Medal,
    color: "text-slate-400",
    bg: "bg-slate-400/15",
    border: "border-slate-400/30",
    label: "2o",
    delay: "delay-300",
  },
  {
    place: 1,
    height: "h-36",
    icon: Trophy,
    color: "text-amber-500",
    bg: "bg-amber-500/15",
    border: "border-amber-500/30",
    label: "1o",
    delay: "delay-500",
  },
  {
    place: 3,
    height: "h-16",
    icon: Award,
    color: "text-orange-600",
    bg: "bg-orange-600/15",
    border: "border-orange-600/30",
    label: "3o",
    delay: "delay-100",
  },
]

export function AnimatedPodium({ players }: AnimatedPodiumProps) {
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setRevealed(true), 200)
    return () => clearTimeout(timer)
  }, [])

  const sorted = [...players].sort((a, b) => b.score - a.score)
  const top3 = sorted.slice(0, 3)

  // Reorder for podium display: 2nd, 1st, 3rd
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean)

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Players above podium */}
      <div className="flex items-end justify-center gap-4 w-full">
        {podiumOrder.map((player, i) => {
          if (!player) return null
          const config = podiumConfig[i]
          const Icon = config.icon

          return (
            <div
              key={player.id}
              className={cn(
                "flex flex-col items-center gap-2 transition-all duration-700",
                revealed
                  ? "translate-y-0 opacity-100"
                  : "translate-y-8 opacity-0",
                config.delay
              )}
            >
              {/* Avatar/Icon */}
              <div
                className={cn(
                  "flex h-14 w-14 items-center justify-center rounded-full border-2",
                  config.bg,
                  config.border,
                  config.place === 1 && "h-16 w-16"
                )}
              >
                <Icon className={cn("h-7 w-7", config.color)} />
              </div>

              {/* Name */}
              <p
                className={cn(
                  "max-w-[100px] truncate text-center text-sm font-semibold",
                  config.place === 1 && "text-base"
                )}
              >
                {player.nickname}
              </p>

              {/* Score */}
              <p
                className={cn(
                  "text-xs font-bold tabular-nums",
                  config.color
                )}
              >
                {player.score} pts
              </p>
            </div>
          )
        })}
      </div>

      {/* Podium bars */}
      <div className="flex items-end justify-center gap-2 w-full">
        {podiumOrder.map((player, i) => {
          if (!player) return null
          const config = podiumConfig[i]

          return (
            <div
              key={`bar-${player.id}`}
              className={cn(
                "flex w-24 items-center justify-center rounded-t-lg border-x border-t transition-all duration-700",
                config.bg,
                config.border,
                revealed ? config.height : "h-0",
                config.delay
              )}
            >
              <span
                className={cn(
                  "text-2xl font-black transition-opacity duration-300",
                  config.color,
                  revealed ? "opacity-100" : "opacity-0"
                )}
              >
                {config.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
