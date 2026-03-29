"use client"

import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import type { Question } from "@/lib/types"

interface CategorizationEditorProps {
  question: Question
  onUpdate: (updates: Partial<Question>) => void
}

interface Category {
  name: string
  items: string[]
}

export function CategorizationEditor({
  question,
  onUpdate,
}: CategorizationEditorProps) {
  const questionText =
    (question.content as Record<string, unknown>)?.text as string || ""
  const categories: Category[] =
    ((question.content as Record<string, unknown>)?.categories as Category[]) || [
      { name: "", items: [""] },
      { name: "", items: [""] },
    ]
  const timeLimitEnabled = question.time_limit_seconds !== null

  const updateContent = (updates: Record<string, unknown>) => {
    onUpdate({ content: { ...question.content, ...updates } })
  }

  const updateCategory = (
    catIndex: number,
    updates: Partial<Category>
  ) => {
    const newCategories = categories.map((c, i) =>
      i === catIndex ? { ...c, ...updates } : c
    )
    updateContent({ categories: newCategories })
  }

  const addCategory = () => {
    updateContent({
      categories: [...categories, { name: "", items: [""] }],
    })
  }

  const removeCategory = (index: number) => {
    if (categories.length <= 2) return
    updateContent({
      categories: categories.filter((_, i) => i !== index),
    })
  }

  const addItem = (catIndex: number) => {
    updateCategory(catIndex, {
      items: [...categories[catIndex].items, ""],
    })
  }

  const removeItem = (catIndex: number, itemIndex: number) => {
    const cat = categories[catIndex]
    if (cat.items.length <= 1) return
    updateCategory(catIndex, {
      items: cat.items.filter((_, i) => i !== itemIndex),
    })
  }

  const updateItem = (
    catIndex: number,
    itemIndex: number,
    value: string
  ) => {
    updateCategory(catIndex, {
      items: categories[catIndex].items.map((item, i) =>
        i === itemIndex ? value : item
      ),
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Texto da Questao</Label>
        <Textarea
          placeholder="Classifique os itens nas categorias corretas..."
          value={questionText}
          onChange={(e) => updateContent({ text: e.target.value })}
          rows={3}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Categorias</Label>
          <Badge variant="secondary">{categories.length} categorias</Badge>
        </div>
        {categories.map((category, catIndex) => (
          <div
            key={catIndex}
            className="rounded-lg border p-4 space-y-3"
          >
            <div className="flex items-center gap-2">
              <Input
                placeholder={`Categoria ${catIndex + 1}`}
                value={category.name}
                onChange={(e) =>
                  updateCategory(catIndex, { name: e.target.value })
                }
                className="flex-1 font-medium"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeCategory(catIndex)}
                disabled={categories.length <= 2}
                className="shrink-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="pl-4 space-y-2">
              {category.items.map((item, itemIndex) => (
                <div key={itemIndex} className="flex items-center gap-2">
                  <Input
                    placeholder={`Item ${itemIndex + 1}`}
                    value={item}
                    onChange={(e) =>
                      updateItem(catIndex, itemIndex, e.target.value)
                    }
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeItem(catIndex, itemIndex)}
                    disabled={category.items.length <= 1}
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => addItem(catIndex)}
                className="text-xs"
              >
                <Plus className="mr-1 h-3 w-3" />
                Adicionar Item
              </Button>
            </div>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addCategory}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Categoria
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
