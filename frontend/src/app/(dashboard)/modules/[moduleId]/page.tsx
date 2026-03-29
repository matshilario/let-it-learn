"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  Plus,
  FileText,
  MoreVertical,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  BookOpen,
  ArrowLeft,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { useLessons, useCreateLesson, useDeleteLesson } from "@/lib/hooks/use-lessons"

export default function ModuleDetailPage() {
  const params = useParams<{ moduleId: string }>()
  const moduleId = params.moduleId

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newLessonTitle, setNewLessonTitle] = useState("")
  const [newLessonDescription, setNewLessonDescription] = useState("")

  const { data: mod, isLoading: moduleLoading } = useModule(moduleId)
  const { data: lessons, isLoading: lessonsLoading } = useLessons(moduleId)
  const createLesson = useCreateLesson()
  const deleteLesson = useDeleteLesson()

  const isLoading = moduleLoading || lessonsLoading

  const handleCreate = async () => {
    if (!newLessonTitle.trim()) return
    try {
      await createLesson.mutateAsync({
        moduleId,
        body: {
          title: newLessonTitle,
          description: newLessonDescription || undefined,
        },
      })
      setNewLessonTitle("")
      setNewLessonDescription("")
      setCreateDialogOpen(false)
    } catch {
      // Error handled by react-query
    }
  }

  const handleDelete = async (lessonId: string) => {
    try {
      await deleteLesson.mutateAsync(lessonId)
    } catch {
      // Error handled by react-query
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-5 w-48" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-9 w-36" />
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
            <BreadcrumbPage>{mod?.title || "Modulo"}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <Button variant="ghost" size="icon" render={<Link href="/modules" />}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {mod?.title}
              </h1>
              {mod?.description && (
                <p className="text-muted-foreground mt-1">
                  {mod.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 ml-11">
            <Badge variant={mod?.is_published ? "default" : "secondary"}>
              {mod?.is_published ? (
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
              {lessons?.length || 0} aula{(lessons?.length || 0) !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Aula
        </Button>
      </div>

      {/* Empty state */}
      {(!lessons || lessons.length === 0) && (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <BookOpen className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-xl mb-2">Nenhuma aula ainda</CardTitle>
          <CardDescription className="max-w-sm mb-6">
            Comece criando sua primeira aula para organizar suas atividades.
          </CardDescription>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Criar primeira aula
          </Button>
        </Card>
      )}

      {/* Lessons grid */}
      {lessons && lessons.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {lessons.map((lesson) => (
            <Card
              key={lesson.id}
              className="group relative transition-shadow hover:shadow-md"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/modules/${moduleId}/lessons/${lesson.id}`}
                      className="hover:underline"
                    >
                      <CardTitle className="text-lg truncate">
                        {lesson.title}
                      </CardTitle>
                    </Link>
                    {lesson.description && (
                      <CardDescription className="mt-1 line-clamp-2">
                        {lesson.description}
                      </CardDescription>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <button className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-medium transition-all hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" />
                      }
                    >
                      <MoreVertical className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        render={
                          <Link
                            href={`/modules/${moduleId}/lessons/${lesson.id}`}
                          />
                        }
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Ver detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDelete(lesson.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" />
                    <span>0 atividades</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Badge variant={lesson.is_published ? "default" : "secondary"}>
                  {lesson.is_published ? (
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
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Aula</DialogTitle>
            <DialogDescription>
              Crie uma nova aula para organizar suas atividades.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="lesson-title">Titulo</Label>
              <Input
                id="lesson-title"
                placeholder="Ex: Equacoes do 2o Grau"
                value={newLessonTitle}
                onChange={(e) => setNewLessonTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lesson-description">Descricao (opcional)</Label>
              <Input
                id="lesson-description"
                placeholder="Uma breve descricao da aula"
                value={newLessonDescription}
                onChange={(e) => setNewLessonDescription(e.target.value)}
              />
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
              disabled={!newLessonTitle.trim() || createLesson.isPending}
            >
              {createLesson.isPending ? "Criando..." : "Criar Aula"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
