import { addDays, setHours, setMinutes, startOfDay } from 'date-fns'
import type { CalendarEvent, Person, Task } from '../types'

export const people: Person[] = [
  { id: 'mom', name: 'Mom', color: '#e0568c' },
  { id: 'dad', name: 'Dad', color: '#3a86ff' },
  { id: 'kiddo', name: 'Kiddo', color: '#ffb703' },
  { id: 'family', name: 'Family', color: '#6a994e' },
]

function at(dayOffset: number, hour: number, minute = 0): string {
  const day = startOfDay(addDays(new Date(), dayOffset))
  return setMinutes(setHours(day, hour), minute).toISOString()
}

export const events: CalendarEvent[] = [
  {
    id: 'evt-1',
    title: 'Soccer practice',
    start: at(0, 16, 30),
    end: at(0, 17, 30),
    personId: 'kiddo',
    location: 'Community Field',
  },
  {
    id: 'evt-2',
    title: 'Dentist appointment',
    start: at(1, 9, 0),
    end: at(1, 10, 0),
    personId: 'mom',
    location: 'Dr. Lee\'s Office',
  },
  {
    id: 'evt-3',
    title: 'Team standup',
    start: at(1, 9, 30),
    end: at(1, 10, 0),
    personId: 'dad',
  },
  {
    id: 'evt-4',
    title: 'Family game night',
    start: at(2, 19, 0),
    end: at(2, 20, 30),
    personId: 'family',
  },
  {
    id: 'evt-5',
    title: 'Piano lesson',
    start: at(3, 15, 30),
    end: at(3, 16, 15),
    personId: 'kiddo',
  },
  {
    id: 'evt-6',
    title: 'Grocery run',
    start: at(4, 11, 0),
    end: at(4, 12, 0),
    personId: 'dad',
  },
  {
    id: 'evt-7',
    title: 'Parent-teacher conference',
    start: at(6, 17, 0),
    end: at(6, 17, 30),
    personId: 'mom',
  },
  {
    id: 'evt-8',
    title: 'Birthday party',
    start: at(9, 13, 0),
    end: at(9, 15, 0),
    personId: 'family',
    location: 'Grandma\'s house',
  },
]

export const tasks: Task[] = [
  { id: 'task-1', title: 'Feed the dog', personId: 'kiddo', recurrence: 'daily', done: false },
  { id: 'task-2', title: 'Take out trash', personId: 'dad', recurrence: 'weekly', done: false },
  { id: 'task-3', title: 'Unload dishwasher', personId: 'mom', recurrence: 'daily', done: true },
  { id: 'task-4', title: 'Water the plants', personId: 'kiddo', recurrence: 'weekly', done: false },
  { id: 'task-5', title: 'Vacuum living room', personId: 'family', recurrence: 'weekly', done: false },
  { id: 'task-6', title: 'Pay utility bill', personId: 'dad', recurrence: 'monthly', done: false },
  { id: 'task-7', title: 'Pack school lunches', personId: 'mom', recurrence: 'daily', done: false },
  { id: 'task-8', title: 'Clean room', personId: 'kiddo', recurrence: 'weekly', done: false },
]
