import type { ComponentType } from 'react'
import type { TabId } from '../types'
import { CalendarIcon, ChecklistIcon, GearIcon, ImageIcon, UtensilsIcon } from './Icons'
import './TabBar.css'

interface Tab {
  id: TabId
  label: string
  Icon: ComponentType<{ className?: string }>
}

const TABS: Tab[] = [
  { id: 'calendar', label: 'Calendar', Icon: CalendarIcon },
  { id: 'chores', label: 'Chores', Icon: ChecklistIcon },
  { id: 'meals', label: 'Meals', Icon: UtensilsIcon },
  { id: 'photos', label: 'Photos', Icon: ImageIcon },
  { id: 'setup', label: 'Setup', Icon: GearIcon },
]

interface TabBarProps {
  active: TabId
  onChange: (tab: TabId) => void
}

export default function TabBar({ active, onChange }: TabBarProps) {
  return (
    <nav className="tab-bar">
      {TABS.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          className={`tab-bar-item ${active === id ? 'active' : ''}`}
          onClick={() => onChange(id)}
        >
          <Icon className="tab-bar-icon" />
          <span className="tab-bar-label">{label}</span>
        </button>
      ))}
    </nav>
  )
}
