import { GraduationCap } from "lucide-react"

export default function PlayLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background to-muted/30">
      <header className="flex items-center justify-center py-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <GraduationCap className="h-5 w-5" />
          <span className="text-sm font-medium">Let It Learn</span>
        </div>
      </header>
      <main className="flex flex-1 flex-col items-center px-4 pb-8">
        <div className="w-full max-w-2xl">{children}</div>
      </main>
    </div>
  )
}
