"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import {
  Loader2,
  Trophy,
  Star,
  Flame,
  Zap,
  Timer,
  Award,
  Crown,
  Medal,
  Gem,
  Diamond,
  Rocket,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { getStudentProfile } from "@/lib/api/gamification"
import type { StudentProfile } from "@/lib/types"

const ICON_MAP: Record<string, typeof Trophy> = {
  trophy: Trophy,
  star: Star,
  flame: Flame,
  zap: Zap,
  timer: Timer,
  award: Award,
  crown: Crown,
  medal: Medal,
  gem: Gem,
  diamond: Diamond,
  rocket: Rocket,
}

const COLOR_MAP: Record<string, string> = {
  gold: "text-amber-500 bg-amber-500/10",
  silver: "text-slate-400 bg-slate-400/10",
  blue: "text-blue-500 bg-blue-500/10",
  green: "text-emerald-500 bg-emerald-500/10",
  orange: "text-orange-500 bg-orange-500/10",
  yellow: "text-yellow-500 bg-yellow-500/10",
  purple: "text-purple-500 bg-purple-500/10",
  red: "text-red-500 bg-red-500/10",
  emerald: "text-emerald-500 bg-emerald-500/10",
  cyan: "text-cyan-500 bg-cyan-500/10",
}

export default function StudentProfilePage() {
  const params = useParams<{ studentId: string }>()
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true)
        const data = await getStudentProfile(params.studentId)
        setProfile(data)
      } catch {
        setError("Nao foi possivel carregar o perfil.")
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [params.studentId])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Carregando perfil...</p>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <XCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-medium">
          {error || "Perfil nao encontrado"}
        </p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Tentar Novamente
        </Button>
      </div>
    )
  }

  const xpProgress =
    profile.xp_for_next_level > profile.xp_for_current_level
      ? ((profile.total_xp - profile.xp_for_current_level) /
          (profile.xp_for_next_level - profile.xp_for_current_level)) *
        100
      : 100

  return (
    <div className="flex flex-col gap-6 py-4">
      {/* Profile header */}
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-8">
          {/* Avatar */}
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <span className="text-3xl font-bold text-primary">
              {(profile.nickname || profile.full_name || "?")
                .charAt(0)
                .toUpperCase()}
            </span>
          </div>

          <div className="text-center">
            <h1 className="text-xl font-bold">
              {profile.nickname || profile.full_name || "Aluno"}
            </h1>
            {profile.email && (
              <p className="text-sm text-muted-foreground">{profile.email}</p>
            )}
          </div>

          {/* Level badge */}
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="bg-primary/15 text-primary text-lg px-4 py-1"
            >
              Nivel {profile.level}
            </Badge>
          </div>

          {/* XP progress */}
          <div className="w-full max-w-xs space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{profile.total_xp} XP</span>
              <span>{profile.xp_for_next_level} XP</span>
            </div>
            <Progress value={xpProgress} className="h-3" />
            <p className="text-center text-xs text-muted-foreground">
              {profile.xp_for_next_level - profile.total_xp} XP para o nivel{" "}
              {profile.level + 1}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="flex flex-col items-center gap-1 py-4">
            <Trophy className="h-5 w-5 text-amber-500" />
            <p className="text-2xl font-bold tabular-nums">
              {profile.total_score}
            </p>
            <p className="text-xs text-muted-foreground">Pontos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center gap-1 py-4">
            <Star className="h-5 w-5 text-primary" />
            <p className="text-2xl font-bold tabular-nums">
              {profile.sessions_completed}
            </p>
            <p className="text-xs text-muted-foreground">Atividades</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center gap-1 py-4">
            <Medal className="h-5 w-5 text-purple-500" />
            <p className="text-2xl font-bold tabular-nums">
              {profile.badges.length}
            </p>
            <p className="text-xs text-muted-foreground">Conquistas</p>
          </CardContent>
        </Card>
      </div>

      {/* Badges */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Conquistas
          </CardTitle>
          <CardDescription>
            {profile.badges.length > 0
              ? `${profile.badges.length} conquista${profile.badges.length !== 1 ? "s" : ""} desbloqueada${profile.badges.length !== 1 ? "s" : ""}`
              : "Complete atividades para desbloquear conquistas!"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {profile.badges.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {profile.badges.map((sb) => {
                const Icon = ICON_MAP[sb.badge.icon] || Trophy
                const colorClass =
                  COLOR_MAP[sb.badge.color] || "text-primary bg-primary/10"
                const [textColor, bgColor] = colorClass.split(" ")

                return (
                  <div
                    key={sb.id}
                    className="flex flex-col items-center gap-2 rounded-lg border p-4 text-center"
                  >
                    <div
                      className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-full",
                        bgColor
                      )}
                    >
                      <Icon className={cn("h-6 w-6", textColor)} />
                    </div>
                    <p className="text-xs font-semibold leading-tight">
                      {sb.badge.name}
                    </p>
                    {sb.badge.description && (
                      <p className="text-[10px] text-muted-foreground leading-tight">
                        {sb.badge.description}
                      </p>
                    )}
                    {sb.badge.xp_reward > 0 && (
                      <Badge variant="outline" className="text-[10px]">
                        +{sb.badge.xp_reward} XP
                      </Badge>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
              <Award className="h-10 w-10 opacity-30" />
              <p className="text-sm">Nenhuma conquista ainda</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
