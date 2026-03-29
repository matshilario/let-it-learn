"use client"

import { Suspense, useEffect, useCallback, useState, useRef } from "react"
import { useParams, useSearchParams } from "next/navigation"
import {
  Loader2,
  Clock,
  Lock,
  Trophy,
  Wifi,
  WifiOff,
  CheckCircle2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { QuestionRenderer } from "@/components/activity-player/question-renderer"
import { Leaderboard, type LeaderboardPlayer } from "@/components/session/leaderboard"
import { useWebSocket } from "@/lib/hooks/use-websocket"
import { submitAnswer } from "@/lib/api/play"
import type { Question } from "@/lib/types"
import { cn } from "@/lib/utils"

type LiveState =
  | "waiting"
  | "question"
  | "locked"
  | "between_questions"
  | "leaderboard"
  | "ended"

function LivePlayerContent() {
  const params = useParams<{ sessionId: string }>()
  const searchParams = useSearchParams()
  const studentSessionId = searchParams.get("ssid") || ""

  const [liveState, setLiveState] = useState<LiveState>("waiting")
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [questionIndex, setQuestionIndex] = useState(-1)
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [answer, setAnswer] = useState<unknown>(undefined)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [leaderboard, setLeaderboard] = useState<LeaderboardPlayer[]>([])
  const [myScore, setMyScore] = useState(0)
  const [myRank, setMyRank] = useState(0)
  const [nickname, setNickname] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("play_nickname") || "Aluno"
    }
    return "Aluno"
  })

  const questionStartTime = useRef(Date.now())

  const handleWsMessage = useCallback(
    (msg: Record<string, unknown>) => {
      const type = msg.type as string
      switch (type) {
        case "question_changed":
          setCurrentQuestion(msg.question as Question)
          setQuestionIndex(msg.question_index as number)
          if (typeof msg.total_questions === "number") {
            setTotalQuestions(msg.total_questions as number)
          }
          setAnswer(undefined)
          setSubmitted(false)
          setLiveState("question")
          questionStartTime.current = Date.now()
          break
        case "session_started":
          if (msg.question) {
            setCurrentQuestion(msg.question as Question)
            setQuestionIndex((msg.question_index as number) ?? 0)
            if (typeof msg.total_questions === "number") {
              setTotalQuestions(msg.total_questions as number)
            }
            setAnswer(undefined)
            setSubmitted(false)
            setLiveState("question")
            questionStartTime.current = Date.now()
          }
          break
        case "submissions_locked":
          if (!submitted) {
            setLiveState("locked")
          }
          break
        case "submissions_unlocked":
          if (!submitted && currentQuestion) {
            setLiveState("question")
          }
          break
        case "session_ended":
          setLiveState("ended")
          break
        case "leaderboard_update": {
          const players = msg.leaderboard as LeaderboardPlayer[] | undefined
          if (players) {
            setLeaderboard(players)
            const me = players.find(
              (p) => p.id === studentSessionId
            )
            if (me) {
              setMyScore(me.score)
              const sorted = [...players].sort((a, b) => b.score - a.score)
              const rank = sorted.findIndex((p) => p.id === studentSessionId)
              setMyRank(rank + 1)
            }
          }
          break
        }
        case "show_leaderboard": {
          const players = msg.leaderboard as LeaderboardPlayer[] | undefined
          if (players) {
            setLeaderboard(players)
            const me = players.find((p) => p.id === studentSessionId)
            if (me) {
              setMyScore(me.score)
              const sorted = [...players].sort((a, b) => b.score - a.score)
              const rank = sorted.findIndex((p) => p.id === studentSessionId)
              setMyRank(rank + 1)
            }
          }
          setLiveState("leaderboard")
          break
        }
        case "sync": {
          if (msg.status === "waiting") {
            setLiveState("waiting")
          } else if (msg.status === "ended") {
            setLiveState("ended")
          } else if (msg.question) {
            setCurrentQuestion(msg.question as Question)
            setQuestionIndex((msg.question_index as number) ?? 0)
            if (typeof msg.total_questions === "number") {
              setTotalQuestions(msg.total_questions as number)
            }
            setAnswer(undefined)
            setSubmitted(false)
            setLiveState(msg.is_locked ? "locked" : "question")
            questionStartTime.current = Date.now()
          }
          break
        }
        case "answer_result": {
          if (typeof msg.score === "number") {
            setMyScore(msg.score as number)
          }
          break
        }
      }
    },
    [studentSessionId, submitted, currentQuestion]
  )

  const { isConnected } = useWebSocket(params.sessionId, "student", {
    studentSessionId,
    onMessage: handleWsMessage,
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      setNickname(localStorage.getItem("play_nickname") || "Aluno")
    }
  }, [])

  const handleSubmit = async () => {
    if (!currentQuestion || answer === undefined || submitted) return
    try {
      setSubmitting(true)
      const timeSpent = Math.floor(
        (Date.now() - questionStartTime.current) / 1000
      )
      await submitAnswer(params.sessionId, studentSessionId, {
        question_id: currentQuestion.id,
        answer: { value: answer },
        time_spent_seconds: timeSpent,
      })
      setSubmitted(true)
    } catch {
      // Silently fail
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Status bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{nickname}</span>
          <Badge variant="secondary" className="tabular-nums">
            {myScore} pts
          </Badge>
          {myRank > 0 && (
            <Badge variant="outline" className="tabular-nums">
              #{myRank}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          {isConnected ? (
            <Wifi className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <WifiOff className="h-3.5 w-3.5 text-destructive" />
          )}
        </div>
      </div>

      {totalQuestions > 0 && questionIndex >= 0 && (
        <Progress
          value={((questionIndex + 1) / totalQuestions) * 100}
          className="h-1.5"
        />
      )}

      {/* Content based on state */}
      {liveState === "waiting" && (
        <Card className="mt-8">
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <Clock className="h-10 w-10 text-primary" />
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-6 w-6">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/40" />
                <span className="relative inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground" />
              </span>
            </div>
            <p className="text-xl font-semibold">Aguardando professor...</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              A sessao vai comecar em breve. Fique atento!
            </p>
          </CardContent>
        </Card>
      )}

      {liveState === "question" && currentQuestion && (
        <div className="space-y-4">
          {submitted ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                </div>
                <p className="text-lg font-semibold">Resposta enviada!</p>
                <p className="text-sm text-muted-foreground">
                  Aguardando o professor avancar para a proxima questao.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="min-h-[30vh]">
                <QuestionRenderer
                  question={currentQuestion}
                  answer={answer}
                  onAnswerChange={setAnswer}
                />
              </div>
              <Button
                className="h-12 w-full text-base"
                size="lg"
                onClick={handleSubmit}
                disabled={answer === undefined || submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar Resposta"
                )}
              </Button>
            </>
          )}
        </div>
      )}

      {liveState === "locked" && (
        <Card className="mt-8">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10">
              <Lock className="h-8 w-8 text-amber-500" />
            </div>
            <p className="text-lg font-semibold">Respostas travadas</p>
            <p className="text-sm text-muted-foreground">
              O professor travou as respostas. Aguarde...
            </p>
          </CardContent>
        </Card>
      )}

      {liveState === "between_questions" && (
        <Card className="mt-8">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-lg font-semibold">Proxima questao...</p>
          </CardContent>
        </Card>
      )}

      {liveState === "leaderboard" && (
        <div className="space-y-4 mt-4">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                Ranking
              </CardTitle>
            </CardHeader>
            <CardContent>
              {myRank > 0 && (
                <div className="mb-4 rounded-lg bg-primary/10 p-3 text-center">
                  <p className="text-sm text-muted-foreground">Sua posicao</p>
                  <p className="text-3xl font-bold">#{myRank}</p>
                  <p className="text-sm font-medium">{myScore} pontos</p>
                </div>
              )}
              <Leaderboard players={leaderboard} compact />
            </CardContent>
          </Card>
        </div>
      )}

      {liveState === "ended" && (
        <div className="space-y-4 mt-4">
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
              <Trophy className="h-12 w-12 text-amber-500" />
              <p className="text-xl font-bold">Sessao Encerrada!</p>
              <div className="rounded-lg bg-muted px-6 py-3">
                <p className="text-sm text-muted-foreground">Sua pontuacao</p>
                <p className="text-4xl font-bold">{myScore}</p>
              </div>
              {myRank > 0 && (
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-lg px-4 py-1",
                    myRank === 1 && "bg-amber-500/15 text-amber-600",
                    myRank === 2 && "bg-slate-400/15 text-slate-600",
                    myRank === 3 && "bg-orange-600/15 text-orange-700"
                  )}
                >
                  #{myRank} lugar
                </Badge>
              )}
            </CardContent>
          </Card>
          {leaderboard.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Trophy className="h-4 w-4" />
                  Ranking Final
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Leaderboard players={leaderboard} />
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

export default function LivePlayerPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      }
    >
      <LivePlayerContent />
    </Suspense>
  )
}
