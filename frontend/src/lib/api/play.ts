import apiClient from "./client"
import type { Activity, Question, StudentSession } from "@/lib/types"

export interface PlayActivityInfo {
  activity: Activity
  questions: Question[]
  session_id?: string
}

export interface JoinRequest {
  join_code: string
  nickname?: string
  student_id?: string
  anonymous_id?: string
}

export interface JoinResponse {
  session_id: string
  student_session_id: string
  session_type: string
}

export interface AnswerRequest {
  question_id: string
  answer: Record<string, unknown>
  time_spent_seconds: number
}

export interface AnswerResponse {
  is_correct: boolean | null
  points_earned: number
  correct_answer?: Record<string, unknown>
  time_bonus: number
  streak_multiplier: number
  streak_count: number
  xp_earned: number
}

export interface ResultsResponse {
  student_session: StudentSession
  responses: Array<{
    question_id: string
    answer: Record<string, unknown>
    is_correct: boolean | null
    points_earned: number
    time_spent_seconds: number
    correct_answer?: Record<string, unknown>
  }>
  questions: Question[]
}

export async function getActivityByCode(
  shortCode: string
): Promise<PlayActivityInfo> {
  const { data } = await apiClient.get<PlayActivityInfo>(
    `/api/v1/play/${shortCode}`
  )
  return data
}

export async function joinSession(body: JoinRequest): Promise<JoinResponse> {
  const { data } = await apiClient.post<JoinResponse>("/api/v1/play/join", body)
  return data
}

export async function startStudentSession(
  sessionId: string,
  studentSessionId: string
): Promise<{ questions: Question[] }> {
  const { data } = await apiClient.post<{ questions: Question[] }>(
    `/api/v1/play/${sessionId}/start`,
    null,
    { params: { student_session_id: studentSessionId } }
  )
  return data
}

export async function submitAnswer(
  sessionId: string,
  studentSessionId: string,
  body: AnswerRequest
): Promise<AnswerResponse> {
  const { data } = await apiClient.post<AnswerResponse>(
    `/api/v1/play/${sessionId}/answer`,
    body,
    { params: { student_session_id: studentSessionId } }
  )
  return data
}

export async function completeSession(
  sessionId: string,
  studentSessionId: string
): Promise<StudentSession> {
  const { data } = await apiClient.post<StudentSession>(
    `/api/v1/play/${sessionId}/complete`,
    null,
    { params: { student_session_id: studentSessionId } }
  )
  return data
}

export async function getResults(
  sessionId: string,
  studentSessionId: string
): Promise<ResultsResponse> {
  const { data } = await apiClient.get<ResultsResponse>(
    `/api/v1/play/${sessionId}/results`,
    { params: { student_session_id: studentSessionId } }
  )
  return data
}
