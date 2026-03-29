"use client"

import { Plus, Trash2, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import type { Question } from "@/lib/types"

interface OrderingEditorProps {
  question: Question
  onUpdate: (updates: Partial<Question>) => void
}

export function OrderingEditor({ question, onUpdate }: OrderingEditorProps) {
  const questionText =
    (question.content as Record<string, unknown>)?.text as string || ""
  const items: string[] =
    ((question.content as Record<string, unknown>)?.items as string[]) || ["", ""]
  const timeLimitEnabled = question.time_limit_seconds !== null

  const updateContent = (updates: Record<string, unknown>) => {
    onUpdate({ content: { ...question.content, ...updates } })
  }

  const updateItem = (index: number, value: string) => {
    const newItems = [...items]
    newItems[index] = value
    updateContent({ items: newItems })
  }

  const addItem = () => {
    updateContent({ items: [...items, ""] })
  }

  const removeItem = (index: number) => {
    if (items.length <= 2) return
    updateContent({ items: items.filter((_, i) => i !== index) })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Texto da Questao</Label>
        <Textarea
          placeholder="Coloque os itens na ordem correta..."
          value={questionText}
          onChange={(e) => updateContent({ text: e.target.value })}
          rows={3}
        />
      </div>

      <div className="space-y-3">
        <Label>Itens na Ordem Correta</Label>
        <p className="text-xs text-muted-foreground">
          Insira os itens na ordem correta. Eles serao embaralhados para o aluno.
        </p>
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
              {index + 1}
            </span>
            <Input
              placeholder={`Item ${index + 1}`}
              value={item}
              onChange={(e) => updateItem(index, e.target.value)}
              className="flex-1"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeItem(index)}
              disabled={items.length <= 2}
              className="shrink-0 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addItem}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Item
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
