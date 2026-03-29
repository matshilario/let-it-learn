"use client"

import {
  BarChart3,
  Users,
  Radio,
  Target,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { StatsCard } from "@/components/analytics/stats-card"
import { SessionsTrendChart } from "@/components/analytics/sessions-trend-chart"
import { useDashboardStats, useEngagement } from "@/lib/hooks/use-analytics"

const statusLabels: Record<string, string> = {
  waiting: "Aguardando",
  active: "Ativa",
  paused: "Pausada",
  ended: "Encerrada",
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

export default function AnalyticsPage() {
  const { data: stats, isLoading: loadingStats } = useDashboardStats()
  const { data: engagement, isLoading: loadingEngagement } = useEngagement()

  if (loadingStats || loadingEngagement) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-[380px]" />
          <Skeleton className="h-[380px]" />
        </div>
      </div>
    )
  }

  const sessionsTrendData = engagement?.sessions_per_week ?? []
  const activeStudentsData = engagement?.active_students_per_week ?? []

  // Build a simple score distribution from dashboard data
  // (In a real scenario, we'd call a dedicated endpoint. For now, show engagement data.)
  const completionData = engagement?.avg_completion_rate_per_week ?? []

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Visao geral do desempenho e engajamento
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total de Sessoes"
          value={stats?.total_sessions ?? 0}
          icon={Radio}
          color="text-purple-600 dark:text-purple-400"
          bgColor="bg-purple-100 dark:bg-purple-900/30"
          description={`${stats?.total_activities ?? 0} atividades`}
        />
        <StatsCard
          title="Total de Alunos"
          value={stats?.total_students ?? 0}
          icon={Users}
          color="text-orange-600 dark:text-orange-400"
          bgColor="bg-orange-100 dark:bg-orange-900/30"
          description={`${stats?.total_responses ?? 0} respostas`}
        />
        <StatsCard
          title="Media de Nota"
          value={`${(stats?.avg_score_percentage ?? 0).toFixed(1)}%`}
          icon={Target}
          color="text-emerald-600 dark:text-emerald-400"
          bgColor="bg-emerald-100 dark:bg-emerald-900/30"
          description="Porcentagem media geral"
        />
        <StatsCard
          title="Modulos"
          value={stats?.total_modules ?? 0}
          icon={BarChart3}
          color="text-blue-600 dark:text-blue-400"
          bgColor="bg-blue-100 dark:bg-blue-900/30"
          description={`${stats?.total_lessons ?? 0} licoes`}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SessionsTrendChart
          data={sessionsTrendData}
          title="Sessoes por Semana"
          description="Numero de sessoes nas ultimas 8 semanas"
          valueLabel="Sessoes"
        />
        <SessionsTrendChart
          data={activeStudentsData}
          title="Alunos Ativos por Semana"
          description="Alunos unicos participando nas ultimas 8 semanas"
          valueLabel="Alunos"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SessionsTrendChart
          data={completionData}
          title="Taxa de Conclusao"
          description="Porcentagem media de conclusao por semana"
          valueLabel="Conclusao %"
        />

        {/* Recent Sessions Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Sessoes Recentes</CardTitle>
            <CardDescription>Ultimas 5 sessoes criadas</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(stats?.recent_sessions ?? []).map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-xs">
                      {s.id.slice(0, 8)}
                    </TableCell>
                    <TableCell className="text-xs">
                      {s.session_type === "live" ? "Ao Vivo" : "Assincrono"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {statusLabels[s.status] ?? s.status}
                    </TableCell>
                    <TableCell className="text-xs">
                      {formatDate(s.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
                {(stats?.recent_sessions ?? []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Nenhuma sessao encontrada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
