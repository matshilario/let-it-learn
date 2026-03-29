"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  GraduationCap,
  Loader2,
  AlertCircle,
  Radio,
  User,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { joinSession } from "@/lib/api/play"

function JoinForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const codeFromUrl = searchParams.get("code") || ""

  const [joinCode, setJoinCode] = useState(codeFromUrl)
  const [nickname, setNickname] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("play_nickname") || ""
    }
    return ""
  })
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getAnonymousId = () => {
    let id = localStorage.getItem("anonymous_id")
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem("anonymous_id", id)
    }
    return id
  }

  const handleJoin = async () => {
    const code = joinCode.trim().toUpperCase()
    const name = nickname.trim()
    if (!code || !name) return

    try {
      setJoining(true)
      setError(null)
      const anonymousId = getAnonymousId()
      const result = await joinSession({
        join_code: code,
        nickname: name,
        anonymous_id: anonymousId,
      })

      localStorage.setItem("student_session_id", result.student_session_id)
      localStorage.setItem("play_nickname", name)

      if (result.session_type === "live") {
        router.push(
          `/live/${result.session_id}?ssid=${result.student_session_id}`
        )
      } else {
        router.push(
          `/play/${code}/session/${result.session_id}?ssid=${result.student_session_id}`
        )
      }
    } catch {
      setError("Codigo invalido ou sessao nao encontrada. Verifique e tente novamente.")
    } finally {
      setJoining(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 py-4">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Radio className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-xl">Entrar na Sessao</CardTitle>
          <CardDescription>
            Insira o codigo fornecido pelo professor para participar
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <GraduationCap className="h-4 w-4" />
            Dados de Entrada
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="join-code">Codigo da Sessao</Label>
            <Input
              id="join-code"
              placeholder="Ex: ABC123"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={8}
              className="h-14 text-center font-mono text-2xl font-bold tracking-[0.3em] uppercase"
              autoFocus={!codeFromUrl}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nickname">
              <User className="mr-1.5 inline h-3.5 w-3.5" />
              Seu Nome ou Apelido
            </Label>
            <Input
              id="nickname"
              placeholder="Ex: Maria, Joao..."
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && joinCode.trim() && nickname.trim())
                  handleJoin()
              }}
              autoFocus={!!codeFromUrl}
              className="h-12 text-base"
            />
          </div>

          <Button
            className="h-12 w-full text-base"
            size="lg"
            onClick={handleJoin}
            disabled={!joinCode.trim() || !nickname.trim() || joining}
          >
            {joining ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Entrando...
              </>
            ) : (
              "Entrar"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default function JoinPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      }
    >
      <JoinForm />
    </Suspense>
  )
}
