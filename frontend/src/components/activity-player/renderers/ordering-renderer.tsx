"use client"

import { useState, useEffect } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { cn } from "@/lib/utils"
import { GripVertical } from "lucide-react"
import type { Question } from "@/lib/types"

interface OrderingRendererProps {
  question: Question
  answer: string[] | undefined
  onAnswerChange: (answer: string[]) => void
}

function SortableItem({ id, index }: { id: string; index: number }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 rounded-xl border-2 bg-card p-4 transition-shadow",
        isDragging
          ? "z-10 border-primary shadow-lg ring-1 ring-primary/20"
          : "border-border"
      )}
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
        {index + 1}
      </span>
      <span className="flex-1 text-sm font-medium sm:text-base">{id}</span>
    </div>
  )
}

export function OrderingRenderer({
  question,
  answer,
  onAnswerChange,
}: OrderingRendererProps) {
  const questionText =
    (question.content as Record<string, string>)?.text || ""
  const correctItems: string[] =
    ((question.content as Record<string, unknown>)?.items as string[]) || []

  const [items, setItems] = useState<string[]>([])

  useEffect(() => {
    if (answer && answer.length > 0) {
      setItems(answer)
    } else if (correctItems.length > 0) {
      const shuffled = [...correctItems].sort(() => Math.random() - 0.5)
      setItems(shuffled)
      onAnswerChange(shuffled)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = items.indexOf(active.id as string)
    const newIndex = items.indexOf(over.id as string)
    const newItems = arrayMove(items, oldIndex, newIndex)
    setItems(newItems)
    onAnswerChange(newItems)
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-lg font-medium leading-relaxed sm:text-xl">
          {questionText}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Arraste os itens para a ordem correta
        </p>
      </div>

      {question.media_url && (
        <div className="flex justify-center">
          <img
            src={question.media_url}
            alt="Imagem da questao"
            className="max-h-60 rounded-lg object-contain"
          />
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {items.map((item, index) => (
              <SortableItem key={item} id={item} index={index} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
