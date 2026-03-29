import apiClient from "./client"

export interface DashboardStats {
  total_modules: number
  total_lessons: number
  total_activities: number
  total_sessions: number
  total_students: number
  total_responses: number
  avg_score_percentage: number
  recent_sessions: Array<{
    id: string
    status: string
    session_type: string
    created_at: string
  }>
}

export interface QuestionAnalytics {
  question_id: string
  question_type: string
  total_responses: number
  correct_count: number
  incorrect_count: number
  accuracy_rate: number
  avg_time_seconds: number
}

export interface SessionAnalytics {
  session_id: string
  activity_title: string
  total_participants: number
  avg_score: number
  avg_time_seconds: number
  completion_rate: number
  questions: QuestionAnalytics[]
}

export interface ModuleAnalytics {
  module_id: string
  module_title: string
  total_lessons: number
  total_activities: number
  total_sessions: number
  total_students: number
  avg_score_percentage: number
  completion_rate: number
  performance_trend: number[]
}

export interface ScoreBucket {
  label: string
  count: number
}

export interface QuestionDifficulty {
  question_id: string
  question_type: string
  correct_pct: number
  avg_time_seconds: number
}

export interface ActivityAnalytics {
  activity_id: string
  activity_title: string
  total_sessions: number
  total_attempts: number
  score_distribution: ScoreBucket[]
  question_difficulty: QuestionDifficulty[]
  avg_time_per_question: number
}

export interface StudentAnalyticsData {
  student_id: string
  nickname: string | null
  total_sessions: number
  avg_score: number
  score_trend: Array<{
    session_id: string
    score_pct: number
    date: string
  }>
  strengths: Array<{
    question_type: string
    accuracy: number
    total: number
  }>
  weaknesses: Array<{
    question_type: string
    accuracy: number
    total: number
  }>
}

export interface WeekDataPoint {
  week: string
  value: number
}

export interface EngagementMetrics {
  sessions_per_week: WeekDataPoint[]
  active_students_per_week: WeekDataPoint[]
  avg_completion_rate_per_week: WeekDataPoint[]
  avg_time_per_week: WeekDataPoint[]
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data } = await apiClient.get<DashboardStats>("/api/v1/analytics/dashboard")
  return data
}

export async function getSessionAnalytics(sessionId: string): Promise<SessionAnalytics> {
  const { data } = await apiClient.get<SessionAnalytics>(
    `/api/v1/analytics/sessions/${sessionId}`
  )
  return data
}

export async function getModuleAnalytics(moduleId: string): Promise<ModuleAnalytics> {
  const { data } = await apiClient.get<ModuleAnalytics>(
    `/api/v1/analytics/modules/${moduleId}`
  )
  return data
}

export async function getActivityAnalytics(activityId: string): Promise<ActivityAnalytics> {
  const { data } = await apiClient.get<ActivityAnalytics>(
    `/api/v1/analytics/activities/${activityId}`
  )
  return data
}

export async function getStudentAnalytics(studentId: string): Promise<StudentAnalyticsData> {
  const { data } = await apiClient.get<StudentAnalyticsData>(
    `/api/v1/analytics/students/${studentId}`
  )
  return data
}

export async function getEngagement(): Promise<EngagementMetrics> {
  const { data } = await apiClient.get<EngagementMetrics>("/api/v1/analytics/engagement")
  return data
}

export async function exportSessionCSV(sessionId: string): Promise<void> {
  const response = await apiClient.get(`/api/v1/sessions/${sessionId}/export/csv`, {
    responseType: "blob",
  })
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement("a")
  link.href = url
  link.setAttribute("download", `session_${sessionId}.csv`)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}
