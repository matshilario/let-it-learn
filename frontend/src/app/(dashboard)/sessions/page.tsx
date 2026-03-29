"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Plus,
  Radio,
  Users,
  Clock,
  Copy,
  Check,
  Loader2,
  Filter,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useSessions, useCreateSession } from "@/lib/hooks/use-sessions"
import { getAllTeacherActivities } from "@/lib/api/activities"
import type { Activity, SessionStatus, SessionType } from "@/lib/types"

const statusLabels: Record<SessionStatus, string> = {
  waiting: "Aguardando",
  active: "Ativa",
  paused: "Pausada",
  ended: "Encerrada",
}

const statusVariants: Record<SessionStatus, "default" | "secondary" | "destructive" | "outline"> = {
  waiting: "outline",
  active: "default",
  paused: "secondary",
  ended: "destructive",
}

const typeLabels: Record<SessionType, string> = {
  live: "Ao Vivo",
  async: "Assincrono",
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function SessionsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [selectedActivityId, setSelectedActivityId] = useState("")
  const [selectedSessionType, setSelectedSessionType] = useState<string>("live")
  const [activities, setActivities] = useState<Activity[]>([])
  const [loadingActivities, setLoadingActivities] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [createdJoinCode, setCreatedJoinCode] = useState<string | null>(null)

  const { data, isLoading, error } = useSessions(1, 50, statusFilter)
  const createSession = useCreateSession()

  const sessions = data?.items || []

  useEffect(() => {
    if (createDialogOpen && activities.length === 0) {
      setLoadingActivities(true)
      getAllTeacherActivities()
        .then(setActivities)
        .catch(() => {})
        .finally(() => setLoadingActivities(false))
    }
  }, [createDialogOpen, activities.length])

  const handleCreate = async () => {
    if (!selectedActivityId) return
    try {
      const session = await createSession.mutateAsync({
        activity_id: selectedActivityId,
        session_type: selectedSessionType,
      })
      setCreatedJoinCode(session.join_code || null)
      if (!session.join_code) {
        setCreateDialogOpen(false)
      }
    } catch {
      // Error handled by react-query
    }
  }

  const handleCloseCreate = () => {
    setCreateDialogOpen(false)
    setSelectedActivityId("")
    setSelectedSessionType("live")
    setCreatedJoinCode(null)
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
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg text-destructive">
          Erro ao carregar sessoes. Tente novamente.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sessoes</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie sessoes ao vivo e assincronas
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Sessao
        </Button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={statusFilter} onValueChange={(v) => { if (v) setStatusFilter(v) }}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="waiting">Aguardando</SelectItem>
            <SelectItem value="active">Ativas</SelectItem>
            <SelectItem value="ended">Encerradas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Empty state */}
      {sessions.length === 0 && (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Radio className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-xl mb-2">Nenhuma sessao ainda</CardTitle>
          <CardDescription className="max-w-sm mb-6">
            Crie sua primeira sessao para comecar a engajar seus alunos em tempo
            real.
          </CardDescription>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Criar primeira sessao
          </Button>
        </Card>
      )}

      {/* Session list */}
      {sessions.length > 0 && (
        <div className="space-y-3">
          {sessions.map((session) => (
            <Card
              key={session.id}
              className="group transition-shadow hover:shadow-md"
            >
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div
                    className={
                      session.session_type === "live"
                        ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30"
                        : "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30"
                    }
                  >
                    {session.session_type === "live" ? (
                      <Radio className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    ) : (
                      <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">
                        Sessao #{session.id.slice(0, 8)}
                      </p>
                      <Badge variant={statusVariants[session.status]}>
                        {statusLabels[session.status]}
                      </Badge>
                      <Badge variant="outline">
                        {typeLabels[session.session_type]}
                      </Badge>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{formatDate(session.created_at)}</span>
                      {session.join_code && (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 font-mono font-bold text-primary hover:underline"
                          onClick={() => handleCopyCode(session.join_code!)}
                        >
                          {session.join_code}
                          {copiedCode === session.join_code ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    render={<Link href={`/sessions/${session.id}`} />}
                  >
                    {session.status === "active" || session.status === "waiting"
                      ? "Monitorar"
                      : "Ver Resultados"}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={(open) => { if (!open) handleCloseCreate() }}>
        <DialogContent>
          {createdJoinCode ? (
            <>
              <DialogHeader>
                <DialogTitle>Sessao Criada!</DialogTitle>
                <DialogDescription>
                  Compartilhe o codigo abaixo com seus alunos para que eles
                  possam entrar na sessao.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="rounded-xl bg-muted px-8 py-4">
                  <p className="text-center font-mono text-4xl font-bold tracking-[0.3em]">
                    {createdJoinCode}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => handleCopyCode(createdJoinCode)}
                  className="gap-2"
                >
                  {copiedCode === createdJoinCode ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copiar Codigo
                    </>
                  )}
                </Button>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={handleCloseCreate}>
                  Fechar
                </Button>
                <Button
                  render={
                    <Link
                      href={`/sessions/${createSession.data?.id}`}
                    />
                  }
                >
                  Ir para Monitor
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Nova Sessao</DialogTitle>
                <DialogDescription>
                  Crie uma nova sessao para seus alunos.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Atividade</Label>
                  {loadingActivities ? (
                    <Skeleton className="h-8 w-full" />
                  ) : (
                    <Select
                      value={selectedActivityId}
                      onValueChange={(v) => { if (v) setSelectedActivityId(v) }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione uma atividade" />
                      </SelectTrigger>
                      <SelectContent>
                        {activities
                          .filter((a) => a.is_published)
                          .map((activity) => (
                            <SelectItem key={activity.id} value={activity.id}>
                              {activity.title}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Sessao</Label>
                  <Select
                    value={selectedSessionType}
                    onValueChange={(v) => { if (v) setSelectedSessionType(v) }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="live">
                        <div className="flex items-center gap-2">
                          <Radio className="h-3.5 w-3.5" />
                          Ao Vivo
                        </div>
                      </SelectItem>
                      <SelectItem value="async">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5" />
                          Assincrono
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={handleCloseCreate}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={
                    !selectedActivityId || createSession.isPending
                  }
                >
                  {createSession.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    "Criar Sessao"
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
