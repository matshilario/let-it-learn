import apiClient from "./client"
import type { Session, StudentSession, PaginatedResponse } from "@/lib/types"

export async function getSessions(
  page = 1,
  pageSize = 20
): Promise<PaginatedResponse<Session>> {
  const { data } = await apiClient.get<PaginatedResponse<Session>>(
    "/api/v1/sessions/",
    { params: { page, page_size: pageSize } }
  )
  return data
}

export async function getSession(sessionId: string): Promise<Session> {
  const { data } = await apiClient.get<Session>(
    `/api/v1/sessions/${sessionId}`
  )
  return data
}

export async function createSession(body: {
  activity_id: string
  class_id?: string
  session_type?: string
  settings?: Record<string, unknown>
}): Promise<Session> {
  const { data } = await apiClient.post<Session>("/api/v1/sessions/", body)
  return data
}

export async function endSession(sessionId: string): Promise<Session> {
  const { data } = await apiClient.post<Session>(
    `/api/v1/sessions/${sessionId}/end`
  )
  return data
}

export async function getSessionResults(
  sessionId: string
): Promise<StudentSession[]> {
  const { data } = await apiClient.get<StudentSession[]>(
    `/api/v1/sessions/${sessionId}/results`
  )
  return data
}
