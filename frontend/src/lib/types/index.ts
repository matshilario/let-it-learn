export type ActivityType = "quiz" | "practice" | "live_session"

export type QuestionType =
  | "text_response"
  | "multiple_choice"
  | "matching"
  | "true_false"
  | "fill_blank"
  | "ordering"
  | "categorization"

export type AccessMode = "open" | "authenticated"

export type SessionType = "live" | "async"

export type SessionStatus = "waiting" | "active" | "paused" | "ended"

export type StudentSessionStatus = "joined" | "in_progress" | "completed" | "abandoned"

export interface Teacher {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  locale: string
  timezone: string | null
  plan: string
  is_active: boolean
  email_verified: boolean
  created_at: string
  updated_at: string
}

export interface Module {
  id: string
  teacher_id: string
  title: string
  description: string | null
  cover_image_url: string | null
  is_published: boolean
  sort_order: number
  settings: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface Lesson {
  id: string
  module_id: string
  teacher_id: string
  title: string
  description: string | null
  sort_order: number
  is_published: boolean
  created_at: string
  updated_at: string
}

export interface Activity {
  id: string
  lesson_id: string
  teacher_id: string
  title: string
  description: string | null
  activity_type: ActivityType
  access_mode: string
  short_code: string
  sort_order: number
  is_published: boolean
  version: number
  time_limit_seconds: number | null
  max_attempts: number | null
  shuffle_questions: boolean
  shuffle_options: boolean
  show_feedback: boolean
  show_correct_answer: boolean
  passing_score: number | null
  gamification: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface QuestionOption {
  id: string
  question_id: string
  content: string
  media_url: string | null
  is_correct: boolean
  sort_order: number
  category_id: string | null
  match_target_id: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface Question {
  id: string
  activity_id: string
  question_type: QuestionType
  content: Record<string, unknown>
  media_url: string | null
  hint: string | null
  explanation: string | null
  points: number
  time_limit_seconds: number | null
  sort_order: number
  config: Record<string, unknown> | null
  options: QuestionOption[]
  created_at: string
  updated_at: string
}

export interface Session {
  id: string
  activity_id: string
  teacher_id: string
  class_id: string | null
  session_type: SessionType
  join_code: string | null
  status: SessionStatus
  started_at: string | null
  ended_at: string | null
  current_question_id: string | null
  settings: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface Student {
  id: string
  email: string | null
  full_name: string | null
  nickname: string | null
  avatar_url: string | null
  oauth_provider: string | null
  oauth_id: string | null
  total_xp: number
  level: number
  created_at: string
  updated_at: string
}

export interface StudentSession {
  id: string
  session_id: string
  student_id: string | null
  anonymous_id: string | null
  nickname: string | null
  score: number
  max_score: number
  time_spent_seconds: number
  status: StudentSessionStatus
  attempt_number: number
  started_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface Response {
  id: string
  student_session_id: string
  question_id: string
  answer: Record<string, unknown>
  is_correct: boolean | null
  points_earned: number
  time_spent_seconds: number
  answered_at: string
  created_at: string
  updated_at: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

// Gamification types

export interface GamificationConfig {
  enabled: boolean
  time_bonus: boolean
  time_bonus_max: number
  streak_multiplier: boolean
  streak_multiplier_max: number
  xp_per_point: number
  xp_completion_bonus: number
}

export interface BadgeDefinition {
  id: string
  name: string
  description: string | null
  icon: string
  color: string
  criteria_type: string
  criteria_value: number
  xp_reward: number
  is_global: boolean
  sort_order: number
  created_at: string
}

export interface StudentBadge {
  id: string
  badge: BadgeDefinition
  earned_at: string
  context: Record<string, unknown> | null
}

export interface StudentProfile {
  id: string
  email: string | null
  full_name: string | null
  nickname: string | null
  avatar_url: string | null
  total_xp: number
  level: number
  xp_for_current_level: number
  xp_for_next_level: number
  badges: StudentBadge[]
  sessions_completed: number
  total_score: number
}

export interface LeaderboardEntry {
  student_id: string
  nickname: string | null
  full_name: string | null
  total_xp: number
  level: number
  badge_count: number
}
