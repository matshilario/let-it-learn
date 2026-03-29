"use client"

import type { Question, QuestionType } from "@/lib/types"
import { MultipleChoiceEditor } from "./editors/multiple-choice-editor"
import { TrueFalseEditor } from "./editors/true-false-editor"
import { MatchingEditor } from "./editors/matching-editor"
import { TextResponseEditor } from "./editors/text-response-editor"
import { FillBlankEditor } from "./editors/fill-blank-editor"
import { OrderingEditor } from "./editors/ordering-editor"
import { CategorizationEditor } from "./editors/categorization-editor"

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  multiple_choice: "Multipla Escolha",
  true_false: "Verdadeiro ou Falso",
  matching: "Associacao",
  text_response: "Resposta em Texto",
  fill_blank: "Preencher Lacunas",
  ordering: "Ordenacao",
  categorization: "Categorizacao",
}

interface QuestionEditorProps {
  question: Question
  onUpdate: (updates: Partial<Question>) => void
}

export function QuestionEditor({ question, onUpdate }: QuestionEditorProps) {
  const label = QUESTION_TYPE_LABELS[question.question_type] || question.question_type

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold">{label}</h3>
      </div>
      <EditorByType question={question} onUpdate={onUpdate} />
    </div>
  )
}

function EditorByType({
  question,
  onUpdate,
}: {
  question: Question
  onUpdate: (updates: Partial<Question>) => void
}) {
  switch (question.question_type) {
    case "multiple_choice":
      return <MultipleChoiceEditor question={question} onUpdate={onUpdate} />
    case "true_false":
      return <TrueFalseEditor question={question} onUpdate={onUpdate} />
    case "matching":
      return <MatchingEditor question={question} onUpdate={onUpdate} />
    case "text_response":
      return <TextResponseEditor question={question} onUpdate={onUpdate} />
    case "fill_blank":
      return <FillBlankEditor question={question} onUpdate={onUpdate} />
    case "ordering":
      return <OrderingEditor question={question} onUpdate={onUpdate} />
    case "categorization":
      return <CategorizationEditor question={question} onUpdate={onUpdate} />
    default:
      return (
        <p className="text-muted-foreground">
          Editor nao disponivel para este tipo de questao.
        </p>
      )
  }
}
