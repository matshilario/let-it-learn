"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import * as lessonsApi from "@/lib/api/lessons"

export function useLessons(moduleId: string) {
  return useQuery({
    queryKey: ["lessons", moduleId],
    queryFn: () => lessonsApi.getLessons(moduleId),
    enabled: !!moduleId,
  })
}

export function useLesson(lessonId: string) {
  return useQuery({
    queryKey: ["lessons", "detail", lessonId],
    queryFn: () => lessonsApi.getLesson(lessonId),
    enabled: !!lessonId,
  })
}

export function useCreateLesson() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ moduleId, body }: { moduleId: string; body: Parameters<typeof lessonsApi.createLesson>[1] }) =>
      lessonsApi.createLesson(moduleId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessons"] })
    },
  })
}

export function useUpdateLesson() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ lessonId, body }: { lessonId: string; body: Parameters<typeof lessonsApi.updateLesson>[1] }) =>
      lessonsApi.updateLesson(lessonId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessons"] })
    },
  })
}

export function useDeleteLesson() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: lessonsApi.deleteLesson,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessons"] })
    },
  })
}
