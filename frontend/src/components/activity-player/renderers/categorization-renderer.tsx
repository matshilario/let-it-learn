"use client"

import { useState, useEffect } from "react"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
} from "@dnd-kit/core"
import { cn } from "@/lib/utils"
import { GripVertical, X } from "lucide-react"
import type { Question } from "@/lib/types"

interface Category {
  name: string
  items: string[]
}

interface CategorizationRendererProps {
  question: Question
  answer: Record<string, string[]> | undefined
  onAnswerChange: (answer: Record<string, string[]>) => void
}

export function CategorizationRenderer({
  question,
  answer,
  onAnswerChange,
}: CategorizationRendererProps) {
  const questionText =
    (question.content as Record<string, string>)?.text || ""
  const categories: Category[] =
    ((question.content as Record<string, unknown>)?.categories as Category[]) ||
    []

  const categoryNames = categories.map((c) => c.name)
  const allItems = categories.flatMap((c) => c.items)

  const [placements, setPlacements] = useState<Record<string, string[]>>(
    () => answer || {}
  )
  const [activeItem, setActiveItem] = useState<string | null>(null)

  const placedItems = new Set(Object.values(placements).flat())
  const unplacedItems = allItems.filter((item) => !placedItems.has(item))

  useEffect(() => {
    if (answer) {
      setPlacements(answer)
    }
  }, [answer])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveItem(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveItem(null)

    if (!over) return

    const itemId = active.id as string
    const targetCategory = over.id as string

    if (!categoryNames.includes(targetCategory)) return

    const newPlacements = { ...placements }

    for (const cat of categoryNames) {
      if (newPlacements[cat]) {
        newPlacements[cat] = newPlacements[cat].filter((i) => i !== itemId)
      }
    }

    if (!newPlacements[targetCategory]) {
      newPlacements[targetCategory] = []
    }
    newPlacements[targetCategory] = [...newPlacements[targetCategory], itemId]

    setPlacements(newPlacements)
    onAnswerChange(newPlacements)
  }

  const handleTapPlace = (item: string, categoryName: string) => {
    const newPlacements = { ...placements }

    for (const cat of categoryNames) {
      if (newPlacements[cat]) {
        newPlacements[cat] = newPlacements[cat].filter((i) => i !== item)
      }
    }

    if (!newPlacements[categoryName]) {
      newPlacements[categoryName] = []
    }
    newPlacements[categoryName] = [...newPlacements[categoryName], item]

    setPlacements(newPlacements)
    onAnswerChange(newPlacements)
  }

  const handleRemove = (item: string) => {
    const newPlacements = { ...placements }
    for (const cat of categoryNames) {
      if (newPlacements[cat]) {
        newPlacements[cat] = newPlacements[cat].filter((i) => i !== item)
      }
    }
    setPlacements(newPlacements)
    onAnswerChange(newPlacements)
  }

  const [tapItem, setTapItem] = useState<string | null>(null)

  const handleItemTap = (item: string) => {
    setTapItem(tapItem === item ? null : item)
  }

  const categoryColors = [
    "border-blue-500/30 bg-blue-500/5",
    "border-emerald-500/30 bg-emerald-500/5",
    "border-purple-500/30 bg-purple-500/5",
    "border-amber-500/30 bg-amber-500/5",
    "border-pink-500/30 bg-pink-500/5",
  ]

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-lg font-medium leading-relaxed sm:text-xl">
          {questionText}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Arraste ou toque nos itens para classifica-los nas categorias
        </p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {unplacedItems.length > 0 && (
          <div className="rounded-xl border-2 border-dashed border-border p-4">
            <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
              Itens para classificar
            </p>
            <div className="flex flex-wrap gap-2">
              {unplacedItems.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => handleItemTap(item)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all active:scale-95",
                    tapItem === item
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:border-primary/40"
                  )}
                >
                  <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          {categoryNames.map((catName, catIndex) => {
            const catItems = placements[catName] || []
            return (
              <div
                key={catName}
                id={catName}
                onClick={() => {
                  if (tapItem) {
                    handleTapPlace(tapItem, catName)
                    setTapItem(null)
                  }
                }}
                className={cn(
                  "min-h-28 rounded-xl border-2 p-3 transition-colors",
                  categoryColors[catIndex % categoryColors.length],
                  tapItem && "cursor-pointer ring-2 ring-primary/20"
                )}
              >
                <p className="mb-2 text-sm font-bold">{catName}</p>
                {catItems.length === 0 ? (
                  <p className="py-4 text-center text-xs text-muted-foreground">
                    Solte itens aqui
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {catItems.map((item) => (
                      <span
                        key={item}
                        className="flex items-center gap-1 rounded-md border bg-card px-2 py-1 text-xs font-medium"
                      >
                        {item}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRemove(item)
                          }}
                          className="ml-0.5 rounded-full p-0.5 hover:bg-muted"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <DragOverlay>
          {activeItem && (
            <div className="flex items-center gap-1.5 rounded-lg border-2 border-primary bg-card px-3 py-2 text-sm font-medium shadow-lg">
              <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
              {activeItem}
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
