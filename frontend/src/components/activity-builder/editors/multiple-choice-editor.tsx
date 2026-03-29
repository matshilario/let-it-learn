"use client"

import { Plus, Trash2, GripVertical, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import type { Question } from "@/lib/types"

interface MultipleChoiceEditorProps {
  question: Question
  onUpdate: (updates: Partial<Question>) => void
}

interface OptionData {
  id?: string
  content: string
  is_correct: boolean
  sort_order: number
}

export function MultipleChoiceEditor({
  question,
  onUpdate,
}: MultipleChoiceEditorProps) {
  const options: OptionData[] = question.options?.length
    ? question.options.map((o) => ({
        id: o.id,
        content: o.content,
        is_correct: o.is_correct,
        sort_order: o.sort_order,
      }))
    : [
        { content: "", is_correct: true, sort_order: 0 },
        { content: "", is_correct: false, sort_order: 1 },
      ]

  const questionText =
    (question.content as Record<string, string>)?.text || ""
  const timeLimitEnabled = question.time_limit_seconds !== null

  const updateOptions = (newOptions: OptionData[]) => {
    onUpdate({
      options: newOptions.map((o, i) => ({
        ...(question.options?.find((qo) => qo.id === o.id) || {
          id: o.id || `temp-${i}`,
          question_id: question.id,
          media_url: null,
          category_id: null,
          match_target_id: null,
          metadata: null,
          created_at: "",
          updated_at: "",
        }),
        content: o.content,
        is_correct: o.is_correct,
        sort_order: i,
      })),
    })
  }

  const addOption = () => {
    updateOptions([
      ...options,
      { content: "", is_correct: false, sort_order: options.length },
    ])
  }

  const removeOption = (index: number) => {
    if (options.length <= 2) return
    updateOptions(options.filter((_, i) => i !== index))
  }

  const toggleCorrect = (index: number) => {
    updateOptions(
      options.map((o, i) => ({
        ...o,
        is_correct: i === index,
      }))
    )
  }

  const updateOptionContent = (index: number, content: string) => {
    updateOptions(
      options.map((o, i) => (i === index ? { ...o, content } : o))
    )
  }

  return (
    <div className="space-y-6">
      {/* Question text */}
      <div className="space-y-2">
        <Label>Texto da Questao</Label>
        <Textarea
          placeholder="Digite a pergunta aqui..."
          value={questionText}
          onChange={(e) =>
            onUpdate({
              content: { ...question.content, text: e.target.value },
            })
          }
          rows={3}
        />
      </div>

      {/* Options */}
      <div className="space-y-3">
        <Label>Opcoes</Label>
        {options.map((option, index) => (
          <div key={index} className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 cursor-grab" />
            <button
              type="button"
              onClick={() => toggleCorrect(index)}
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                option.is_correct
                  ? "border-green-500 bg-green-500 text-white"
                  : "border-muted-foreground/30 hover:border-green-500/50"
              }`}
            >
              {option.is_correct && <Check className="h-4 w-4" />}
            </button>
            <Input
              placeholder={`Opcao ${index + 1}`}
              value={option.content}
              onChange={(e) => updateOptionContent(index, e.target.value)}
              className="flex-1"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeOption(index)}
              disabled={options.length <= 2}
              className="shrink-0 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addOption}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Opcao
        </Button>
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
                onUpdate({
                  time_limit_seconds: checked ? 30 : null,
                })
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
