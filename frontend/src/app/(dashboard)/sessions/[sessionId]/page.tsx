"use client"

import { useEffect, useCallback, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { QRCodeSVG } from "qrcode.react"
import {
  Radio,
  Users,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Play,
  Lock,
  Unlock,
  Square,
  Loader2,
  AlertTriangle,
  Wifi,
  WifiOff,
  Trophy,
  BarChart3,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Leaderboard } from "@/components/session/leaderboard"
import { useSession as useSessionData } from "@/lib/hooks/use-sessions"
import {
  useStartLiveSession,
  useNextQuestion,
  usePrevQuestion,
  useLockSubmissions,
  useUnlockSubmissions,
  useEndSession,
} from "@/lib/hooks/use-sessions"
import { useWebSocket } from "@/lib/hooks/use-websocket"
import { useSessionStore } from "@/lib/stores/session-store"
import type { Question } from "@/lib/types"
import { cn } from "@/lib/utils"

const statusLabels: Record<string, string> = {
  waiting: "Aguardando",
  active: "Ativa",
  paused: "Pausada",
  ended: "Encerrada",
}

const statusColors: Record<string, string> = {
  waiting: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  active: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  paused: "bg-slate-500/15 text-slate-600 dark:text-slate-400",
  ended: "bg-red-500/15 text-red-600 dark:text-red-400",
}

export default function SessionMonitorPage() {
  const params = useParams<{ sessionId: string }>()
  const router = useRouter()
  const [copiedCode, setCopiedCode] = useState(false)

  const { data: session, isLoading, error } = useSessionData(params.sessionId)

  const store = useSessionStore()
  const startLive = useStartLiveSession()
  const nextQ = useNextQuestion()
  const prevQ = usePrevQuestion()
  const lockSub = useLockSubmissions()
  const unlockSub = useUnlockSubmissions()
  const endSess = useEndSession()

  const handleWsMessage = useCallback(
    (msg: Record<string, unknown>) => {
      const type = msg.type as string
      switch (type) {
        case "participant_joined":
          store.addParticipant({
            id: msg.student_session_id as string,
            nickname: msg.nickname as string,
            score: 0,
            questions_answered: 0,
          })
          break
        case "participant_left":
          store.removeParticipant(msg.student_session_id as string)
          break
        case "answer_received":
          store.setResponseStats({
            total: store.responseStats.total,
            answered: (msg.answered_count as number) ?? store.responseStats.answered + 1,
          })
          if (msg.student_session_id && typeof msg.score === "number") {
            store.updateParticipant(msg.student_session_id as string, {
              score: msg.score as number,
              questions_answered: (msg.questions_answered as number) ?? 0,
            })
          }
          break
        case "question_changed":
          store.setCurrentQuestionIndex(msg.question_index as number)
          if (msg.question) {
            store.setCurrentQuestion(msg.question as Question)
          }
          store.setResponseStats({ total: store.responseStats.total, answered: 0 })
          break
        case "session_started":
          store.setStatus("active")
          if (typeof msg.question_index === "number") {
            store.setCurrentQuestionIndex(msg.question_index as number)
          }
          if (msg.question) {
            store.setCurrentQuestion(msg.question as Question)
          }
          break
        case "session_ended":
          store.setStatus("ended")
          break
        case "submissions_locked":
          store.setIsLocked(true)
          break
        case "submissions_unlocked":
          store.setIsLocked(false)
          break
        case "sync": {
          if (msg.participants) {
            const parts = msg.participants as Array<{
              id: string
              nickname: string
              score: number
              questions_answered: number
            }>
            store.setParticipants(parts)
          }
          if (typeof msg.question_index === "number") {
            store.setCurrentQuestionIndex(msg.question_index as number)
          }
          if (typeof msg.total_questions === "number") {
            store.setTotalQuestions(msg.total_questions as number)
          }
          if (msg.question) {
            store.setCurrentQuestion(msg.question as Question)
          }
          if (typeof msg.is_locked === "boolean") {
            store.setIsLocked(msg.is_locked as boolean)
          }
          if (msg.status) {
            store.setStatus(msg.status as string)
          }
          if (msg.response_stats) {
            store.setResponseStats(msg.response_stats as { total: number; answered: number })
          }
          break
        }
        case "leaderboard_update": {
          if (msg.participants) {
            const parts = msg.participants as Array<{
              id: string
              nickname: string
              score: number
              questions_answered: number
            }>
            store.setParticipants(parts)
          }
          break
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const { isConnected } = useWebSocket(params.sessionId, "teacher", {
    onMessage: handleWsMessage,
  })

  useEffect(() => {
    if (session) {
      store.setSessionId(session.id)
      store.setStatus(session.status)
    }
    return () => {
      store.reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id, session?.status])

  const handleCopyCode = () => {
    if (session?.join_code) {
      navigator.clipboard.writeText(session.join_code)
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    }
  }

  const handleStart = async () => {
    try {
      await startLive.mutateAsync(params.sessionId)
      store.setStatus("active")
      store.setCurrentQuestionIndex(0)
    } catch {
      // Handled
    }
  }

  const handleNext = async () => {
    try {
      await nextQ.mutateAsync(params.sessionId)
    } catch {
      // Handled
    }
  }

  const handlePrev = async () => {
    try {
      await prevQ.mutateAsync(params.sessionId)
    } catch {
      // Handled
    }
  }

  const handleToggleLock = async () => {
    try {
      if (store.isLocked) {
        await unlockSub.mutateAsync(params.sessionId)
        store.setIsLocked(false)
      } else {
        await lockSub.mutateAsync(params.sessionId)
        store.setIsLocked(true)
      }
    } catch {
      // Handled
    }
  }

  const handleEnd = async () => {
    try {
      await endSess.mutateAsync(params.sessionId)
      store.setStatus("ended")
    } catch {
      // Handled
    }
  }

  const currentStatus = store.status || session?.status || "waiting"
  const joinUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/join?code=${session?.join_code || ""}`
      : ""

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="flex flex-col items-center gap-4 py-20">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-medium">Sessao nao encontrada</p>
        <Button variant="outline" onClick={() => router.push("/sessions")}>
          Voltar para Sessoes
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Status Bar */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border bg-card p-4">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium",
              statusColors[currentStatus]
            )}
          >
            {currentStatus === "active" && (
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
            )}
            {statusLabels[currentStatus] || currentStatus}
          </div>
        </div>

        {session.join_code && (
          <button
            type="button"
            onClick={handleCopyCode}
            className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2 font-mono text-lg font-bold tracking-[0.2em] transition-colors hover:bg-muted/80"
          >
            {session.join_code}
            {copiedCode ? (
              <Check className="h-4 w-4 text-emerald-500" />
            ) : (
              <Copy className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        )}

        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span className="font-medium">{store.participants.length}</span>
          <span>participante{store.participants.length !== 1 ? "s" : ""}</span>
        </div>

        <div className="flex items-center gap-1.5 text-sm">
          {isConnected ? (
            <Wifi className="h-4 w-4 text-emerald-500" />
          ) : (
            <WifiOff className="h-4 w-4 text-destructive" />
          )}
          <span className={isConnected ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}>
            {isConnected ? "Conectado" : "Desconectado"}
          </span>
        </div>

        {store.currentQuestionIndex >= 0 && store.totalQuestions > 0 && (
          <Badge variant="secondary">
            Questao {store.currentQuestionIndex + 1} de {store.totalQuestions}
          </Badge>
        )}
      </div>

      {/* Main content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Question + Stats */}
        <div className="space-y-4 lg:col-span-2">
          {/* Current question display */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-4 w-4" />
                Questao Atual
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentStatus === "waiting" ? (
                <div className="flex flex-col items-center gap-4 py-8 text-center">
                  <div className="rounded-full bg-amber-500/10 p-4">
                    <Radio className="h-8 w-8 text-amber-500" />
                  </div>
                  <p className="text-lg font-medium">
                    Aguardando alunos entrarem...
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Clique em &quot;Iniciar&quot; quando estiver pronto para comecar.
                  </p>
                </div>
              ) : currentStatus === "ended" ? (
                <div className="flex flex-col items-center gap-4 py-8 text-center">
                  <div className="rounded-full bg-muted p-4">
                    <Square className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-lg font-medium">Sessao encerrada</p>
                </div>
              ) : store.currentQuestion ? (
                <div className="space-y-4">
                  <div className="rounded-lg bg-muted/50 p-4">
                    <p className="text-base font-medium">
                      {(store.currentQuestion.content as Record<string, string>).text ||
                        JSON.stringify(store.currentQuestion.content)}
                    </p>
                  </div>
                  {store.currentQuestion.options &&
                    store.currentQuestion.options.length > 0 && (
                      <div className="space-y-2">
                        {store.currentQuestion.options.map((opt, i) => (
                          <div
                            key={opt.id}
                            className="flex items-center gap-3 rounded-lg border px-3 py-2"
                          >
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                              {String.fromCharCode(65 + i)}
                            </span>
                            <span className="text-sm">{opt.content}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  {/* Response stats */}
                  <div className="flex items-center gap-4 rounded-lg border bg-muted/30 p-3">
                    <div className="text-sm">
                      <span className="font-bold text-lg">
                        {store.responseStats.answered}
                      </span>
                      <span className="text-muted-foreground">
                        /{store.participants.length} responderam
                      </span>
                    </div>
                    {store.participants.length > 0 && (
                      <div className="flex-1">
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-500"
                            style={{
                              width: `${
                                store.participants.length > 0
                                  ? (store.responseStats.answered /
                                      store.participants.length) *
                                    100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <p className="text-sm">Carregando questao...</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* QR Code */}
          {session.join_code && currentStatus !== "ended" && (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-6">
                <p className="text-sm font-medium text-muted-foreground">
                  Escaneie para entrar
                </p>
                <div className="rounded-xl bg-white p-3">
                  <QRCodeSVG value={joinUrl} size={160} />
                </div>
                <p className="text-xs text-muted-foreground break-all max-w-xs text-center">
                  {joinUrl}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Participants + Leaderboard */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Trophy className="h-4 w-4" />
                Ranking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Leaderboard
                players={store.participants.map((p) => ({
                  id: p.id,
                  nickname: p.nickname,
                  score: p.score,
                  questions_answered: p.questions_answered,
                }))}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Control Bar */}
      {currentStatus !== "ended" && (
        <div className="sticky bottom-0 -mx-6 -mb-6 border-t bg-background/95 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {currentStatus === "waiting" ? (
                <Button
                  onClick={handleStart}
                  disabled={startLive.isPending}
                  className="gap-2"
                >
                  {startLive.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  Iniciar
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={handlePrev}
                    disabled={
                      prevQ.isPending || store.currentQuestionIndex <= 0
                    }
                    className="gap-1.5"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  <Button
                    onClick={handleNext}
                    disabled={
                      nextQ.isPending ||
                      (store.totalQuestions > 0 &&
                        store.currentQuestionIndex >=
                          store.totalQuestions - 1)
                    }
                    className="gap-1.5"
                  >
                    Proximo
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              {currentStatus === "active" && (
                <Button
                  variant={store.isLocked ? "outline" : "secondary"}
                  onClick={handleToggleLock}
                  disabled={lockSub.isPending || unlockSub.isPending}
                  className="gap-1.5"
                >
                  {store.isLocked ? (
                    <>
                      <Unlock className="h-4 w-4" />
                      Destravar
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" />
                      Travar Respostas
                    </>
                  )}
                </Button>
              )}

              <Dialog>
                <DialogTrigger
                  render={
                    <Button variant="destructive" className="gap-1.5" />
                  }
                >
                  <Square className="h-4 w-4" />
                  Encerrar Sessao
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Encerrar Sessao?</DialogTitle>
                    <DialogDescription>
                      Ao encerrar, os alunos nao poderao mais enviar respostas.
                      Esta acao nao pode ser desfeita.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose render={<Button variant="outline" />}>
                      Cancelar
                    </DialogClose>
                    <Button
                      variant="destructive"
                      onClick={handleEnd}
                      disabled={endSess.isPending}
                    >
                      {endSess.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Encerrando...
                        </>
                      ) : (
                        "Encerrar"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
