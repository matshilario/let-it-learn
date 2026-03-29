"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  Plus,
  Eye,
  EyeOff,
  ArrowLeft,
  ListChecks,
  ToggleLeft,
  Link2,
  Type,
  TextCursorInput,
  ArrowUpDown,
  LayoutGrid,
  Puzzle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
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
import { useActivities, useCreateActivity } from "@/lib/hooks/use-activities"
import type { ActivityType } from "@/lib/types"

const ACTIVITY_TYPES: {
  value: ActivityType
  label: string
  icon: React.ElementType
}[] = [
  { value: "quiz", label: "Quiz", icon: ListChecks },
  { value: "practice", label: "Pratica", icon: Puzzle },
  { value: "live_session", label: "Sessao ao Vivo", icon: ToggleLeft },
]

const QUESTION_TYPE_LABELS: Record<string, { label: string; icon: React.ElementType }> = {
  multiple_choice: { label: "Multipla Escolha", icon: ListChecks },
  true_false: { label: "Verdadeiro/Falso", icon: ToggleLeft },
  matching: { label: "Associacao", icon: Link2 },
  text_response: { label: "Resposta em Texto", icon: Type },
  fill_blank: { label: "Preencher Lacunas", icon: TextCursorInput },
  ordering: { label: "Ordenacao", icon: ArrowUpDown },
  categorization: { label: "Categorizacao", icon: LayoutGrid },
}

const ACCESS_MODES = [
  { value: "open", label: "Aberto" },
  { value: "authenticated", label: "Autenticado" },
]

export default function LessonDetailPage() {
  const params = useParams<{ moduleId: string; lessonId: string }>()
  const { moduleId, lessonId } = params

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newActivityTitle, setNewActivityTitle] = useState("")
  const [newActivityType, setNewActivityType] = useState<ActivityType>("quiz")
  const [newAccessMode, setNewAccessMode] = useState("open")

  const { data: mod } = useModule(moduleId)
  const { data: lesson, isLoading: lessonLoading } = useLesson(lessonId)
  const { data: activities, isLoading: activitiesLoading } = useActivities(lessonId)
  const createActivity = useCreateActivity()

  const isLoading = lessonLoading || activitiesLoading

  const handleCreate = async () => {
    if (!newActivityTitle.trim()) return
    try {
      await createActivity.mutateAsync({
        lessonId,
        body: {
          title: newActivityTitle,
          activity_type: newActivityType,
          access_mode: newAccessMode,
        },
      })
      setNewActivityTitle("")
      setNewActivityType("quiz")
      setNewAccessMode("open")
      setCreateDialogOpen(false)
    } catch {
      // Error handled by react-query
    }
  }

  const getActivityTypeInfo = (type: string) => {
    return ACTIVITY_TYPES.find((t) => t.value === type) || ACTIVITY_TYPES[0]
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-5 w-64" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-9 w-40" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
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
            <BreadcrumbPage>{lesson?.title || "Aula"}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <Button
              variant="ghost"
              size="icon"
              render={<Link href={`/modules/${moduleId}`} />}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {lesson?.title}
              </h1>
              {lesson?.description && (
                <p className="text-muted-foreground mt-1">
                  {lesson.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 ml-11">
            <Badge variant={lesson?.is_published ? "default" : "secondary"}>
              {lesson?.is_published ? (
                <>
                  <Eye className="mr-1 h-3 w-3" />
                  Publicado
                </>
              ) : (
                <>
                  <EyeOff className="mr-1 h-3 w-3" />
                  Rascunho
                </>
              )}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {activities?.length || 0} atividade{(activities?.length || 0) !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Atividade
        </Button>
      </div>

      {/* Empty state */}
      {(!activities || activities.length === 0) && (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Puzzle className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-xl mb-2">
            Nenhuma atividade ainda
          </CardTitle>
          <CardDescription className="max-w-sm mb-6">
            Comece criando sua primeira atividade interativa para seus alunos.
          </CardDescription>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Criar primeira atividade
          </Button>
        </Card>
      )}

      {/* Activities grid */}
      {activities && activities.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {activities.map((activity) => {
            const typeInfo = getActivityTypeInfo(activity.activity_type)
            const TypeIcon = typeInfo.icon
            return (
              <Link
                key={activity.id}
                href={`/modules/${moduleId}/lessons/${lessonId}/activities/${activity.id}`}
                className="block"
              >
                <Card className="group relative transition-all hover:shadow-md hover:border-primary/20">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate group-hover:text-primary transition-colors">
                          {activity.title}
                        </CardTitle>
                        {activity.description && (
                          <CardDescription className="mt-1 line-clamp-2">
                            {activity.description}
                          </CardDescription>
                        )}
                      </div>
                      <div className="rounded-lg bg-muted p-2">
                        <TypeIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardFooter className="pt-0 flex flex-wrap gap-2">
                    <Badge variant="outline">{typeInfo.label}</Badge>
                    <Badge variant="secondary">
                      {activity.access_mode === "open"
                        ? "Aberto"
                        : "Autenticado"}
                    </Badge>
                    <Badge
                      variant={
                        activity.is_published ? "default" : "secondary"
                      }
                    >
                      {activity.is_published ? (
                        <>
                          <Eye className="mr-1 h-3 w-3" />
                          Publicado
                        </>
                      ) : (
                        <>
                          <EyeOff className="mr-1 h-3 w-3" />
                          Rascunho
                        </>
                      )}
                    </Badge>
                    {activity.short_code && (
                      <Badge variant="outline" className="font-mono text-xs">
                        {activity.short_code}
                      </Badge>
                    )}
                  </CardFooter>
                </Card>
              </Link>
            )
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Atividade</DialogTitle>
            <DialogDescription>
              Crie uma nova atividade interativa para seus alunos.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="activity-title">Titulo</Label>
              <Input
                id="activity-title"
                placeholder="Ex: Quiz de Revisao"
                value={newActivityTitle}
                onChange={(e) => setNewActivityTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Atividade</Label>
              <div className="grid grid-cols-3 gap-2">
                {ACTIVITY_TYPES.map((type) => {
                  const Icon = type.icon
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setNewActivityType(type.value)}
                      className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-sm transition-all hover:bg-muted ${
                        newActivityType === type.value
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-xs font-medium">{type.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Modo de Acesso</Label>
              <div className="grid grid-cols-2 gap-2">
                {ACCESS_MODES.map((mode) => (
                  <button
                    key={mode.value}
                    type="button"
                    onClick={() => setNewAccessMode(mode.value)}
                    className={`rounded-lg border p-2.5 text-sm font-medium transition-all hover:bg-muted ${
                      newAccessMode === mode.value
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border"
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!newActivityTitle.trim() || createActivity.isPending}
            >
              {createActivity.isPending ? "Criando..." : "Criar Atividade"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
