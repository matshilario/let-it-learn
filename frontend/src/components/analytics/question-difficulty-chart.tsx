"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface QuestionDifficultyData {
  question_id: string
  question_type: string
  correct_pct: number
  avg_time_seconds: number
}

interface QuestionDifficultyChartProps {
  data: QuestionDifficultyData[]
  title?: string
  description?: string
}

export function QuestionDifficultyChart({
  data,
  title = "Dificuldade por Questao",
  description = "Porcentagem de acerto por questao",
}: QuestionDifficultyChartProps) {
  const chartData = data.map((d, i) => ({
    name: `Q${i + 1}`,
    correct_pct: d.correct_pct,
    type: d.question_type,
    time: d.avg_time_seconds,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-muted"
              />
              <XAxis
                type="number"
                domain={[0, 100]}
                className="text-xs fill-muted-foreground"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(v: number) => `${v}%`}
              />
              <YAxis
                type="category"
                dataKey="name"
                className="text-xs fill-muted-foreground"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  color: "hsl(var(--card-foreground))",
                }}
                labelStyle={{ color: "hsl(var(--card-foreground))" }}
                formatter={(value) => [`${Number(value).toFixed(1)}%`, "Acerto"]}
              />
              <Bar
                dataKey="correct_pct"
                name="% Acerto"
                fill="hsl(var(--primary))"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
