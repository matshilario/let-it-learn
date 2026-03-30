import apiClient from "./client"
import type {
  BadgeDefinition,
  StudentProfile,
  LeaderboardEntry,
} from "@/lib/types"

export async function listBadges(): Promise<BadgeDefinition[]> {
  const { data } = await apiClient.get<BadgeDefinition[]>(
    "/api/v1/gamification/badges"
  )
  return data
}

export async function seedDefaultBadges(): Promise<BadgeDefinition[]> {
  const { data } = await apiClient.post<BadgeDefinition[]>(
    "/api/v1/gamification/badges/seed-defaults"
  )
  return data
}

export async function getStudentProfile(
  studentId: string
): Promise<StudentProfile> {
  const { data } = await apiClient.get<StudentProfile>(
    `/api/v1/gamification/students/${studentId}/profile`
  )
  return data
}

export async function getXpLeaderboard(
  limit = 20
): Promise<LeaderboardEntry[]> {
  const { data } = await apiClient.get<LeaderboardEntry[]>(
    "/api/v1/gamification/leaderboard",
    { params: { limit } }
  )
  return data
}
