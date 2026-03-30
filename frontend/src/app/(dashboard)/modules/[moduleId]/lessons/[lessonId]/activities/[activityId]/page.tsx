"use client"

import { useEffect, useCallback, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  Plus,
  Trash2,
  GripVertical,
  Save,
  Copy,
  Check,
  Eye,
  EyeOff,
  ListChecks,
  ToggleLeft,
  Link2,
  Type,
  TextCursorInput,
  ArrowUpDown,
  LayoutGrid,
  QrCode,
  Settings2,
} from "lucide-react"
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
import { QRCodeSVG } from "qrcode.react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

import { useModule } from "@/lib/hooks/use-modules"
import { useLesson } from "@/lib/hooks/use-lessons"
import { useActivity, useUpdateActivity } from "@/lib/hooks/use-activities"
import {
  useQuestions,
  useCreateQuestion,
  useUpdateQuestion,
  useDeleteQuestion,
} from "@/lib/hooks/use-questions"
import { useActivityBuilderStore } from "@/lib/stores/activity-builder-store"
import { QuestionEditor } from "@/components/activity-builder/question-editor"
import type { QuestionType, Question } from "@/lib/types"

const QUESTION_TYPES: {
  value: QuestionType
  label: string
  icon: React.ElementType
  description: string
}[] = [
  {
    value: "multiple_choice",
    label: "Multipla Escolha",
    icon: ListChecks,
    description: "Varias opcoes, uma ou mais corretas",
  },
  {
    value: "true_false",
    label: "Verdadeiro ou Falso",
    icon: ToggleLeft,
    description: "Afirmacao verdadeira ou falsa",
  },
  {
    value: "matching",
    label: "Associacao",
    icon: Link2,
    description: "Conectar pares correspondentes",
  },
  {
    value: "text_response",
    label: "Resposta em Texto",
    icon: Type,
    description: "Resposta escrita pelo aluno",
  },
  {
    value: "fill_blank",
    label: "Preencher Lacunas",
    icon: TextCursorInput,
    description: "Completar palavras faltantes",
  },
  {
    value: "ordering",
    label: "Ordenacao",
    icon: ArrowUpDown,
    description: "Colocar itens na ordem correta",
  },
  {
    value: "categorization",
    label: "Categorizacao",
    icon: LayoutGrid,
    description: "Classificar itens em categorias",
  },
]

function getQuestionTypeIcon(type: QuestionType): React.ElementType {
  return QUESTION_TYPES.find((t) => t.value === type)?.icon || ListChecks
}

function getQuestionPreview(question: Question): string {
  const text = (question.content as Record<string, string>)?.text || ""
  if (text.length > 50) return text.slice(0, 50) + "..."
  return text || "Sem texto"
}

