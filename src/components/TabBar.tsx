import type { TabId } from '../types'
import './TabBar.css'

interface Tab {
  id: TabId
  label: string
  icon: string
}

const TABS: Tab[] = [
  { id: 'calendar', label: 'Calendar', icon: '📅' },
  { id: 'chores', label: 'Chores', icon: '✅' },
  { id: 'meals', label: 'Meals', icon: '🍽️' },
  { id: 'photos', label: 'Photos', icon: '🖼️' },
]

interface TabBarProps {
  active: TabId
  onChange: (tab: TabId) => void
}

export default function TabBar({ active, onChange }: TabBarProps) {
  return (
    <nav className="tab-bar">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`tab-bar-item ${active === tab.id ? 'active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          <span className="tab-bar-icon" aria-hidden="true">{tab.icon}</span>
          <span className="tab-bar-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}
