"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import * as sessionsApi from "@/lib/api/sessions"

export function useSessions(page = 1, pageSize = 20, status?: string) {
  return useQuery({
    queryKey: ["sessions", page, pageSize, status],
    queryFn: () => sessionsApi.getSessions(page, pageSize, status),
  })
}

export function useSession(sessionId: string) {
  return useQuery({
    queryKey: ["sessions", "detail", sessionId],
    queryFn: () => sessionsApi.getSession(sessionId),
    enabled: !!sessionId,
  })
}

export function useCreateSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: sessionsApi.createSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] })
    },
  })
}

export function useEndSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: sessionsApi.endSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] })
    },
  })
}

export function useStartLiveSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: sessionsApi.startLiveSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] })
    },
  })
}

export function useNextQuestion() {
  return useMutation({
    mutationFn: sessionsApi.nextQuestion,
  })
}

export function usePrevQuestion() {
  return useMutation({
    mutationFn: sessionsApi.prevQuestion,
  })
}

export function useLockSubmissions() {
  return useMutation({
    mutationFn: sessionsApi.lockSubmissions,
  })
}

export function useUnlockSubmissions() {
  return useMutation({
    mutationFn: sessionsApi.unlockSubmissions,
  })
}

export function useLeaderboard(sessionId: string) {
  return useQuery({
    queryKey: ["sessions", sessionId, "leaderboard"],
    queryFn: () => sessionsApi.getLeaderboard(sessionId),
    enabled: !!sessionId,
    refetchInterval: 5000,
  })
}
