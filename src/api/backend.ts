export interface CalendarApiEvent {
  id: string
  title: string
  start: string
  end: string
  location: string | null
  source: 'google'
}

export interface AppEvent {
  id: string
  title: string
  start: string
  end: string
  personId: string | null
  location: string | null
  source: 'app'
}

export interface GoogleCalendarOption {
  id: string
  name: string
  color: string | null
  selected: boolean
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

export function getCalendarList(): Promise<{ calendars: GoogleCalendarOption[] }> {
  return request('/calendar-list')
}

export function selectCalendar(calendarId: string): Promise<{ calendarId: string }> {
  return request('/calendar-select', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ calendarId }),
  })
}

export function getAppEvents(): Promise<{ events: AppEvent[] }> {
  return request('/app-events')
}

export interface NewAppEvent {
  title: string
  start: string
  end: string
  personId?: string | null
  location?: string | null
}

export function addAppEvent(newEvent: NewAppEvent): Promise<{ event: AppEvent }> {
  return request('/app-events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newEvent),
  })
}

export function deleteAppEvent(id: string): Promise<{ deleted: string }> {
  return request(`/app-events?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
}
