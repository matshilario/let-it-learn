"use client"

import { useSession } from "next-auth/react"
import Link from "next/link"
import {
  BookOpen,
  Gamepad2,
  Radio,
  Users,
  Plus,
  ArrowRight,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

const stats = [
  {
    title: "Modulos",
    value: "12",
    description: "3 publicados",
    icon: BookOpen,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
  {
    title: "Atividades",
    value: "48",
    description: "32 publicadas",
    icon: Gamepad2,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
  },
  {
    title: "Sessoes",
    value: "156",
    description: "5 ativas agora",
    icon: Radio,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
  },
  {
    title: "Alunos",
    value: "1.2k",
    description: "89 esta semana",
    icon: Users,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
  },
]

const recentActivities = [
  {
    title: "Quiz de Matematica - Fracoes",
    type: "Quiz",
    date: "Hoje, 14:30",
    students: 28,
  },
  {
    title: "Pratica de Ingles - Verbos",
    type: "Pratica",
    date: "Hoje, 10:15",
    students: 32,
  },
  {
    title: "Sessao ao vivo - Ciencias",
    type: "Sessao ao vivo",
    date: "Ontem, 16:00",
    students: 25,
  },
  {
    title: "Quiz de Historia - Brasil Colonial",
    type: "Quiz",
    date: "Ontem, 09:45",
    students: 30,
  },
]

export default function DashboardPage() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  const firstName = session?.user?.name?.split(" ")[0] || "Professor"

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Ola, {firstName}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Veja o que esta acontecendo com suas atividades hoje.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`rounded-lg p-2 ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activities */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Atividades recentes</CardTitle>
            <CardDescription>
              Suas ultimas sessoes e atividades
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {activity.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.type} - {activity.date}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    {activity.students}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Acoes rapidas</CardTitle>
            <CardDescription>Comece algo novo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline" render={<Link href="/modules" />}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Modulo
                <ArrowRight className="ml-auto h-4 w-4" />
            </Button>
            <Button className="w-full justify-start" variant="outline" render={<Link href="/modules" />}>
                <Gamepad2 className="mr-2 h-4 w-4" />
                Criar Atividade
                <ArrowRight className="ml-auto h-4 w-4" />
            </Button>
            <Button className="w-full justify-start" variant="outline" render={<Link href="/sessions" />}>
                <Radio className="mr-2 h-4 w-4" />
                Iniciar Sessao
                <ArrowRight className="ml-auto h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
