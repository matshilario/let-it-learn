"use client"

import { Flame, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

interface StreakDisplayProps {
  streak: number
  multiplier: number
  totalPoints: number
  className?: string
}

export function StreakDisplay({
  streak,
  multiplier,
  totalPoints,
  className,
}: StreakDisplayProps) {
  if (streak < 1 && totalPoints === 0) return null

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {totalPoints > 0 && (
        <div className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
          <Zap className="h-3 w-3" />
          {totalPoints} pts
        </div>
      )}
      {streak >= 2 && (
        <div
          className={cn(
            "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold",
            streak >= 10
              ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
              : streak >= 5
                ? "bg-orange-500/15 text-orange-600 dark:text-orange-400"
                : "bg-red-500/10 text-red-600 dark:text-red-400"
          )}
        >
          <Flame className="h-3 w-3" />
          {streak}
          {multiplier > 1 && (
            <span className="ml-0.5 opacity-70">
              ({multiplier.toFixed(2)}x)
            </span>
          )}
        </div>
      )}
    </div>
  )
}
