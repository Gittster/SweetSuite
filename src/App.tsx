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

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('calendar')
  const { isIdle, wake } = useIdleTimer(IDLE_TIMEOUT_MS)

  return (
    <AuthGate>
      <div className="app-shell">
        <main className="app-content">
          {activeTab === 'calendar' && <CalendarView />}
          {activeTab === 'chores' && <ChoresView />}
          {activeTab === 'meals' && <MealsView />}
          {activeTab === 'photos' && <PhotosView />}
          {activeTab === 'setup' && <SetupView />}
        </main>
        <TabBar active={activeTab} onChange={setActiveTab} />
        {isIdle && <PhotosScreensaver onWake={wake} />}
      </div>
    </AuthGate>
  )
}

export default App
