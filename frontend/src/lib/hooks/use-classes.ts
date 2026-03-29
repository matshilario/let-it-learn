"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import * as classesApi from "@/lib/api/classes"

export function useClasses() {
  return useQuery({
    queryKey: ["classes"],
    queryFn: classesApi.getClasses,
  })
}

export function useClass(classId: string) {
  return useQuery({
    queryKey: ["classes", "detail", classId],
    queryFn: () => classesApi.getClass(classId),
    enabled: !!classId,
  })
}

export function useCreateClass() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: classesApi.createClass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] })
    },
  })
}

export function useUpdateClass() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ classId, body }: { classId: string; body: { name?: string; is_active?: boolean } }) =>
      classesApi.updateClass(classId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] })
    },
  })
}

export function useDeleteClass() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: classesApi.deleteClass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] })
    },
  })
}

export function useAddStudentToClass() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ classId, studentId }: { classId: string; studentId: string }) =>
      classesApi.addStudentToClass(classId, studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] })
    },
  })
}

export function useRemoveStudentFromClass() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ classId, studentId }: { classId: string; studentId: string }) =>
      classesApi.removeStudentFromClass(classId, studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] })
    },
  })
}
