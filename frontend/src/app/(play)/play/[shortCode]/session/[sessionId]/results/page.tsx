"use client"

import { useEffect, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import {
  Loader2,
  Trophy,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Home,
  Share2,
  PartyPopper,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { getResults, type ResultsResponse } from "@/lib/api/play"

export default function ResultsPage() {
  const params = useParams<{ shortCode: string; sessionId: string }>()
  const searchParams = useSearchParams()
  const studentSessionId =
    searchParams.get("ssid") || localStorage.getItem("student_session_id") || ""

  const [results, setResults] = useState<ResultsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    async function fetchResults() {
      try {
        setLoading(true)
        const data = await getResults(params.sessionId, studentSessionId)
        setResults(data)

        const percentage =
          data.student_session.max_score > 0
            ? (data.student_session.score / data.student_session.max_score) *
              100
            : 0
        if (percentage >= 80) {
          setShowConfetti(true)
          setTimeout(() => setShowConfetti(false), 5000)
        }
      } catch {
        setError("Nao foi possivel carregar os resultados.")
      } finally {
        setLoading(false)
      }
    }
    fetchResults()
  }, [params.sessionId, studentSessionId])

  const handleShare = async () => {
    if (!results) return
    const percentage =
      results.student_session.max_score > 0
        ? Math.round(
            (results.student_session.score /
              results.student_session.max_score) *
              100
          )
        : 0
    const text = `Fiz ${percentage}% na atividade! Tente tambem: ${window.location.origin}/play/${params.shortCode}`

    if (navigator.share) {
      try {
        await navigator.share({ text })
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(text)
    }
  }

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return s > 0 ? `${m}min ${s}s` : `${m}min`
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Carregando resultados...</p>
      </div>
    )
  }

  if (error || !results) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <XCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-medium">
          {error || "Resultados nao encontrados"}
        </p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Tentar Novamente
        </Button>
      </div>
    )
  }

  const { student_session, responses, questions } = results
  const score = student_session.score
  const maxScore = student_session.max_score
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
  const timeSpent = student_session.time_spent_seconds

  const scoreColor =
    percentage >= 80
      ? "text-green-500"
      : percentage >= 50
        ? "text-amber-500"
        : "text-red-500"

  const scoreBg =
    percentage >= 80
      ? "bg-green-500/10"
      : percentage >= 50
        ? "bg-amber-500/10"
        : "bg-red-500/10"

  return (
    <div className="flex flex-col gap-6 py-4">
      {/* Confetti overlay */}
      {showConfetti && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
          <div className="animate-bounce">
            <PartyPopper className="h-24 w-24 text-amber-500 opacity-50" />
          </div>
        </div>
      )}

      {/* Score card */}
      <Card>
        <CardContent className="flex flex-col items-center gap-6 py-8">
          <div
            className={cn(
              "flex h-32 w-32 items-center justify-center rounded-full",
              scoreBg
            )}
          >
            <div className="text-center">
              <p className={cn("text-4xl font-bold", scoreColor)}>
                {percentage}%
              </p>
              <p className="text-xs text-muted-foreground">
                {score}/{maxScore} pts
              </p>
            </div>
          </div>

          <div className="text-center">
            {percentage >= 80 ? (
              <>
                <Trophy className="mx-auto mb-2 h-8 w-8 text-amber-500" />
                <h2 className="text-xl font-bold">Excelente!</h2>
                <p className="text-muted-foreground">
                  Voce arrasou nessa atividade!
                </p>
              </>
            ) : percentage >= 50 ? (
              <>
                <h2 className="text-xl font-bold">Bom trabalho!</h2>
                <p className="text-muted-foreground">
                  Continue praticando para melhorar!
                </p>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold">Continue tentando!</h2>
                <p className="text-muted-foreground">
                  Pratique mais e tente novamente.
                </p>
              </>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Tempo: {formatTime(timeSpent)}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="gap-1.5" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
              Compartilhar
            </Button>
            <Button
              variant="outline"
              className="gap-1.5"
              onClick={() =>
                (window.location.href = `/play/${params.shortCode}`)
              }
            >
              <RotateCcw className="h-4 w-4" />
              Tentar Novamente
            </Button>
            <Button
              variant="outline"
              className="gap-1.5"
              onClick={() => (window.location.href = "/")}
            >
              <Home className="h-4 w-4" />
              Inicio
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Per-question breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhes das Respostas</CardTitle>
          <CardDescription>
            Veja como voce se saiu em cada questao
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {questions.map((q, index) => {
            const response = responses.find((r) => r.question_id === q.id)
            const isCorrect = response?.is_correct
            const pointsEarned = response?.points_earned || 0

            return (
              <div
                key={q.id}
                className={cn(
                  "rounded-lg border p-4",
                  isCorrect === true
                    ? "border-green-500/30 bg-green-500/5"
                    : isCorrect === false
                      ? "border-red-500/30 bg-red-500/5"
                      : "border-border"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    {isCorrect === true ? (
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
                    ) : isCorrect === false ? (
                      <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                    ) : (
                      <div className="mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 border-muted-foreground/30" />
                    )}
                    <div>
                      <p className="text-sm font-medium">
                        Questao {index + 1}:{" "}
                        {(q.content as Record<string, string>)?.text ||
                          "Sem texto"}
                      </p>
                      {response && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Sua resposta:{" "}
                          {formatAnswer(response.answer)}
                        </p>
                      )}
                      {q.explanation && (
                        <p className="mt-2 text-xs text-muted-foreground italic">
                          {q.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-xs font-bold",
                      isCorrect === true
                        ? "bg-green-500/20 text-green-700 dark:text-green-300"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    +{pointsEarned}
                  </span>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}

function formatAnswer(answer: Record<string, unknown>): string {
  const value = answer?.value
  if (value === undefined || value === null) return "Sem resposta"
  if (typeof value === "boolean") return value ? "Verdadeiro" : "Falso"
  if (typeof value === "string") return value
  if (Array.isArray(value)) return value.join(", ")
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => `${k}: ${v}`)
      .join("; ")
  }
  return String(value)
}
