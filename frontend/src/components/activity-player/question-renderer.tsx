"use client"

import type { Question } from "@/lib/types"
import {
  MultipleChoiceRenderer,
  TrueFalseRenderer,
  MatchingRenderer,
  TextResponseRenderer,
  FillBlankRenderer,
  OrderingRenderer,
  CategorizationRenderer,
} from "./renderers"

interface QuestionRendererProps {
  question: Question
  answer: unknown
  onAnswerChange: (answer: unknown) => void
}

export function QuestionRenderer({
  question,
  answer,
  onAnswerChange,
}: QuestionRendererProps) {
  switch (question.question_type) {
    case "multiple_choice":
      return (
        <MultipleChoiceRenderer
          question={question}
          answer={answer as string | string[] | undefined}
          onAnswerChange={onAnswerChange}
        />
      )
    case "true_false":
      return (
        <TrueFalseRenderer
          question={question}
          answer={answer as boolean | undefined}
          onAnswerChange={onAnswerChange}
        />
      )
    case "matching":
      return (
        <MatchingRenderer
          question={question}
          answer={answer as Record<string, string> | undefined}
          onAnswerChange={onAnswerChange}
        />
      )
    case "text_response":
      return (
        <TextResponseRenderer
          question={question}
          answer={answer as string | undefined}
          onAnswerChange={onAnswerChange}
        />
      )
    case "fill_blank":
      return (
        <FillBlankRenderer
          question={question}
          answer={answer as string[] | undefined}
          onAnswerChange={onAnswerChange}
        />
      )
    case "ordering":
      return (
        <OrderingRenderer
          question={question}
          answer={answer as string[] | undefined}
          onAnswerChange={onAnswerChange}
        />
      )
    case "categorization":
      return (
        <CategorizationRenderer
          question={question}
          answer={answer as Record<string, string[]> | undefined}
          onAnswerChange={onAnswerChange}
        />
      )
    default:
      return (
        <div className="rounded-xl border bg-muted/50 p-8 text-center text-muted-foreground">
          Tipo de questao nao suportado: {question.question_type}
        </div>
      )
  }
}
