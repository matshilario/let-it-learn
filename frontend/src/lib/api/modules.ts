import apiClient from "./client"
import type { Module, PaginatedResponse } from "@/lib/types"

export async function getModules(
  page = 1,
  pageSize = 20
): Promise<PaginatedResponse<Module>> {
  const { data } = await apiClient.get<PaginatedResponse<Module>>("/api/v1/modules/", {
    params: { page, page_size: pageSize },
  })
  return data
}

export async function getModule(moduleId: string): Promise<Module> {
  const { data } = await apiClient.get<Module>(`/api/v1/modules/${moduleId}`)
  return data
}

export async function createModule(body: {
  title: string
  description?: string
  cover_image_url?: string
  is_published?: boolean
  sort_order?: number
}): Promise<Module> {
  const { data } = await apiClient.post<Module>("/api/v1/modules/", body)
  return data
}

export async function updateModule(
  moduleId: string,
  body: Partial<{
    title: string
    description: string
    cover_image_url: string
    is_published: boolean
    sort_order: number
  }>
): Promise<Module> {
  const { data } = await apiClient.put<Module>(`/api/v1/modules/${moduleId}`, body)
  return data
}

export async function deleteModule(moduleId: string): Promise<void> {
  await apiClient.delete(`/api/v1/modules/${moduleId}`)
}

export async function duplicateModule(moduleId: string): Promise<Module> {
  const { data } = await apiClient.post<Module>(
    `/api/v1/modules/${moduleId}/duplicate`
  )
  return data
}

export async function togglePublishModule(moduleId: string): Promise<Module> {
  const { data } = await apiClient.put<Module>(
    `/api/v1/modules/${moduleId}/publish`
  )
  return data
}
