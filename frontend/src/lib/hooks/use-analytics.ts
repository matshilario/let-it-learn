"use client"

import { useMutation, useQuery } from "@tanstack/react-query"
import * as analyticsApi from "@/lib/api/analytics"

export function useDashboardStats() {
  return useQuery({
    queryKey: ["analytics", "dashboard"],
    queryFn: analyticsApi.getDashboardStats,
  })
}

export function useSessionAnalytics(sessionId: string) {
  return useQuery({
    queryKey: ["analytics", "sessions", sessionId],
    queryFn: () => analyticsApi.getSessionAnalytics(sessionId),
    enabled: !!sessionId,
  })
}

export function useModuleAnalytics(moduleId: string) {
  return useQuery({
    queryKey: ["analytics", "modules", moduleId],
    queryFn: () => analyticsApi.getModuleAnalytics(moduleId),
    enabled: !!moduleId,
  })
}

export function useActivityAnalytics(activityId: string) {
  return useQuery({
    queryKey: ["analytics", "activities", activityId],
    queryFn: () => analyticsApi.getActivityAnalytics(activityId),
    enabled: !!activityId,
  })
}

export function useStudentAnalytics(studentId: string) {
  return useQuery({
    queryKey: ["analytics", "students", studentId],
    queryFn: () => analyticsApi.getStudentAnalytics(studentId),
    enabled: !!studentId,
  })
}

export function useEngagement() {
  return useQuery({
    queryKey: ["analytics", "engagement"],
    queryFn: analyticsApi.getEngagement,
  })
}

export function useExportSessionCSV() {
  return useMutation({
    mutationFn: analyticsApi.exportSessionCSV,
  })
}
