"use client"

import { useEffect, useRef, useCallback, useState } from "react"

interface UseTimerOptions {
  initialSeconds: number
  onExpire?: () => void
  autoStart?: boolean
}

interface UseTimerReturn {
  timeRemaining: number
  isRunning: boolean
  start: () => void
  pause: () => void
  reset: (newSeconds?: number) => void
}

export function useTimer({
  initialSeconds,
  onExpire,
  autoStart = false,
}: UseTimerOptions): UseTimerReturn {
  const [timeRemaining, setTimeRemaining] = useState(initialSeconds)
  const [isRunning, setIsRunning] = useState(autoStart)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onExpireRef = useRef(onExpire)

  onExpireRef.current = onExpire

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const start = useCallback(() => {
    setIsRunning(true)
  }, [])

  const pause = useCallback(() => {
    setIsRunning(false)
    clearTimer()
  }, [clearTimer])

  const reset = useCallback(
    (newSeconds?: number) => {
      clearTimer()
      setTimeRemaining(newSeconds ?? initialSeconds)
      setIsRunning(false)
    },
    [initialSeconds, clearTimer]
  )

  useEffect(() => {
    if (!isRunning) {
      clearTimer()
      return
    }

    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearTimer()
          setIsRunning(false)
          onExpireRef.current?.()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return clearTimer
  }, [isRunning, clearTimer])

  useEffect(() => {
    return clearTimer
  }, [clearTimer])

  return { timeRemaining, isRunning, start, pause, reset }
}
