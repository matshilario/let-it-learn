"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Plus,
  Users,
  Copy,
  Check,
  Loader2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card"
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
import { Badge } from "@/components/ui/badge"
import { useClasses, useCreateClass } from "@/lib/hooks/use-classes"

export default function ClassesPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [className, setClassName] = useState("")
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const { data: classes, isLoading, error } = useClasses()
  const createClass = useCreateClass()

  const handleCreate = async () => {
    if (!className.trim()) return
    try {
      await createClass.mutateAsync({ name: className.trim() })
      setClassName("")
      setCreateDialogOpen(false)
    } catch {
      // Error handled by react-query
    }
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-9 w-36" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg text-destructive">
          Erro ao carregar turmas. Tente novamente.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Turmas</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie suas turmas e alunos
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Turma
        </Button>
      </div>

      {/* Empty state */}
      {(!classes || classes.length === 0) && (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-xl mb-2">Nenhuma turma ainda</CardTitle>
          <CardDescription className="max-w-sm mb-6">
            Crie sua primeira turma para organizar seus alunos e acompanhar o
            desempenho.
          </CardDescription>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Criar primeira turma
          </Button>
        </Card>
      )}

      {/* Class list */}
      {classes && classes.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {classes.map((cls) => (
            <Card
              key={cls.id}
              className="group transition-shadow hover:shadow-md"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{cls.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant={cls.is_active ? "default" : "secondary"}>
                          {cls.is_active ? "Ativa" : "Inativa"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    <span>{cls.students?.length ?? 0} alunos</span>
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 font-mono font-bold text-primary hover:underline text-xs"
                    onClick={() => handleCopyCode(cls.join_code)}
                  >
                    Codigo: {cls.join_code}
                    {copiedCode === cls.join_code ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  render={<Link href={`/classes/${cls.id}`} />}
                >
                  Ver Turma
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={(open) => { if (!open) { setCreateDialogOpen(false); setClassName("") } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Turma</DialogTitle>
            <DialogDescription>
              Crie uma nova turma para organizar seus alunos.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="class-name">Nome da Turma</Label>
              <Input
                id="class-name"
                placeholder="Ex: 8o Ano A - Matematica"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleCreate() }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateDialogOpen(false); setClassName("") }}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!className.trim() || createClass.isPending}
            >
              {createClass.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar Turma"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
