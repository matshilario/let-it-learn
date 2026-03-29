"use client"

import { useRef } from "react"
import type { Question } from "@/lib/types"

interface FillBlankRendererProps {
  question: Question
  answer: string[] | undefined
  onAnswerChange: (answer: string[]) => void
}

export function FillBlankRenderer({
  question,
  answer,
  onAnswerChange,
}: FillBlankRendererProps) {
  const questionText =
    (question.content as Record<string, string>)?.text || ""
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const parts = questionText.split("[blank]")
  const blankCount = parts.length - 1
  const values = answer || new Array(blankCount).fill("")

  const handleChange = (index: number, value: string) => {
    const newValues = [...values]
    newValues[index] = value
    onAnswerChange(newValues)
  }

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Tab" && !e.shiftKey && index < blankCount - 1) {
      e.preventDefault()
      inputRefs.current[index + 1]?.focus()
    } else if (e.key === "Tab" && e.shiftKey && index > 0) {
      e.preventDefault()
      inputRefs.current[index - 1]?.focus()
    }
  }

  return (
    <div className="space-y-6">
      {question.media_url && (
        <div className="flex justify-center">
          <img
            src={question.media_url}
            alt="Imagem da questao"
            className="max-h-60 rounded-lg object-contain"
          />
        </div>
      )}

      <div className="rounded-xl border bg-card p-6">
        <p className="flex flex-wrap items-baseline gap-y-3 text-base leading-loose sm:text-lg">
          {parts.map((part, index) => (
            <span key={index} className="contents">
              <span>{part}</span>
              {index < blankCount && (
                <input
                  ref={(el) => {
                    inputRefs.current[index] = el
                  }}
                  type="text"
                  value={values[index] || ""}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  placeholder={`lacuna ${index + 1}`}
                  className="mx-1 inline-block w-32 rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 px-2 py-1 text-center text-base font-medium outline-none transition-colors focus:border-primary focus:bg-primary/10 sm:w-40"
                />
              )}
            </span>
          ))}
        </p>
      </div>
    </div>
  )
}
