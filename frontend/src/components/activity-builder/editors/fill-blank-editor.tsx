"use client"

import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import type { Question } from "@/lib/types"

interface FillBlankEditorProps {
  question: Question
  onUpdate: (updates: Partial<Question>) => void
}

interface BlankAnswer {
  accepted: string[]
}

export function FillBlankEditor({ question, onUpdate }: FillBlankEditorProps) {
  const questionText =
    (question.content as Record<string, unknown>)?.text as string || ""
  const blanks: BlankAnswer[] =
    ((question.content as Record<string, unknown>)?.blanks as BlankAnswer[]) || []
  const timeLimitEnabled = question.time_limit_seconds !== null

  const blankCount = (questionText.match(/\[blank\]/g) || []).length

  const updateContent = (updates: Record<string, unknown>) => {
    onUpdate({ content: { ...question.content, ...updates } })
  }

  const handleTextChange = (text: string) => {
    const newBlankCount = (text.match(/\[blank\]/g) || []).length
    let newBlanks = [...blanks]
    while (newBlanks.length < newBlankCount) {
      newBlanks.push({ accepted: [""] })
    }
    if (newBlanks.length > newBlankCount) {
      newBlanks = newBlanks.slice(0, newBlankCount)
    }
    updateContent({ text, blanks: newBlanks })
  }

  const updateBlankAnswer = (
    blankIndex: number,
    answerIndex: number,
    value: string
  ) => {
    const newBlanks = [...blanks]
    newBlanks[blankIndex] = {
      ...newBlanks[blankIndex],
      accepted: newBlanks[blankIndex].accepted.map((a, i) =>
        i === answerIndex ? value : a
      ),
    }
    updateContent({ blanks: newBlanks })
  }

  const addBlankAnswer = (blankIndex: number) => {
    const newBlanks = [...blanks]
    newBlanks[blankIndex] = {
      ...newBlanks[blankIndex],
      accepted: [...newBlanks[blankIndex].accepted, ""],
    }
    updateContent({ blanks: newBlanks })
  }

  const removeBlankAnswer = (blankIndex: number, answerIndex: number) => {
    const newBlanks = [...blanks]
    if (newBlanks[blankIndex].accepted.length <= 1) return
    newBlanks[blankIndex] = {
      ...newBlanks[blankIndex],
      accepted: newBlanks[blankIndex].accepted.filter(
        (_, i) => i !== answerIndex
      ),
    }
    updateContent({ blanks: newBlanks })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Texto com Lacunas</Label>
        <p className="text-xs text-muted-foreground">
          Use <Badge variant="outline" className="mx-1 text-xs">[blank]</Badge> para marcar onde as lacunas devem aparecer.
        </p>
        <Textarea
          placeholder="O [blank] e a capital do [blank]."
          value={questionText}
          onChange={(e) => handleTextChange(e.target.value)}
          rows={4}
        />
        <p className="text-xs text-muted-foreground">
          {blankCount} lacuna{blankCount !== 1 ? "s" : ""} detectada{blankCount !== 1 ? "s" : ""}
        </p>
      </div>

      {blanks.length > 0 && (
        <div className="space-y-4">
          <Label>Respostas por Lacuna</Label>
          {blanks.map((blank, blankIndex) => (
            <div
              key={blankIndex}
              className="rounded-lg border p-3 space-y-2"
            >
              <p className="text-sm font-medium">
                Lacuna {blankIndex + 1}
              </p>
              {blank.accepted.map((answer, answerIndex) => (
                <div key={answerIndex} className="flex items-center gap-2">
                  <Input
                    placeholder={`Resposta aceita ${answerIndex + 1}`}
                    value={answer}
                    onChange={(e) =>
                      updateBlankAnswer(blankIndex, answerIndex, e.target.value)
                    }
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeBlankAnswer(blankIndex, answerIndex)}
                    disabled={blank.accepted.length <= 1}
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => addBlankAnswer(blankIndex)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Resposta
              </Button>
            </div>
          ))}
        </div>
      )}

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
