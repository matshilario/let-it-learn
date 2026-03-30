"use client"

import { useEffect, useState } from "react"
import { Flame, Zap, Timer } from "lucide-react"
import { cn } from "@/lib/utils"

interface PointsPopupProps {
  pointsEarned: number
  timeBonus: number
  streakMultiplier: number
  streakCount: number
  xpEarned: number
  isCorrect: boolean | null
  show: boolean
  onDone: () => void
}

export function PointsPopup({
  pointsEarned,
  timeBonus,
  streakMultiplier,
  streakCount,
  xpEarned,
  isCorrect,
  show,
  onDone,
}: PointsPopupProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (show) {
      setVisible(true)
      const timer = setTimeout(() => {
        setVisible(false)
        onDone()
      }, 2500)
      return () => clearTimeout(timer)
    }
  }, [show, onDone])

  if (!visible) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
      <div
        className={cn(
          "animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300",
          "flex flex-col items-center gap-2 rounded-2xl px-8 py-6 shadow-2xl",
          isCorrect
            ? "bg-emerald-500/95 text-white"
            : "bg-red-500/95 text-white"
        )}
      >
        {/* Main points */}
        <p className="text-5xl font-black tabular-nums">
          {isCorrect ? `+${pointsEarned}` : "0"}
        </p>

        {/* Bonuses */}
        {isCorrect && (timeBonus > 0 || streakMultiplier > 1) && (
          <div className="flex items-center gap-3">
            {timeBonus > 0 && (
              <div className="flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold">
                <Timer className="h-3 w-3" />
                +{timeBonus} bonus
              </div>
            )}
            {streakMultiplier > 1 && (
              <div className="flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold">
                <Zap className="h-3 w-3" />
                {streakMultiplier.toFixed(2)}x
              </div>
            )}
          </div>
        )}

        {/* Streak */}
        {isCorrect && streakCount >= 2 && (
          <div className="flex items-center gap-1.5 text-sm font-bold">
            <Flame className="h-4 w-4 text-amber-300" />
            <span>Sequencia de {streakCount}!</span>
          </div>
        )}

        {/* XP */}
        {xpEarned > 0 && (
          <p className="text-xs font-medium opacity-80">+{xpEarned} XP</p>
        )}
      </div>
    </div>
  )
}
