"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Flag,
  Clock,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
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
import { Progress } from "@/components/ui/progress"
import { QuestionRenderer } from "@/components/activity-player/question-renderer"
import { PointsPopup } from "@/components/activity-player/points-popup"
import { StreakDisplay } from "@/components/activity-player/streak-display"
import { usePlayerStore } from "@/lib/stores/player-store"
import { useTimer } from "@/lib/hooks/use-timer"
import {
  startStudentSession,
  submitAnswer,
  completeSession,
  getActivityByCode,
  type AnswerResponse,
} from "@/lib/api/play"
import { cn } from "@/lib/utils"

export default function PlayerPage() {
  const params = useParams<{ shortCode: string; sessionId: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()

  const studentSessionId =
    searchParams.get("ssid") || localStorage.getItem("student_session_id") || ""

  const {
    questions,
    currentQuestionIndex,
    answers,
    submittedQuestions,
    setSession,
    setQuestions,
    goToQuestion,
    nextQuestion,
    prevQuestion,
    setAnswer,
    markSubmitted,
    reset,
  } = usePlayerStore()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [activityTitle, setActivityTitle] = useState("")
  const [timeLimit, setTimeLimit] = useState<number | null>(null)
  const questionStartTime = useRef(Date.now())

  // Gamification state
  const [streak, setStreak] = useState(0)
  const [streakMultiplier, setStreakMultiplier] = useState(1.0)
  const [totalPoints, setTotalPoints] = useState(0)
  const [lastAnswer, setLastAnswer] = useState<AnswerResponse | null>(null)
  const [showPointsPopup, setShowPointsPopup] = useState(false)

  const handleExpire = useCallback(async () => {
    try {
      setCompleting(true)

      const currentQ = questions[currentQuestionIndex]
      if (currentQ && answers[currentQ.id] !== undefined && !submittedQuestions.has(currentQ.id)) {
        const timeSpent = Math.floor((Date.now() - questionStartTime.current) / 1000)
        await submitAnswer(params.sessionId, studentSessionId, {
          question_id: currentQ.id,
          answer: { value: answers[currentQ.id] },
          time_spent_seconds: timeSpent,
        })
      }

      await completeSession(params.sessionId, studentSessionId)
      router.push(
        `/play/${params.shortCode}/session/${params.sessionId}/results?ssid=${studentSessionId}`
      )
    } catch {
      setError("Erro ao finalizar. Tente novamente.")
      setCompleting(false)
    }
  }, [
    questions,
    currentQuestionIndex,
    answers,
    submittedQuestions,
    params.sessionId,
    params.shortCode,
    studentSessionId,
    router,
  ])

  const { timeRemaining, start: startTimer } = useTimer({
    initialSeconds: timeLimit || 0,
    onExpire: handleExpire,
  })

  useEffect(() => {
    async function init() {
      try {
        setLoading(true)
        reset()
        setSession(params.sessionId, studentSessionId)

        const activityInfo = await getActivityByCode(params.shortCode)
        setActivityTitle(activityInfo.activity.title)

        if (activityInfo.activity.time_limit_seconds) {
          setTimeLimit(activityInfo.activity.time_limit_seconds)
        }

        const result = await startStudentSession(
          params.sessionId,
          studentSessionId
        )
        setQuestions(result.questions)
      } catch {
        setError("Erro ao carregar atividade. Verifique o link e tente novamente.")
      } finally {
        setLoading(false)
      }
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!loading && timeLimit && questions.length > 0) {
      startTimer()
    }
  }, [loading, timeLimit, questions.length, startTimer])

  useEffect(() => {
    questionStartTime.current = Date.now()
  }, [currentQuestionIndex])

  const currentQuestion = questions[currentQuestionIndex]
  const currentAnswer = currentQuestion
    ? answers[currentQuestion.id]
    : undefined
  const isLastQuestion = currentQuestionIndex === questions.length - 1
  const answeredCount = Object.keys(answers).filter(
    (qId) => answers[qId] !== undefined
  ).length
  const unansweredCount = questions.length - answeredCount

  const handleAnswerChange = (value: unknown) => {
    if (currentQuestion) {
      setAnswer(currentQuestion.id, value)
    }
  }

  const handleSubmitAndNavigate = async (direction: "next" | "prev") => {
    if (!currentQuestion) return

    if (
      currentAnswer !== undefined &&
      !submittedQuestions.has(currentQuestion.id)
    ) {
      try {
        setSubmitting(true)
        const timeSpent = Math.floor(
          (Date.now() - questionStartTime.current) / 1000
        )
        const result = await submitAnswer(params.sessionId, studentSessionId, {
          question_id: currentQuestion.id,
          answer: { value: currentAnswer },
          time_spent_seconds: timeSpent,
        })
        markSubmitted(currentQuestion.id)

        // Update gamification state
        setLastAnswer(result)
        setTotalPoints((p) => p + result.points_earned)
        setStreak(result.streak_count)
        setStreakMultiplier(result.streak_multiplier)
        setShowPointsPopup(true)
      } catch {
        // Silently fail - answer will be resubmitted
      } finally {
        setSubmitting(false)
      }
    }

    if (direction === "next") {
      nextQuestion()
    } else {
      prevQuestion()
    }
  }

  const handleComplete = async () => {
    try {
      setCompleting(true)

      if (
        currentQuestion &&
        currentAnswer !== undefined &&
        !submittedQuestions.has(currentQuestion.id)
      ) {
        const timeSpent = Math.floor(
          (Date.now() - questionStartTime.current) / 1000
        )
        await submitAnswer(params.sessionId, studentSessionId, {
          question_id: currentQuestion.id,
          answer: { value: currentAnswer },
          time_spent_seconds: timeSpent,
        })
      }

      await completeSession(params.sessionId, studentSessionId)
      router.push(
        `/play/${params.shortCode}/session/${params.sessionId}/results?ssid=${studentSessionId}`
      )
    } catch {
      setError("Erro ao finalizar. Tente novamente.")
      setCompleting(false)
    }
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Carregando questoes...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-medium">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Tentar Novamente
        </Button>
      </div>
    )
  }

  if (!currentQuestion) return null

  return (
    <div className="flex flex-col gap-4">
      {/* Points popup overlay */}
      {lastAnswer && (
        <PointsPopup
          pointsEarned={lastAnswer.points_earned}
          timeBonus={lastAnswer.time_bonus}
          streakMultiplier={lastAnswer.streak_multiplier}
          streakCount={lastAnswer.streak_count}
          xpEarned={lastAnswer.xp_earned}
          isCorrect={lastAnswer.is_correct}
          show={showPointsPopup}
          onDone={() => setShowPointsPopup(false)}
        />
      )}

      {/* Top bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="truncate text-sm font-medium text-muted-foreground">
              {activityTitle}
            </h1>
            <StreakDisplay
              streak={streak}
              multiplier={streakMultiplier}
              totalPoints={totalPoints}
            />
          </div>
          {timeLimit !== null && timeRemaining !== undefined && (
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-mono font-bold",
                timeRemaining <= 10
                  ? "animate-pulse bg-red-500/10 text-red-500"
                  : timeRemaining <= 30
                    ? "bg-amber-500/10 text-amber-500"
                    : "bg-muted text-muted-foreground"
              )}
            >
              <Clock className="h-3.5 w-3.5" />
              {formatTime(timeRemaining)}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Progress
            value={((currentQuestionIndex + 1) / questions.length) * 100}
            className="flex-1"
          />
          <span className="shrink-0 text-xs font-medium text-muted-foreground">
            {currentQuestionIndex + 1}/{questions.length}
          </span>
        </div>

        {/* Question dots */}
        <div className="flex flex-wrap gap-1.5">
          {questions.map((q, i) => (
            <button
              key={q.id}
              type="button"
              onClick={() => goToQuestion(i)}
              className={cn(
                "h-2.5 w-2.5 rounded-full transition-all",
                i === currentQuestionIndex
                  ? "scale-125 bg-primary"
                  : answers[q.id] !== undefined
                    ? "bg-primary/40"
                    : "bg-muted-foreground/20"
              )}
              title={`Questao ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Question */}
      <div className="min-h-[40vh] py-4">
        <QuestionRenderer
          question={currentQuestion}
          answer={currentAnswer}
          onAnswerChange={handleAnswerChange}
        />
        {currentQuestion.hint && (
          <p className="mt-4 rounded-lg bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
            Dica: {currentQuestion.hint}
          </p>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between border-t pt-4">
        <Button
          variant="outline"
          onClick={() => handleSubmitAndNavigate("prev")}
          disabled={currentQuestionIndex === 0 || submitting}
          className="gap-1.5"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Anterior</span>
        </Button>

        <Dialog>
          <DialogTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-destructive hover:text-destructive"
              />
            }
          >
            <Flag className="h-4 w-4" />
            Finalizar
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Finalizar Atividade?</DialogTitle>
              <DialogDescription>
                {unansweredCount > 0
                  ? `Voce ainda tem ${unansweredCount} ${unansweredCount === 1 ? "questao" : "questoes"} sem responder. Tem certeza que deseja finalizar?`
                  : "Todas as questoes foram respondidas. Deseja finalizar a atividade?"}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose
                render={<Button variant="outline" />}
              >
                Continuar Respondendo
              </DialogClose>
              <Button onClick={handleComplete} disabled={completing}>
                {completing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Finalizando...
                  </>
                ) : (
                  "Finalizar"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {isLastQuestion ? (
          <Dialog>
            <DialogTrigger
              render={
                <Button className="gap-1.5" disabled={submitting} />
              }
            >
              <Flag className="h-4 w-4" />
              Finalizar
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Finalizar Atividade?</DialogTitle>
                <DialogDescription>
                  {unansweredCount > 0
                    ? `Voce ainda tem ${unansweredCount} ${unansweredCount === 1 ? "questao" : "questoes"} sem responder. Tem certeza que deseja finalizar?`
                    : "Todas as questoes foram respondidas. Deseja finalizar a atividade?"}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose
                  render={<Button variant="outline" />}
                >
                  Continuar Respondendo
                </DialogClose>
                <Button onClick={handleComplete} disabled={completing}>
                  {completing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Finalizando...
                    </>
                  ) : (
                    "Finalizar"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : (
          <Button
            onClick={() => handleSubmitAndNavigate("next")}
            disabled={submitting}
            className="gap-1.5"
          >
            <span className="hidden sm:inline">Proximo</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
