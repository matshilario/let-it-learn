import Link from "next/link"
import {
  GraduationCap,
  ListChecks,
  ToggleLeft,
  Link2,
  Type,
  TextCursorInput,
  ArrowUpDown,
  LayoutGrid,
  Radio,
  BarChart3,
  Trophy,
  Zap,
} from "lucide-react"

const activityTypes = [
  {
    icon: ListChecks,
    title: "Multipla Escolha",
    description: "Questoes com varias opcoes de resposta",
  },
  {
    icon: ToggleLeft,
    title: "Verdadeiro ou Falso",
    description: "Afirmacoes para avaliar conhecimento",
  },
  {
    icon: Link2,
    title: "Associacao",
    description: "Conecte pares correspondentes",
  },
  {
    icon: Type,
    title: "Resposta em Texto",
    description: "Respostas escritas pelos alunos",
  },
  {
    icon: TextCursorInput,
    title: "Preencher Lacunas",
    description: "Complete o texto com as palavras certas",
  },
  {
    icon: ArrowUpDown,
    title: "Ordenacao",
    description: "Coloque os itens na sequencia correta",
  },
  {
    icon: LayoutGrid,
    title: "Categorizacao",
    description: "Classifique itens em suas categorias",
  },
]

const features = [
  {
    icon: Radio,
    title: "Sessoes em Tempo Real",
    description:
      "Acompanhe as respostas dos alunos ao vivo e adapte suas aulas.",
  },
  {
    icon: BarChart3,
    title: "Analytics Detalhado",
    description:
      "Visualize o desempenho dos alunos com graficos e relatorios.",
  },
  {
    icon: Trophy,
    title: "Gamificacao",
    description:
      "Pontos, rankings e conquistas para motivar a aprendizagem.",
  },
  {
    icon: Zap,
    title: "Rapido e Facil",
    description:
      "Crie atividades em minutos com nosso editor intuitivo.",
  },
]

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold">Let It Learn</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Comecar Gratis
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-4 py-20 text-center sm:py-32">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm">
            <Zap className="h-4 w-4 text-primary" />
            Plataforma de Ensino Interativo
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Transforme suas aulas com{" "}
            <span className="text-primary">atividades interativas</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Crie quizzes, exercicios e sessoes ao vivo para engajar seus alunos.
            Acompanhe o progresso em tempo real e personalize o aprendizado.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Comecar Gratis
            </Link>
            <Link
              href="#features"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-input bg-background px-6 text-sm font-medium transition-colors hover:bg-muted"
            >
              Ver Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Activity Types */}
      <section className="border-t bg-muted/30 px-4 py-20" id="features">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              7 tipos de atividades
            </h2>
            <p className="mt-3 text-lg text-muted-foreground">
              Diversifique suas aulas com diferentes formatos de questoes
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {activityTypes.map((type) => {
              const Icon = type.icon
              return (
                <div
                  key={type.title}
                  className="group rounded-xl border bg-background p-5 transition-all hover:shadow-md hover:border-primary/20"
                >
                  <div className="mb-3 inline-flex rounded-lg bg-primary/10 p-2.5">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1">{type.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {type.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Tudo que voce precisa
            </h2>
            <p className="mt-3 text-lg text-muted-foreground">
              Ferramentas poderosas para criar experiencias de aprendizado
              inesqueciveis
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className="rounded-xl border bg-background p-6 text-center transition-all hover:shadow-md"
                >
                  <div className="mx-auto mb-4 inline-flex rounded-full bg-primary/10 p-3">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-muted/30 px-4 py-20">
        <div className="mx-auto max-w-2xl text-center space-y-6">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Pronto para transformar suas aulas?
          </h2>
          <p className="text-lg text-muted-foreground">
            Junte-se a milhares de professores que ja usam o Let It Learn.
          </p>
          <Link
            href="/register"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Comecar Gratis
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-4 py-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground">
              <GraduationCap className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold">Let It Learn</span>
          </div>
          <p className="text-xs text-muted-foreground">
            &copy; 2026 Let It Learn. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
