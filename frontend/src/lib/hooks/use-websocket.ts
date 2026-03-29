"use client"

import { useEffect, useRef, useCallback, useState } from "react"

interface UseWebSocketOptions {
  token?: string
  studentSessionId?: string
  onMessage?: (message: Record<string, unknown>) => void
}

interface UseWebSocketReturn {
  isConnected: boolean
  sendMessage: (message: Record<string, unknown>) => void
  lastMessage: Record<string, unknown> | null
}

const WS_BASE_URL =
  process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000"
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 2000

export function useWebSocket(
  sessionId: string | null,
  role: "teacher" | "student",
  options?: UseWebSocketOptions
): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<Record<string, unknown> | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const retriesRef = useRef(0)
  const mountedRef = useRef(true)

  const onMessageRef = useRef(options?.onMessage)
  onMessageRef.current = options?.onMessage

  const connect = useCallback(() => {
    if (!sessionId) return

    const params = new URLSearchParams({ role })
    if (options?.token) {
      params.set("token", options.token)
    } else if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem("access_token")
      if (storedToken) params.set("token", storedToken)
    }
    if (options?.studentSessionId) {
      params.set("student_session_id", options.studentSessionId)
    }

    const url = `${WS_BASE_URL}/ws/session/${sessionId}?${params.toString()}`

    try {
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        if (!mountedRef.current) {
          ws.close()
          return
        }
        setIsConnected(true)
        retriesRef.current = 0
      }

      ws.onmessage = (event) => {
        if (!mountedRef.current) return
        try {
          const data = JSON.parse(event.data) as Record<string, unknown>
          setLastMessage(data)
          onMessageRef.current?.(data)
        } catch {
          // Ignore non-JSON messages
        }
      }

      ws.onclose = () => {
        if (!mountedRef.current) return
        setIsConnected(false)

        if (retriesRef.current < MAX_RETRIES) {
          retriesRef.current += 1
          setTimeout(() => {
            if (mountedRef.current) connect()
          }, RETRY_DELAY_MS)
        }
      }

      ws.onerror = () => {
        ws.close()
      }
    } catch {
      // Connection failed
    }
  }, [sessionId, role, options?.token, options?.studentSessionId])

  useEffect(() => {
    mountedRef.current = true
    connect()

    return () => {
      mountedRef.current = false
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [connect])

  const sendMessage = useCallback((message: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    }
  }, [])

  return { isConnected, sendMessage, lastMessage }
}
