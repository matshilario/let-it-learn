"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  GraduationCap,
  Clock,
  HelpCircle,
  Loader2,
  AlertCircle,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  getActivityByCode,
  joinSession,
  type PlayActivityInfo,
} from "@/lib/api/play"

export default function PlayEntryPage() {
  const params = useParams<{ shortCode: string }>()
  const router = useRouter()
  const [activityInfo, setActivityInfo] = useState<PlayActivityInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nickname, setNickname] = useState("")
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    async function fetchActivity() {
      try {
        setLoading(true)
        const info = await getActivityByCode(params.shortCode)
        setActivityInfo(info)
      } catch {
        setError("Atividade nao encontrada ou indisponivel.")
      } finally {
        setLoading(false)
      }
    }
    fetchActivity()
  }, [params.shortCode])

  const getAnonymousId = () => {
    let id = localStorage.getItem("anonymous_id")
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem("anonymous_id", id)
    }
    return id
  }

  const handleJoin = async () => {
    if (!activityInfo) return
    if (!nickname.trim()) return

    try {
      setJoining(true)
      const anonymousId = getAnonymousId()
      const result = await joinSession({
        join_code: activityInfo.activity.short_code,
        nickname: nickname.trim(),
        anonymous_id: anonymousId,
      })

      localStorage.setItem("student_session_id", result.student_session_id)
      localStorage.setItem("play_nickname", nickname.trim())

      router.push(
        `/play/${params.shortCode}/session/${result.session_id}?ssid=${result.student_session_id}`
      )
    } catch {
      setError("Nao foi possivel entrar na atividade. Tente novamente.")
    } finally {
      setJoining(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Carregando atividade...</p>
      </div>
    )
  }

  if (error && !activityInfo) {
    return (
      <Card className="mt-8">
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <p className="text-center text-lg font-medium">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!activityInfo) return null

  const { activity, questions } = activityInfo
  const questionCount = questions.length
  const timeLimit = activity.time_limit_seconds

  return (
    <div className="flex flex-col gap-6 py-4">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <GraduationCap className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-xl">{activity.title}</CardTitle>
          {activity.description && (
            <CardDescription className="mt-1">
              {activity.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <HelpCircle className="h-4 w-4" />
              <span>
                {questionCount} {questionCount === 1 ? "questao" : "questoes"}
              </span>
            </div>
            {timeLimit && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>
                  {Math.floor(timeLimit / 60)} min
                  {timeLimit % 60 > 0 ? ` ${timeLimit % 60}s` : ""}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" />
            Identificacao
          </CardTitle>
          <CardDescription>
            Insira seu nome para comecar a atividade
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="nickname">Seu Nome ou Apelido</Label>
            <Input
              id="nickname"
              placeholder="Ex: Maria, Joao..."
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && nickname.trim()) handleJoin()
              }}
              autoFocus
              className="h-12 text-base"
            />
          </div>
          <Button
            className="h-12 w-full text-base"
            size="lg"
            onClick={handleJoin}
            disabled={!nickname.trim() || joining}
          >
            {joining ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Entrando...
              </>
            ) : (
              "Comecar"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
