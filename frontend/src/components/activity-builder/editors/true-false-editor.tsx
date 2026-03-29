"use client"

import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import type { Question } from "@/lib/types"

interface TrueFalseEditorProps {
  question: Question
  onUpdate: (updates: Partial<Question>) => void
}

export function TrueFalseEditor({ question, onUpdate }: TrueFalseEditorProps) {
  const questionText =
    (question.content as Record<string, unknown>)?.text as string || ""
  const correctAnswer =
    ((question.content as Record<string, unknown>)?.correct_answer as boolean) ?? true
  const timeLimitEnabled = question.time_limit_seconds !== null

  return (
    <div className="space-y-6">
      {/* Question text */}
      <div className="space-y-2">
        <Label>Texto da Questao</Label>
        <Textarea
          placeholder="Digite a afirmacao aqui..."
          value={questionText}
          onChange={(e) =>
            onUpdate({
              content: { ...question.content, text: e.target.value },
            })
          }
          rows={3}
        />
      </div>

      {/* Correct answer */}
      <div className="space-y-3">
        <Label>Resposta Correta</Label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() =>
              onUpdate({
                content: { ...question.content, correct_answer: true },
              })
            }
            className={`rounded-lg border-2 p-4 text-center font-medium transition-all ${
              correctAnswer
                ? "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400"
                : "border-border hover:border-green-500/50"
            }`}
          >
            Verdadeiro
          </button>
          <button
            type="button"
            onClick={() =>
              onUpdate({
                content: { ...question.content, correct_answer: false },
              })
            }
            className={`rounded-lg border-2 p-4 text-center font-medium transition-all ${
              !correctAnswer
                ? "border-red-500 bg-red-500/10 text-red-700 dark:text-red-400"
                : "border-border hover:border-red-500/50"
            }`}
          >
            Falso
          </button>
        </div>
      </div>

      {/* Points */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Pontos</Label>
          <Input
            type="number"
            min={0}
            value={question.points}
            onChange={(e) => onUpdate({ points: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Limite de Tempo</Label>
            <Switch
              checked={timeLimitEnabled}
              onCheckedChange={(checked) =>
                onUpdate({ time_limit_seconds: checked ? 30 : null })
              }
            />
          </div>
          {timeLimitEnabled && (
            <Input
              type="number"
              min={5}
              value={question.time_limit_seconds || 30}
              onChange={(e) =>
                onUpdate({ time_limit_seconds: Number(e.target.value) })
              }
              placeholder="Segundos"
            />
          )}
        </div>
      </div>

      {/* Hint & Explanation */}
      <div className="space-y-2">
        <Label>Dica (opcional)</Label>
        <Textarea
          placeholder="Uma dica para o aluno..."
          value={question.hint || ""}
          onChange={(e) => onUpdate({ hint: e.target.value || null })}
          rows={2}
        />
      </div>
      <div className="space-y-2">
        <Label>Explicacao (opcional)</Label>
        <Textarea
          placeholder="Explicacao exibida apos resposta..."
          value={question.explanation || ""}
          onChange={(e) => onUpdate({ explanation: e.target.value || null })}
          rows={2}
        />
      </div>
    </div>
  )
}
