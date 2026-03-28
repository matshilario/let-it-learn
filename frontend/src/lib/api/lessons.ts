import apiClient from "./client"
import type { Lesson } from "@/lib/types"

export async function getLessons(moduleId: string): Promise<Lesson[]> {
  const { data } = await apiClient.get<Lesson[]>(
    `/api/v1/modules/${moduleId}/lessons`
  )
  return data
}

export async function getLesson(lessonId: string): Promise<Lesson> {
  const { data } = await apiClient.get<Lesson>(`/api/v1/lessons/${lessonId}`)
  return data
}

export async function createLesson(
  moduleId: string,
  body: {
    title: string
    description?: string
    sort_order?: number
    is_published?: boolean
  }
): Promise<Lesson> {
  const { data } = await apiClient.post<Lesson>(
    `/api/v1/modules/${moduleId}/lessons`,
    body
  )
  return data
}

export async function updateLesson(
  lessonId: string,
  body: Partial<{
    title: string
    description: string
    sort_order: number
    is_published: boolean
  }>
): Promise<Lesson> {
  const { data } = await apiClient.put<Lesson>(
    `/api/v1/lessons/${lessonId}`,
    body
  )
  return data
}

export async function deleteLesson(lessonId: string): Promise<void> {
  await apiClient.delete(`/api/v1/lessons/${lessonId}`)
}
