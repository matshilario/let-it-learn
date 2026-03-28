"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import * as modulesApi from "@/lib/api/modules"

export function useModules(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ["modules", page, pageSize],
    queryFn: () => modulesApi.getModules(page, pageSize),
  })
}

export function useModule(moduleId: string) {
  return useQuery({
    queryKey: ["modules", moduleId],
    queryFn: () => modulesApi.getModule(moduleId),
    enabled: !!moduleId,
  })
}

export function useCreateModule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: modulesApi.createModule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules"] })
    },
  })
}

export function useUpdateModule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ moduleId, body }: { moduleId: string; body: Parameters<typeof modulesApi.updateModule>[1] }) =>
      modulesApi.updateModule(moduleId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules"] })
    },
  })
}

export function useDeleteModule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: modulesApi.deleteModule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules"] })
    },
  })
}

export function useDuplicateModule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: modulesApi.duplicateModule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules"] })
    },
  })
}
