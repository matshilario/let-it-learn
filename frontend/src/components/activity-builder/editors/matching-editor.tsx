"use client"

import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import type { Question } from "@/lib/types"

interface MatchingEditorProps {
  question: Question
  onUpdate: (updates: Partial<Question>) => void
}

interface MatchPair {
  left: string
  right: string
}

export function MatchingEditor({ question, onUpdate }: MatchingEditorProps) {
  const questionText =
    (question.content as Record<string, unknown>)?.text as string || ""
  const pairs: MatchPair[] =
    ((question.content as Record<string, unknown>)?.pairs as MatchPair[]) || [
      { left: "", right: "" },
      { left: "", right: "" },
    ]
  const timeLimitEnabled = question.time_limit_seconds !== null

  const updatePairs = (newPairs: MatchPair[]) => {
    onUpdate({
      content: { ...question.content, pairs: newPairs },
    })
  }

  const addPair = () => {
    updatePairs([...pairs, { left: "", right: "" }])
  }

  const removePair = (index: number) => {
    if (pairs.length <= 2) return
    updatePairs(pairs.filter((_, i) => i !== index))
  }

  const updatePair = (
    index: number,
    side: "left" | "right",
    value: string
  ) => {
    updatePairs(
      pairs.map((p, i) => (i === index ? { ...p, [side]: value } : p))
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Texto da Questao</Label>
        <Textarea
          placeholder="Digite a instrucao aqui..."
          value={questionText}
          onChange={(e) =>
            onUpdate({ content: { ...question.content, text: e.target.value } })
          }
          rows={3}
        />
      </div>

      <div className="space-y-3">
        <Label>Pares de Associacao</Label>
        <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-2 items-center">
          <span className="text-xs font-medium text-muted-foreground px-1">
            Coluna Esquerda
          </span>
          <span />
          <span className="text-xs font-medium text-muted-foreground px-1">
            Coluna Direita
          </span>
          <span />
          {pairs.map((pair, index) => (
            <div key={index} className="contents">
              <Input
                placeholder={`Item ${index + 1}`}
                value={pair.left}
                onChange={(e) => updatePair(index, "left", e.target.value)}
              />
              <span className="text-muted-foreground text-center px-2">
                ↔
              </span>
              <Input
                placeholder={`Par ${index + 1}`}
                value={pair.right}
                onChange={(e) => updatePair(index, "right", e.target.value)}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removePair(index)}
                disabled={pairs.length <= 2}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={addPair}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Par
        </Button>
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
