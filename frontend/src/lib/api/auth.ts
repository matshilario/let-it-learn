import apiClient from "./client"
import type { Teacher, TokenResponse } from "@/lib/types"

export async function login(email: string, password: string): Promise<TokenResponse> {
  const { data } = await apiClient.post<TokenResponse>("/api/v1/auth/login", {
    email,
    password,
  })
  return data
}

export async function register(
  email: string,
  password: string,
  full_name: string
): Promise<TokenResponse> {
  const { data } = await apiClient.post<TokenResponse>("/api/v1/auth/register", {
    email,
    password,
    full_name,
  })
  return data
}

export async function refreshToken(refresh_token: string): Promise<TokenResponse> {
  const { data } = await apiClient.post<TokenResponse>("/api/v1/auth/refresh", null, {
    params: { refresh_token },
  })
  return data
}

export async function getMe(): Promise<Teacher> {
  const { data } = await apiClient.get<Teacher>("/api/v1/auth/me")
  return data
}

export async function updateMe(
  body: Partial<Pick<Teacher, "full_name" | "avatar_url" | "locale" | "timezone">>
): Promise<Teacher> {
  const { data } = await apiClient.put<Teacher>("/api/v1/auth/me", body)
  return data
}
