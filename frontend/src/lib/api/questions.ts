import apiClient from "./client"
import type { Question } from "@/lib/types"

interface QuestionOptionInput {
  content: string
  media_url?: string
  is_correct?: boolean
  sort_order?: number
  category_id?: string
  match_target_id?: string
  metadata?: Record<string, unknown>
}

export async function getQuestions(activityId: string): Promise<Question[]> {
  const { data } = await apiClient.get<Question[]>(
    `/api/v1/activities/${activityId}/questions`
  )
  return data
}

export async function createQuestion(
  activityId: string,
  body: {
    question_type: string
    content: Record<string, unknown>
    media_url?: string
    hint?: string
    explanation?: string
    points?: number
    time_limit_seconds?: number
    sort_order?: number
    config?: Record<string, unknown>
    options?: QuestionOptionInput[]
  }
): Promise<Question> {
  const { data } = await apiClient.post<Question>(
    `/api/v1/activities/${activityId}/questions`,
    body
  )
  return data
}

export async function updateQuestion(
  questionId: string,
  body: Partial<{
    question_type: string
    content: Record<string, unknown>
    media_url: string
    hint: string
    explanation: string
    points: number
    time_limit_seconds: number
    sort_order: number
    config: Record<string, unknown>
    options: QuestionOptionInput[]
  }>
): Promise<Question> {
  const { data } = await apiClient.put<Question>(
    `/api/v1/questions/${questionId}`,
    body
  )
  return data
}

export async function deleteQuestion(questionId: string): Promise<void> {
  await apiClient.delete(`/api/v1/questions/${questionId}`)
}
