import apiClient from "./client"
import type { Session, StudentSession, PaginatedResponse } from "@/lib/types"

export interface LeaderboardEntry {
  student_session_id: string
  nickname: string
  score: number
  questions_answered: number
  rank: number
}

export async function getSessions(
  page = 1,
  pageSize = 20,
  status?: string
): Promise<PaginatedResponse<Session>> {
  const { data } = await apiClient.get<PaginatedResponse<Session>>(
    "/api/v1/sessions/",
    { params: { page, page_size: pageSize, ...(status && status !== "all" ? { status } : {}) } }
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

export async function startLiveSession(sessionId: string): Promise<Session> {
  const { data } = await apiClient.post<Session>(
    `/api/v1/sessions/${sessionId}/start-live`
  )
  return data
}

export async function nextQuestion(sessionId: string): Promise<Session> {
  const { data } = await apiClient.post<Session>(
    `/api/v1/sessions/${sessionId}/next-question`
  )
  return data
}

export async function prevQuestion(sessionId: string): Promise<Session> {
  const { data } = await apiClient.post<Session>(
    `/api/v1/sessions/${sessionId}/prev-question`
  )
  return data
}

export async function lockSubmissions(sessionId: string): Promise<Session> {
  const { data } = await apiClient.post<Session>(
    `/api/v1/sessions/${sessionId}/lock`
  )
  return data
}

export async function unlockSubmissions(sessionId: string): Promise<Session> {
  const { data } = await apiClient.post<Session>(
    `/api/v1/sessions/${sessionId}/unlock`
  )
  return data
}

export async function getLeaderboard(
  sessionId: string
): Promise<LeaderboardEntry[]> {
  const { data } = await apiClient.get<LeaderboardEntry[]>(
    `/api/v1/sessions/${sessionId}/leaderboard`
  )
  return data
}
