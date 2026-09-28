import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  addFamilyMember,
  deleteFamilyMember,
  getFamilyMembers,
  updateFamilyMember,
  type FamilyMember,
} from '../api/backend'
import { people as demoPeople } from '../data/mockData'
import type { Person } from '../types'

interface PeopleContextValue {
  people: Person[]
  loading: boolean
  addPerson: (data: { name: string; color: string }) => Promise<void>
  updatePerson: (id: string, data: { name?: string; color?: string }) => Promise<void>
  removePerson: (id: string) => Promise<void>
}

const PeopleContext = createContext<PeopleContextValue | null>(null)

export function PeopleProvider({ children }: { children: ReactNode }) {
  const [people, setPeople] = useState<Person[]>(demoPeople)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getFamilyMembers()
      .then((res) => setPeople(res.members))
      .catch((err) => console.error('Failed to load family members, showing demo data:', err))
      .finally(() => setLoading(false))
  }, [])

  const value = useMemo<PeopleContextValue>(
    () => ({
      people,
      loading,
      addPerson: (data) =>
        addFamilyMember(data).then(({ member }) => {
          setPeople((prev) => [...prev, member])
        }),
      updatePerson: (id, data) =>
        updateFamilyMember(id, data).then(({ member }) => {
          setPeople((prev) => prev.map((p) => (p.id === id ? member : p)))
        }),
      removePerson: (id) =>
        deleteFamilyMember(id).then(() => {
          setPeople((prev) => prev.filter((p) => p.id !== id))
        }),
    }),
    [people, loading]
  )

  return <PeopleContext.Provider value={value}>{children}</PeopleContext.Provider>
}

export function usePeople(): PeopleContextValue {
  const ctx = useContext(PeopleContext)
  if (!ctx) throw new Error('usePeople must be used within a PeopleProvider')
  return ctx
}

export type { FamilyMember }
