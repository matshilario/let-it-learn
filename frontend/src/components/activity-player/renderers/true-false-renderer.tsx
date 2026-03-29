"use client"

import { cn } from "@/lib/utils"
import { Check, X } from "lucide-react"
import type { Question } from "@/lib/types"

interface TrueFalseRendererProps {
  question: Question
  answer: boolean | undefined
  onAnswerChange: (answer: boolean) => void
}

export function TrueFalseRenderer({
  question,
  answer,
  onAnswerChange,
}: TrueFalseRendererProps) {
  const questionText =
    (question.content as Record<string, string>)?.text || ""

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

      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => onAnswerChange(true)}
          className={cn(
            "flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all active:scale-[0.98]",
            answer === true
              ? "border-green-500 bg-green-500/10 ring-1 ring-green-500/20"
              : "border-border hover:border-green-500/40 hover:bg-green-500/5"
          )}
        >
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-full transition-colors",
              answer === true
                ? "bg-green-500 text-white"
                : "bg-green-500/10 text-green-500"
            )}
          >
            <Check className="h-6 w-6" />
          </div>
          <span className="text-base font-semibold">Verdadeiro</span>
        </button>

        <button
          type="button"
          onClick={() => onAnswerChange(false)}
          className={cn(
            "flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all active:scale-[0.98]",
            answer === false
              ? "border-red-500 bg-red-500/10 ring-1 ring-red-500/20"
              : "border-border hover:border-red-500/40 hover:bg-red-500/5"
          )}
        >
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-full transition-colors",
              answer === false
                ? "bg-red-500 text-white"
                : "bg-red-500/10 text-red-500"
            )}
          >
            <X className="h-6 w-6" />
          </div>
          <span className="text-base font-semibold">Falso</span>
        </button>
      </div>
    </div>
  )
}
