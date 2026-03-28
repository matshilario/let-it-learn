"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Plus,
  BookOpen,
  MoreVertical,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  FileText,
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
import { useModules, useCreateModule, useDeleteModule, useDuplicateModule } from "@/lib/hooks/use-modules"

export default function ModulesPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newModuleTitle, setNewModuleTitle] = useState("")
  const [newModuleDescription, setNewModuleDescription] = useState("")

  const { data, isLoading, error } = useModules()
  const createModule = useCreateModule()
  const deleteModule = useDeleteModule()
  const duplicateModule = useDuplicateModule()

  const modules = data?.items || []

  const handleCreate = async () => {
    if (!newModuleTitle.trim()) return
    try {
      await createModule.mutateAsync({
        title: newModuleTitle,
        description: newModuleDescription || undefined,
      })
      setNewModuleTitle("")
      setNewModuleDescription("")
      setCreateDialogOpen(false)
    } catch {
      // Error handled by react-query
    }
  }

  const handleDelete = async (moduleId: string) => {
    try {
      await deleteModule.mutateAsync(moduleId)
    } catch {
      // Error handled by react-query
    }
  }

  const handleDuplicate = async (moduleId: string) => {
    try {
      await duplicateModule.mutateAsync(moduleId)
    } catch {
      // Error handled by react-query
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-9 w-36" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg text-destructive">
          Erro ao carregar modulos. Tente novamente.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meus Modulos</h1>
          <p className="text-muted-foreground mt-1">
            Organize seu conteudo em modulos e aulas
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Modulo
        </Button>
      </div>

      {/* Empty state */}
      {modules.length === 0 && (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <BookOpen className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-xl mb-2">
            Nenhum modulo ainda
          </CardTitle>
          <CardDescription className="max-w-sm mb-6">
            Comece criando seu primeiro modulo para organizar suas aulas e
            atividades.
          </CardDescription>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Criar primeiro modulo
          </Button>
        </Card>
      )}

      {/* Modules grid */}
      {modules.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((mod) => (
            <Card
              key={mod.id}
              className="group relative transition-shadow hover:shadow-md"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">
                      {mod.title}
                    </CardTitle>
                    {mod.description && (
                      <CardDescription className="mt-1 line-clamp-2">
                        {mod.description}
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
                      <DropdownMenuItem render={<Link href={`/modules/${mod.id}`} />}>
                          <FileText className="mr-2 h-4 w-4" />
                          Ver detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDuplicate(mod.id)}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDelete(mod.id)}
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
                    <span>0 aulas</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Badge variant={mod.is_published ? "default" : "secondary"}>
                  {mod.is_published ? (
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
            <DialogTitle>Novo Modulo</DialogTitle>
            <DialogDescription>
              Crie um novo modulo para organizar suas aulas.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="title">Titulo</Label>
              <Input
                id="title"
                placeholder="Ex: Matematica - 9o Ano"
                value={newModuleTitle}
                onChange={(e) => setNewModuleTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descricao (opcional)</Label>
              <Input
                id="description"
                placeholder="Uma breve descricao do modulo"
                value={newModuleDescription}
                onChange={(e) => setNewModuleDescription(e.target.value)}
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
              disabled={!newModuleTitle.trim() || createModule.isPending}
            >
              {createModule.isPending ? "Criando..." : "Criar Modulo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
