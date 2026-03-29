"use client"

import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import type { Question } from "@/lib/types"

interface TextResponseEditorProps {
  question: Question
  onUpdate: (updates: Partial<Question>) => void
}

export function TextResponseEditor({
  question,
  onUpdate,
}: TextResponseEditorProps) {
  const questionText =
    (question.content as Record<string, unknown>)?.text as string || ""
  const acceptedAnswers: string[] =
    ((question.content as Record<string, unknown>)?.accepted_answers as string[]) || [""]
  const minLength =
    ((question.content as Record<string, unknown>)?.min_length as number) || 0
  const maxLength =
    ((question.content as Record<string, unknown>)?.max_length as number) || 500
  const timeLimitEnabled = question.time_limit_seconds !== null

  const updateContent = (updates: Record<string, unknown>) => {
    onUpdate({ content: { ...question.content, ...updates } })
  }

  const updateAnswer = (index: number, value: string) => {
    const newAnswers = [...acceptedAnswers]
    newAnswers[index] = value
    updateContent({ accepted_answers: newAnswers })
  }

  const addAnswer = () => {
    updateContent({ accepted_answers: [...acceptedAnswers, ""] })
  }

  const removeAnswer = (index: number) => {
    if (acceptedAnswers.length <= 1) return
    updateContent({
      accepted_answers: acceptedAnswers.filter((_, i) => i !== index),
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Texto da Questao</Label>
        <Textarea
          placeholder="Digite a pergunta aqui..."
          value={questionText}
          onChange={(e) => updateContent({ text: e.target.value })}
          rows={3}
        />
      </div>

      <div className="space-y-3">
        <Label>Respostas Aceitas</Label>
        {acceptedAnswers.map((answer, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              placeholder={`Resposta aceita ${index + 1}`}
              value={answer}
              onChange={(e) => updateAnswer(index, e.target.value)}
              className="flex-1"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeAnswer(index)}
              disabled={acceptedAnswers.length <= 1}
              className="shrink-0 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addAnswer}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Resposta
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Caracteres Minimo</Label>
          <Input
            type="number"
            min={0}
            value={minLength}
            onChange={(e) =>
              updateContent({ min_length: Number(e.target.value) })
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Caracteres Maximo</Label>
          <Input
            type="number"
            min={1}
            value={maxLength}
            onChange={(e) =>
              updateContent({ max_length: Number(e.target.value) })
            }
          />
        </div>
      </div>

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
                onUpdate({ time_limit_seconds: checked ? 60 : null })
              }
            />
          </div>
          {timeLimitEnabled && (
            <Input
              type="number"
              min={5}
              value={question.time_limit_seconds || 60}
              onChange={(e) =>
                onUpdate({ time_limit_seconds: Number(e.target.value) })
              }
              placeholder="Segundos"
            />
          )}
        </div>
      </div>

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
