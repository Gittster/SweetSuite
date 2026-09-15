import { useState } from 'react'
import './App.css'
import TabBar from './components/TabBar'
import CalendarView from './components/CalendarView'
import ChoresView from './components/ChoresView'
import MealsView from './components/MealsView'
import PhotosScreensaver from './components/PhotosScreensaver'
import { useIdleTimer } from './hooks/useIdleTimer'
import type { TabId } from './types'

const IDLE_TIMEOUT_MS = 90_000

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('calendar')
  const { isIdle, wake } = useIdleTimer(IDLE_TIMEOUT_MS)

  return (
    <div className="app-shell">
      <main className="app-content">
        {activeTab === 'calendar' && <CalendarView />}
        {activeTab === 'chores' && <ChoresView />}
        {activeTab === 'meals' && <MealsView />}
        {activeTab === 'photos' && (
          <div className="photos-placeholder">
            <p>Tap anywhere to preview the ambient screensaver, or just wait for it to kick in.</p>
          </div>
        )}
      </main>
      <TabBar active={activeTab} onChange={setActiveTab} />
      {isIdle && <PhotosScreensaver onWake={wake} />}
    </div>
  )
}

export default App
