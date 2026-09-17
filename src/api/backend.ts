export interface CalendarApiEvent {
  id: string
  title: string
  start: string
  end: string
  location: string | null
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`/.netlify/functions${path}`, {
    ...options,
    credentials: 'include',
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error || `Request failed (${res.status})`)
  }
  return res.json()
}

export function getAuthStatus(): Promise<{ authenticated: boolean; email?: string; googleConnected?: boolean }> {
  return request('/auth-status')
}

export function signInUrl(): string {
  return '/.netlify/functions/auth-google-start'
}

export function logout(): Promise<{ authenticated: boolean }> {
  return request('/auth-logout', { method: 'POST' })
}

export function disconnectGoogle(): Promise<{ googleConnected: boolean }> {
  return request('/google-disconnect', { method: 'POST' })
}

export function googleConnectUrl(): string {
  return '/.netlify/functions/google-oauth-start'
}

export function getCalendarEvents(start?: string, end?: string): Promise<{ events: CalendarApiEvent[] }> {
  const params = new URLSearchParams()
  if (start) params.set('start', start)
  if (end) params.set('end', end)
  const query = params.toString()
  return request(`/calendar-events${query ? `?${query}` : ''}`)
}
