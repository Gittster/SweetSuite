export interface Person {
  id: string
  name: string
  color: string
}

export interface CalendarEvent {
  id: string
  title: string
  start: string // ISO datetime
  end: string // ISO datetime
  personId?: string
  location?: string
  source?: 'google' | 'app'
}

export type Recurrence = 'none' | 'daily' | 'weekly' | 'monthly'

export interface Task {
  id: string
  title: string
  personId: string
  recurrence: Recurrence
  done: boolean
  dueDate?: string // ISO date
}

export type TabId = 'calendar' | 'chores' | 'meals' | 'photos' | 'setup'