// Sortable question item
function SortableQuestionItem({
  question,
  index,
  isSelected,
  onSelect,
  onDelete,
}: {
  question: Question
  index: number
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const Icon = getQuestionTypeIcon(question.question_type)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 rounded-lg border p-2 transition-all cursor-pointer ${
        isDragging ? "opacity-50 shadow-lg" : ""
      } ${
        isSelected
          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
          : "border-border hover:border-primary/30 hover:bg-muted/50"
      }`}
      onClick={onSelect}
    >
      <button
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted text-xs font-medium">
        {index + 1}
      </span>
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="flex-1 truncate text-sm">{getQuestionPreview(question)}</span>
      <Badge variant="secondary" className="text-xs shrink-0">
        {question.points}pts
      </Badge>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
        className="shrink-0 text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}

export default function ActivityBuilderPage() {
  const params = useParams<{
    moduleId: string
    lessonId: string
    activityId: string
  }>()
  const { moduleId, lessonId, activityId } = params

  const [typePickerOpen, setTypePickerOpen] = useState(false)
  const [qrOpen, setQrOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  // Data fetching
  const { data: mod } = useModule(moduleId)
  const { data: lesson } = useLesson(lessonId)
  const { data: activity, isLoading: activityLoading } = useActivity(activityId)
  const { data: fetchedQuestions, isLoading: questionsLoading } =
    useQuestions(activityId)

  // Mutations
  const updateActivity = useUpdateActivity()
  const createQuestion = useCreateQuestion()
  const updateQuestionMutation = useUpdateQuestion()
  const deleteQuestionMutation = useDeleteQuestion()

  // Store
  const {
    selectedQuestionId,
    questions,
    setSelectedQuestion,
    setQuestions,
    addQuestion,
    updateQuestion: updateQuestionInStore,
    deleteQuestion: deleteQuestionInStore,
    reorderQuestions,
  } = useActivityBuilderStore()

  // Local activity settings state
  const [localTitle, setLocalTitle] = useState("")
  const [localDescription, setLocalDescription] = useState("")
  const [localAccessMode, setLocalAccessMode] = useState("open")
  const [localTimerEnabled, setLocalTimerEnabled] = useState(false)
  const [localTimeLimit, setLocalTimeLimit] = useState(0)
  const [localShuffleQuestions, setLocalShuffleQuestions] = useState(false)
  const [localShuffleOptions, setLocalShuffleOptions] = useState(false)
  const [localShowFeedback, setLocalShowFeedback] = useState(true)
  const [localShowCorrectAnswer, setLocalShowCorrectAnswer] = useState(true)
  const [localMaxAttempts, setLocalMaxAttempts] = useState(1)
  const [localPassingScore, setLocalPassingScore] = useState(60)
  const [localIsPublished, setLocalIsPublished] = useState(false)

  // Gamification settings
  const [gamificationEnabled, setGamificationEnabled] = useState(false)
  const [gamificationTimeBonus, setGamificationTimeBonus] = useState(true)
  const [gamificationTimeBonusMax, setGamificationTimeBonusMax] = useState(50)
  const [gamificationStreak, setGamificationStreak] = useState(true)
  const [gamificationStreakMax, setGamificationStreakMax] = useState(3.0)
  const [gamificationXpPerPoint, setGamificationXpPerPoint] = useState(1)
  const [gamificationXpCompletion, setGamificationXpCompletion] = useState(50)

  // Sync fetched data to store
  useEffect(() => {
    if (fetchedQuestions) {
      setQuestions(fetchedQuestions)
      if (fetchedQuestions.length > 0 && !selectedQuestionId) {
        setSelectedQuestion(fetchedQuestions[0].id)
      }
    }
  }, [fetchedQuestions, setQuestions, setSelectedQuestion, selectedQuestionId])

  // Sync activity data to local state
  useEffect(() => {
    if (activity) {
      setLocalTitle(activity.title)
      setLocalDescription(activity.description || "")
      setLocalAccessMode(activity.access_mode)
      setLocalTimerEnabled(activity.time_limit_seconds !== null)
      setLocalTimeLimit(activity.time_limit_seconds || 0)
      setLocalShuffleQuestions(activity.shuffle_questions)
      setLocalShuffleOptions(activity.shuffle_options)
      setLocalShowFeedback(activity.show_feedback)
      setLocalShowCorrectAnswer(activity.show_correct_answer)
      setLocalMaxAttempts(activity.max_attempts || 1)
      setLocalPassingScore(activity.passing_score || 60)
      setLocalIsPublished(activity.is_published)

      // Gamification
      const g = activity.gamification as Record<string, unknown> | null
      if (g) {
        setGamificationEnabled(!!g.enabled)
        setGamificationTimeBonus(g.time_bonus !== false)
        setGamificationTimeBonusMax(Number(g.time_bonus_max) || 50)
        setGamificationStreak(g.streak_multiplier !== false)
        setGamificationStreakMax(Number(g.streak_multiplier_max) || 3.0)
        setGamificationXpPerPoint(Number(g.xp_per_point) || 1)
        setGamificationXpCompletion(Number(g.xp_completion_bonus) || 50)
      }
    }
  }, [activity])

  const selectedQuestion = questions.find((q) => q.id === selectedQuestionId)

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = questions.findIndex((q) => q.id === active.id)
      const newIndex = questions.findIndex((q) => q.id === over.id)
      reorderQuestions(oldIndex, newIndex)
    }
  }

  const handleAddQuestion = async (type: QuestionType) => {
    setTypePickerOpen(false)
    try {
      const result = await createQuestion.mutateAsync({
        activityId,
        body: {
          question_type: type,
          content: { text: "" },
          points: 10,
          sort_order: questions.length,
        },
      })
      addQuestion(result)
    } catch {
      toast.error("Erro ao criar questao")
    }
  }

  const handleUpdateQuestion = useCallback(
    (updates: Partial<Question>) => {
      if (!selectedQuestionId) return
      updateQuestionInStore(selectedQuestionId, updates)
    },
    [selectedQuestionId, updateQuestionInStore]
  )

  const handleDeleteQuestion = async (questionId: string) => {
    try {
      await deleteQuestionMutation.mutateAsync(questionId)
      deleteQuestionInStore(questionId)
      toast.success("Questao excluida")
    } catch {
      toast.error("Erro ao excluir questao")
    }
  }

  const handleSave = async () => {
    try {
      // Save activity settings
      await updateActivity.mutateAsync({
        activityId,
        body: {
          title: localTitle,
          description: localDescription || undefined,
          access_mode: localAccessMode,
          time_limit_seconds: localTimerEnabled ? localTimeLimit : undefined,
          shuffle_questions: localShuffleQuestions,
          shuffle_options: localShuffleOptions,
          show_feedback: localShowFeedback,
          show_correct_answer: localShowCorrectAnswer,
          max_attempts: localMaxAttempts,
          passing_score: localPassingScore,
          is_published: localIsPublished,
          gamification: {
            enabled: gamificationEnabled,
            time_bonus: gamificationTimeBonus,
            time_bonus_max: gamificationTimeBonusMax,
            streak_multiplier: gamificationStreak,
            streak_multiplier_max: gamificationStreakMax,
            xp_per_point: gamificationXpPerPoint,
            xp_completion_bonus: gamificationXpCompletion,
          },
        },
      })

      // Save each question
      for (const q of questions) {
        await updateQuestionMutation.mutateAsync({
          questionId: q.id,
          body: {
            content: q.content,
            hint: q.hint || undefined,
            explanation: q.explanation || undefined,
            points: q.points,
            time_limit_seconds: q.time_limit_seconds || undefined,
            sort_order: q.sort_order,
            options: q.options?.map((o) => ({
              content: o.content,
              is_correct: o.is_correct,
              sort_order: o.sort_order,
              category_id: o.category_id || undefined,
              match_target_id: o.match_target_id || undefined,
            })),
          },
        })
      }

      toast.success("Atividade salva com sucesso!")
    } catch {
      toast.error("Erro ao salvar atividade")
    }
  }

  const handleCopyCode = () => {
    if (activity?.short_code) {
      navigator.clipboard.writeText(activity.short_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success("Codigo copiado!")
    }
  }

  const isLoading = activityLoading || questionsLoading

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-5 w-80" />
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-4">
            <Skeleton className="h-64" />
            <Skeleton className="h-96" />
          </div>
          <Skeleton className="h-[600px]" />
        </div>
      </div>
    )
  }

  const activityUrl = typeof window !== "undefined"
    ? `${window.location.origin}/join/${activity?.short_code || ""}`
    : ""

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/modules" />}>
              Modulos
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href={`/modules/${moduleId}`} />}>
              {mod?.title || "Modulo"}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink
              render={
                <Link href={`/modules/${moduleId}/lessons/${lessonId}`} />
              }
            >
              {lesson?.title || "Aula"}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{activity?.title || "Atividade"}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left panel: Questions list + editor */}
        <div className="lg:col-span-2 space-y-4">
          {/* Question list */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  Questoes ({questions.length})
                </CardTitle>
                <Button
                  size="sm"
                  onClick={() => setTypePickerOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Questao
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {questions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="rounded-full bg-muted p-3 mb-3">
                    <ListChecks className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium mb-1">
                    Nenhuma questao ainda
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Adicione questoes para construir sua atividade
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setTypePickerOpen(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Questao
                  </Button>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={questions.map((q) => q.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {questions.map((question, index) => (
                        <SortableQuestionItem
                          key={question.id}
                          question={question}
                          index={index}
                          isSelected={question.id === selectedQuestionId}
                          onSelect={() => setSelectedQuestion(question.id)}
                          onDelete={() => handleDeleteQuestion(question.id)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </CardContent>
          </Card>

          {/* Question Editor */}
          {selectedQuestion && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Editar Questao {questions.findIndex((q) => q.id === selectedQuestionId) + 1}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <QuestionEditor
                  question={selectedQuestion}
                  onUpdate={handleUpdateQuestion}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right panel: Settings */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                <CardTitle className="text-base">
                  Configuracoes da Atividade
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <Label>Titulo</Label>
                <Input
                  value={localTitle}
                  onChange={(e) => setLocalTitle(e.target.value)}
                  placeholder="Titulo da atividade"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label>Descricao</Label>
                <Textarea
                  value={localDescription}
                  onChange={(e) => setLocalDescription(e.target.value)}
                  placeholder="Descricao da atividade"
                  rows={2}
                />
              </div>

              {/* Activity Type */}
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Badge variant="outline">{activity?.activity_type}</Badge>
              </div>

              <Separator />

              {/* Access Mode */}
              <div className="space-y-2">
                <Label>Modo de Acesso</Label>
                <div className="grid grid-cols-2 gap-2">
                  {["open", "authenticated"].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setLocalAccessMode(mode)}
                      className={`rounded-lg border p-2 text-sm font-medium transition-all hover:bg-muted ${
                        localAccessMode === mode
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border"
                      }`}
                    >
                      {mode === "open" ? "Aberto" : "Autenticado"}
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Timer */}
              <div className="flex items-center justify-between">
                <Label>Temporizador</Label>
                <Switch
                  checked={localTimerEnabled}
                  onCheckedChange={setLocalTimerEnabled}
                />
              </div>
              {localTimerEnabled && (
                <Input
                  type="number"
                  min={0}
                  value={localTimeLimit}
                  onChange={(e) => setLocalTimeLimit(Number(e.target.value))}
                  placeholder="Segundos"
                />
              )}

              {/* Shuffle questions */}
              <div className="flex items-center justify-between">
                <Label>Embaralhar Questoes</Label>
                <Switch
                  checked={localShuffleQuestions}
                  onCheckedChange={setLocalShuffleQuestions}
                />
              </div>

              {/* Shuffle options */}
              <div className="flex items-center justify-between">
                <Label>Embaralhar Opcoes</Label>
                <Switch
                  checked={localShuffleOptions}
                  onCheckedChange={setLocalShuffleOptions}
                />
              </div>

              {/* Show feedback */}
              <div className="flex items-center justify-between">
                <Label>Mostrar Feedback</Label>
                <Switch
                  checked={localShowFeedback}
                  onCheckedChange={setLocalShowFeedback}
                />
              </div>

              {/* Show correct answer */}
              <div className="flex items-center justify-between">
                <Label>Mostrar Resposta Correta</Label>
                <Switch
                  checked={localShowCorrectAnswer}
                  onCheckedChange={setLocalShowCorrectAnswer}
                />
              </div>

              <Separator />

              {/* Max attempts */}
              <div className="space-y-2">
                <Label>Maximo de Tentativas</Label>
                <Input
                  type="number"
                  min={1}
                  value={localMaxAttempts}
                  onChange={(e) => setLocalMaxAttempts(Number(e.target.value))}
                />
              </div>

              {/* Passing score */}
              <div className="space-y-2">
                <Label>Nota de Aprovacao (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={localPassingScore}
                  onChange={(e) =>
                    setLocalPassingScore(Number(e.target.value))
                  }
                />
              </div>

              <Separator />

              {/* Gamification */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label>Gamificacao</Label>
                  <Badge variant="outline" className="text-[10px]">
                    Pontos, streaks, XP
                  </Badge>
                </div>
                <Switch
                  checked={gamificationEnabled}
                  onCheckedChange={setGamificationEnabled}
                />
              </div>
              {gamificationEnabled && (
                <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Bonus por Tempo</Label>
                    <Switch
                      checked={gamificationTimeBonus}
                      onCheckedChange={setGamificationTimeBonus}
                    />
                  </div>
                  {gamificationTimeBonus && (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Bonus maximo (% dos pontos base)
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={gamificationTimeBonusMax}
                        onChange={(e) =>
                          setGamificationTimeBonusMax(Number(e.target.value))
                        }
                        className="h-8 text-sm"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Multiplicador de Sequencia</Label>
                    <Switch
                      checked={gamificationStreak}
                      onCheckedChange={setGamificationStreak}
                    />
                  </div>
                  {gamificationStreak && (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Multiplicador maximo
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        step={0.25}
                        value={gamificationStreakMax}
                        onChange={(e) =>
                          setGamificationStreakMax(Number(e.target.value))
                        }
                        className="h-8 text-sm"
                      />
                    </div>
                  )}

                  <Separator />

                  <div className="space-y-1">
                    <Label className="text-xs">XP por ponto ganho</Label>
                    <Input
                      type="number"
                      min={0}
                      max={10}
                      value={gamificationXpPerPoint}
                      onChange={(e) =>
                        setGamificationXpPerPoint(Number(e.target.value))
                      }
                      className="h-8 text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Bonus XP por completar</Label>
                    <Input
                      type="number"
                      min={0}
                      value={gamificationXpCompletion}
                      onChange={(e) =>
                        setGamificationXpCompletion(Number(e.target.value))
                      }
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              )}

              <Separator />

              {/* Publish */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {localIsPublished ? (
                    <Eye className="h-4 w-4 text-green-500" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  )}
                  <Label>
                    {localIsPublished ? "Publicado" : "Rascunho"}
                  </Label>
                </div>
                <Switch
                  checked={localIsPublished}
                  onCheckedChange={setLocalIsPublished}
                />
              </div>

              <Separator />

              {/* Short code */}
              {activity?.short_code && (
                <div className="space-y-2">
                  <Label>Codigo de Acesso</Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded-lg border bg-muted px-3 py-2 text-sm font-mono">
                      {activity.short_code}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopyCode}
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* QR Code */}
              {activity?.short_code && (
                <div className="space-y-2">
                  <Label>QR Code</Label>
                  <button
                    type="button"
                    onClick={() => setQrOpen(true)}
                    className="flex items-center gap-2 rounded-lg border p-3 w-full hover:bg-muted transition-colors"
                  >
                    <QrCode className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm">Ver QR Code</span>
                  </button>
                </div>
              )}

              <Separator />

              {/* Save */}
              <Button
                className="w-full"
                onClick={handleSave}
                disabled={
                  updateActivity.isPending ||
                  updateQuestionMutation.isPending
                }
              >
                <Save className="mr-2 h-4 w-4" />
                {updateActivity.isPending
                  ? "Salvando..."
                  : "Salvar Atividade"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Question Type Picker Dialog */}
      <Dialog open={typePickerOpen} onOpenChange={setTypePickerOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Adicionar Questao</DialogTitle>
            <DialogDescription>
              Escolha o tipo de questao que deseja adicionar.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            {QUESTION_TYPES.map((type) => {
              const Icon = type.icon
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => handleAddQuestion(type.value)}
                  className="flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-all hover:bg-muted hover:border-primary/30"
                >
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium">{type.label}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {type.description}
                  </span>
                </button>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>QR Code</DialogTitle>
            <DialogDescription>
              Compartilhe este QR Code com seus alunos para acessar a atividade.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="rounded-xl bg-white p-4">
              <QRCodeSVG value={activityUrl} size={200} />
            </div>
            <code className="rounded-lg border bg-muted px-3 py-1.5 text-sm font-mono">
              {activity?.short_code}
            </code>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
