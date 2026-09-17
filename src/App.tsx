import { useState } from 'react'
import './App.css'
import AuthGate from './components/AuthGate'
import TabBar from './components/TabBar'
import CalendarView from './components/CalendarView'
import ChoresView from './components/ChoresView'
import MealsView from './components/MealsView'
import PhotosView from './components/PhotosView'
import PhotosScreensaver from './components/PhotosScreensaver'
import SetupView from './components/SetupView'
import { useIdleTimer } from './hooks/useIdleTimer'
import type { TabId } from './types'

const IDLE_TIMEOUT_MS = 90_000
const TABS: { id: TabId; render: () => React.ReactNode }[] = [
  { id: 'calendar', render: () => <CalendarView /> },
  { id: 'chores', render: () => <ChoresView /> },
  { id: 'meals', render: () => <MealsView /> },
  { id: 'photos', render: () => <PhotosView /> },
  { id: 'setup', render: () => <SetupView /> },
]

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('calendar')
  const { isIdle, wake } = useIdleTimer(IDLE_TIMEOUT_MS)

  return (
    <AuthGate>
      <div className="app-shell">
        <main className="app-content">
          {/* Every tab stays mounted once visited, so switching back to it is instant
              instead of re-fetching from the network each time. */}
          {TABS.map(({ id, render }) => (
            <div key={id} style={{ display: activeTab === id ? 'contents' : 'none' }}>
              {render()}
            </div>
          ))}
        </main>
        <TabBar active={activeTab} onChange={setActiveTab} />
        {isIdle && <PhotosScreensaver onWake={wake} />}
      </div>
    </AuthGate>
  )
}

export default App
