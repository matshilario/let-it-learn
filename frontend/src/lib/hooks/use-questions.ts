"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import * as questionsApi from "@/lib/api/questions"

export function useQuestions(activityId: string) {
  return useQuery({
    queryKey: ["questions", activityId],
    queryFn: () => questionsApi.getQuestions(activityId),
    enabled: !!activityId,
  })
}

export function useCreateQuestion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      activityId,
      body,
    }: {
      activityId: string
      body: Parameters<typeof questionsApi.createQuestion>[1]
    }) => questionsApi.createQuestion(activityId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] })
    },
  })
}

export function useUpdateQuestion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      questionId,
      body,
    }: {
      questionId: string
      body: Parameters<typeof questionsApi.updateQuestion>[1]
    }) => questionsApi.updateQuestion(questionId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] })
    },
  })
}

export function useDeleteQuestion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: questionsApi.deleteQuestion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] })
    },
  })
}
