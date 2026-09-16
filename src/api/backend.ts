const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, '')
const BACKEND_API_KEY = import.meta.env.VITE_BACKEND_API_KEY as string | undefined

export interface CalendarApiEvent {
  id: string
  title: string
  start: string
  end: string
  location: string | null
}

export function isBackendConfigured(): boolean {
  return !!BACKEND_URL
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BACKEND_URL}/.netlify/functions${path}`, {
    ...options,
    credentials: 'include',
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error || `Request failed (${res.status})`)
  }
  return res.json()
}

export function getSetupStatus(): Promise<{ authenticated: boolean; googleConnected?: boolean }> {
  return request('/setup-status')
}

export function login(pin: string): Promise<{ authenticated: boolean }> {
  return request('/setup-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin }),
  })
}

export function logout(): Promise<{ authenticated: boolean }> {
  return request('/setup-logout', { method: 'POST' })
}

export function disconnectGoogle(): Promise<{ googleConnected: boolean }> {
  return request('/google-disconnect', { method: 'POST' })
}

export function googleConnectUrl(): string {
  return `${BACKEND_URL}/.netlify/functions/google-oauth-start`
}

export async function getCalendarEvents(start?: string, end?: string): Promise<{ events: CalendarApiEvent[] }> {
  const params = new URLSearchParams()
  if (start) params.set('start', start)
  if (end) params.set('end', end)
  const query = params.toString()

  const res = await fetch(`${BACKEND_URL}/.netlify/functions/calendar-events${query ? `?${query}` : ''}`, {
    headers: BACKEND_API_KEY ? { 'X-SweetSuite-Key': BACKEND_API_KEY } : {},
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error || `Request failed (${res.status})`)
  }
  return res.json()
}
