"use client"

import { cn } from "@/lib/utils"
import { Check } from "lucide-react"
import type { Question } from "@/lib/types"

interface MultipleChoiceRendererProps {
  question: Question
  answer: string | string[] | undefined
  onAnswerChange: (answer: string | string[]) => void
}

export function MultipleChoiceRenderer({
  question,
  answer,
  onAnswerChange,
}: MultipleChoiceRendererProps) {
  const questionText =
    (question.content as Record<string, string>)?.text || ""
  const options = question.options || []
  const allowMultiple = (question.config as Record<string, unknown>)?.allow_multiple === true

  const selectedValues: string[] = Array.isArray(answer)
    ? answer
    : answer
      ? [answer]
      : []

  const isSelected = (optionId: string) => selectedValues.includes(optionId)

  const handleSelect = (optionId: string) => {
    if (allowMultiple) {
      const newValues = isSelected(optionId)
        ? selectedValues.filter((v) => v !== optionId)
        : [...selectedValues, optionId]
      onAnswerChange(newValues)
    } else {
      onAnswerChange(optionId)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-lg font-medium leading-relaxed sm:text-xl">
          {questionText}
        </h2>
        {allowMultiple && (
          <p className="mt-1 text-sm text-muted-foreground">
            Selecione todas as opcoes corretas
          </p>
        )}
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

      <div className="grid gap-3">
        {options
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((option) => {
            const selected = isSelected(option.id)
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelect(option.id)}
                className={cn(
                  "flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all active:scale-[0.98]",
                  selected
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border hover:border-primary/40 hover:bg-muted/50"
                )}
              >
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    allowMultiple ? "rounded-md" : "rounded-full",
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/30"
                  )}
                >
                  {selected && <Check className="h-4 w-4" />}
                </div>
                <span className="flex-1 text-sm font-medium sm:text-base">
                  {option.content}
                </span>
                {option.media_url && (
                  <img
                    src={option.media_url}
                    alt=""
                    className="h-12 w-12 rounded-md object-cover"
                  />
                )}
              </button>
            )
          })}
      </div>
    </div>
  )
}
