import { useEffect, useRef, useState } from 'react'

const ACTIVITY_EVENTS = ['pointerdown', 'pointermove', 'touchstart', 'keydown'] as const

export function useIdleTimer(timeoutMs: number): { isIdle: boolean; wake: () => void } {
  const [isIdle, setIsIdle] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const wake = () => setIsIdle(false)

  useEffect(() => {
    const resetTimer = () => {
      setIsIdle(false)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setIsIdle(true), timeoutMs)
    }

    resetTimer()
    for (const evt of ACTIVITY_EVENTS) {
      window.addEventListener(evt, resetTimer)
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      for (const evt of ACTIVITY_EVENTS) {
        window.removeEventListener(evt, resetTimer)
      }
    }
  }, [timeoutMs])

  return { isIdle, wake }
}
