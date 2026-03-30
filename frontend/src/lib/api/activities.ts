import apiClient from "./client"
import type { Activity } from "@/lib/types"

export async function getActivities(lessonId: string): Promise<Activity[]> {
  const { data } = await apiClient.get<Activity[]>(
    `/api/v1/lessons/${lessonId}/activities`
  )
  return data
}

export async function getActivity(activityId: string): Promise<Activity> {
  const { data } = await apiClient.get<Activity>(
    `/api/v1/activities/${activityId}`
  )
  return data
}

export async function createActivity(
  lessonId: string,
  body: {
    title: string
    description?: string
    activity_type: string
    access_mode?: string
    sort_order?: number
    is_published?: boolean
    time_limit_seconds?: number
    max_attempts?: number
    shuffle_questions?: boolean
    shuffle_options?: boolean
    show_feedback?: boolean
    show_correct_answer?: boolean
    passing_score?: number
  }
): Promise<Activity> {
  const { data } = await apiClient.post<Activity>(
    `/api/v1/lessons/${lessonId}/activities`,
    body
  )
  return data
}

export async function updateActivity(
  activityId: string,
  body: Partial<{
    title: string
    description: string
    activity_type: string
    access_mode: string
    sort_order: number
    is_published: boolean
    time_limit_seconds: number
    max_attempts: number
    shuffle_questions: boolean
    shuffle_options: boolean
    show_feedback: boolean
    show_correct_answer: boolean
    passing_score: number
    gamification: Record<string, unknown>
  }>
): Promise<Activity> {
  const { data } = await apiClient.put<Activity>(
    `/api/v1/activities/${activityId}`,
    body
  )
  return data
}

export async function deleteActivity(activityId: string): Promise<void> {
  await apiClient.delete(`/api/v1/activities/${activityId}`)
}

export async function getActivityByCode(code: string): Promise<Activity> {
  const { data } = await apiClient.get<Activity>(
    `/api/v1/activities/by-code/${code}`
  )
  return data
}

export async function getAllTeacherActivities(): Promise<Activity[]> {
  const { data } = await apiClient.get<Activity[]>(
    "/api/v1/activities/"
  )
  return data
}
