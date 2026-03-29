"use client"

import { Textarea } from "@/components/ui/textarea"
import type { Question } from "@/lib/types"

interface TextResponseRendererProps {
  question: Question
  answer: string | undefined
  onAnswerChange: (answer: string) => void
}

export function TextResponseRenderer({
  question,
  answer,
  onAnswerChange,
}: TextResponseRendererProps) {
  const questionText =
    (question.content as Record<string, string>)?.text || ""
  const config = question.config as Record<string, unknown> | null
  const maxLength = (config?.max_length as number) || undefined
  const minLength = (config?.min_length as number) || undefined
  const currentLength = (answer || "").length

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-lg font-medium leading-relaxed sm:text-xl">
          {questionText}
        </h2>
      </div>

      {question.media_url && (
        <div className="flex justify-center">
          <img
            src={question.media_url}
            alt="Imagem da questao"
            className="max-h-60 rounded-lg object-contain"
          />
        </div>
      )}

      <div className="space-y-2">
        <Textarea
          value={answer || ""}
          onChange={(e) => onAnswerChange(e.target.value)}
          placeholder="Digite sua resposta aqui..."
          rows={6}
          maxLength={maxLength}
          className="min-h-32 text-base"
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {minLength && currentLength < minLength ? (
            <span className="text-amber-500">
              Minimo {minLength} caracteres (faltam {minLength - currentLength})
            </span>
          ) : (
            <span />
          )}
          {maxLength ? (
            <span>
              {currentLength}/{maxLength}
            </span>
          ) : (
            <span>{currentLength} caracteres</span>
          )}
        </div>
      </div>
    </div>
  )
}
