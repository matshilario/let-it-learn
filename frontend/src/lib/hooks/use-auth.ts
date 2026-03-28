"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { Teacher } from "@/lib/types"
import * as authApi from "@/lib/api/auth"

export function useAuth() {
  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const fetchMe = useCallback(async () => {
    try {
      const token = localStorage.getItem("access_token")
      if (!token) {
        setIsLoading(false)
        return
      }
      const me = await authApi.getMe()
      setTeacher(me)
    } catch {
      localStorage.removeItem("access_token")
      localStorage.removeItem("refresh_token")
      setTeacher(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMe()
  }, [fetchMe])

  const login = async (email: string, password: string) => {
    const tokens = await authApi.login(email, password)
    localStorage.setItem("access_token", tokens.access_token)
    localStorage.setItem("refresh_token", tokens.refresh_token)
    await fetchMe()
    router.push("/dashboard")
  }

  const register = async (email: string, password: string, full_name: string) => {
    const tokens = await authApi.register(email, password, full_name)
    localStorage.setItem("access_token", tokens.access_token)
    localStorage.setItem("refresh_token", tokens.refresh_token)
    await fetchMe()
    router.push("/dashboard")
  }

  const logout = () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    setTeacher(null)
    router.push("/login")
  }

  return {
    teacher,
    isLoading,
    isAuthenticated: !!teacher,
    login,
    register,
    logout,
    refetch: fetchMe,
  }
}
