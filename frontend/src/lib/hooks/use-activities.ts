"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import * as activitiesApi from "@/lib/api/activities"

export function useActivities(lessonId: string) {
  return useQuery({
    queryKey: ["activities", lessonId],
    queryFn: () => activitiesApi.getActivities(lessonId),
    enabled: !!lessonId,
  })
}

export function useActivity(activityId: string) {
  return useQuery({
    queryKey: ["activities", "detail", activityId],
    queryFn: () => activitiesApi.getActivity(activityId),
    enabled: !!activityId,
  })
}

export function useCreateActivity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      lessonId,
      body,
    }: {
      lessonId: string
      body: Parameters<typeof activitiesApi.createActivity>[1]
    }) => activitiesApi.createActivity(lessonId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] })
    },
  })
}

export function useUpdateActivity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      activityId,
      body,
    }: {
      activityId: string
      body: Parameters<typeof activitiesApi.updateActivity>[1]
    }) => activitiesApi.updateActivity(activityId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] })
    },
  })
}

export function useDeleteActivity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: activitiesApi.deleteActivity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] })
    },
  })
}
