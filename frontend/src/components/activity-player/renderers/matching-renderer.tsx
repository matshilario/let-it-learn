"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"
import type { Question } from "@/lib/types"

interface MatchPair {
  left: string
  right: string
}

interface MatchingRendererProps {
  question: Question
  answer: Record<string, string> | undefined
  onAnswerChange: (answer: Record<string, string>) => void
}

export function MatchingRenderer({
  question,
  answer,
  onAnswerChange,
}: MatchingRendererProps) {
  const questionText =
    (question.content as Record<string, string>)?.text || ""
  const pairs: MatchPair[] =
    ((question.content as Record<string, unknown>)?.pairs as MatchPair[]) || []

  const leftItems = pairs.map((p) => p.left)
  const rightItems = pairs.map((p) => p.right)

  const [selectedLeft, setSelectedLeft] = useState<string | null>(null)

  const matches = answer || {}

  const matchedRightValues = new Set(Object.values(matches))

  const handleLeftClick = (item: string) => {
    if (matches[item]) {
      const newMatches = { ...matches }
      delete newMatches[item]
      onAnswerChange(newMatches)
      setSelectedLeft(null)
    } else {
      setSelectedLeft(selectedLeft === item ? null : item)
    }
  }

  const handleRightClick = (item: string) => {
    if (!selectedLeft) return

    if (matchedRightValues.has(item)) {
      const existingLeft = Object.entries(matches).find(
        ([, v]) => v === item
      )?.[0]
      if (existingLeft) {
        const newMatches = { ...matches }
        delete newMatches[existingLeft]
        newMatches[selectedLeft] = item
        onAnswerChange(newMatches)
      }
    } else {
      onAnswerChange({ ...matches, [selectedLeft]: item })
    }
    setSelectedLeft(null)
  }

  const removeMatch = (leftItem: string) => {
    const newMatches = { ...matches }
    delete newMatches[leftItem]
    onAnswerChange(newMatches)
  }

  const getMatchColor = (index: number) => {
    const colors = [
      "bg-blue-500/10 border-blue-500 text-blue-700 dark:text-blue-300",
      "bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300",
      "bg-purple-500/10 border-purple-500 text-purple-700 dark:text-purple-300",
      "bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-300",
      "bg-pink-500/10 border-pink-500 text-pink-700 dark:text-pink-300",
      "bg-cyan-500/10 border-cyan-500 text-cyan-700 dark:text-cyan-300",
    ]
    return colors[index % colors.length]
  }

  const getLeftMatchIndex = (item: string) => {
    const matchedLefts = Object.keys(matches)
    return matchedLefts.indexOf(item)
  }

  const getRightMatchIndex = (item: string) => {
    const entry = Object.entries(matches).find(([, v]) => v === item)
    if (!entry) return -1
    return Object.keys(matches).indexOf(entry[0])
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-lg font-medium leading-relaxed sm:text-xl">
          {questionText}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Selecione um item da esquerda e depois conecte com o item da direita
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="text-center text-xs font-medium uppercase text-muted-foreground">
            Itens
          </p>
          {leftItems.map((item) => {
            const isMatched = !!matches[item]
            const matchIndex = getLeftMatchIndex(item)
            return (
              <button
                key={item}
                type="button"
                onClick={() => handleLeftClick(item)}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl border-2 p-3 text-left text-sm font-medium transition-all active:scale-[0.98] sm:text-base",
                  selectedLeft === item &&
                    "border-primary bg-primary/10 ring-1 ring-primary/20",
                  isMatched && matchIndex >= 0 && getMatchColor(matchIndex),
                  !isMatched &&
                    selectedLeft !== item &&
                    "border-border hover:border-primary/40"
                )}
              >
                <span>{item}</span>
                {isMatched && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeMatch(item)
                    }}
                    className="ml-1 rounded-full p-0.5 hover:bg-foreground/10"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </button>
            )
          })}
        </div>

        <div className="space-y-2">
          <p className="text-center text-xs font-medium uppercase text-muted-foreground">
            Pares
          </p>
          {rightItems.map((item) => {
            const isMatched = matchedRightValues.has(item)
            const matchIndex = getRightMatchIndex(item)
            return (
              <button
                key={item}
                type="button"
                onClick={() => handleRightClick(item)}
                className={cn(
                  "w-full rounded-xl border-2 p-3 text-left text-sm font-medium transition-all active:scale-[0.98] sm:text-base",
                  isMatched && matchIndex >= 0 && getMatchColor(matchIndex),
                  !isMatched &&
                    selectedLeft
                    ? "border-primary/30 hover:border-primary bg-muted/30"
                    : !isMatched
                      ? "border-border"
                      : ""
                )}
              >
                {item}
              </button>
            )
          })}
        </div>
      </div>

      {Object.keys(matches).length > 0 && (
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Conexoes ({Object.keys(matches).length}/{leftItems.length})
          </p>
          <div className="space-y-1">
            {Object.entries(matches).map(([left, right], i) => (
              <div
                key={left}
                className={cn(
                  "flex items-center gap-2 rounded-md border px-2 py-1 text-xs",
                  getMatchColor(i)
                )}
              >
                <span className="font-medium">{left}</span>
                <span className="text-muted-foreground">→</span>
                <span className="font-medium">{right}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
