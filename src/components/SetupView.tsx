import { useEffect, useState } from 'react'
import {
  disconnectGoogle,
  getAuthStatus,
  getCalendarList,
  googleConnectUrl,
  logout,
  selectCalendar,
  type GoogleCalendarOption,
} from '../api/backend'
import { usePeople } from '../context/PeopleContext'
import {
  checkFolderPermission,
  getStoredFolderHandle,
  isFolderPickerSupported,
  pickPhotosFolder,
  requestFolderPermission,
  type FolderPermissionState,
} from '../photos/localPhotos'
import { getStoredTheme, setTheme, type Theme } from '../theme'
import LoadingOverlay from './LoadingOverlay'
import './SetupView.css'

const NEW_PERSON_COLORS = ['#c34a72', '#3a6d8c', '#d99a2b', '#4c7a5e', '#7b5ea7', '#b5502f']

function nextDefaultColor(usedCount: number): string {
  return NEW_PERSON_COLORS[usedCount % NEW_PERSON_COLORS.length]
}

export default function SetupView() {
  const { people, loading: peopleLoading, addPerson, updatePerson, removePerson } = usePeople()
  const [newPersonName, setNewPersonName] = useState('')
  const [personBusyId, setPersonBusyId] = useState<string | null>(null)

  const [theme, setThemeState] = useState<Theme>(getStoredTheme)
  const [email, setEmail] = useState<string | null>(null)
  const [googleConnected, setGoogleConnected] = useState(false)
  const [busy, setBusy] = useState(false)
  const [oauthNotice, setOauthNotice] = useState<'connected' | 'error' | null>(null)

  const [folderName, setFolderName] = useState<string | null>(null)
  const [folderPermission, setFolderPermission] = useState<FolderPermissionState>('none')

  const [calendars, setCalendars] = useState<GoogleCalendarOption[] | null>(null)
  const [calendarBusy, setCalendarBusy] = useState(false)
  const [loading, setLoading] = useState(true)

  const refreshPhotoState = () => {
    return Promise.all([
      getStoredFolderHandle().then((handle) => setFolderName(handle?.name ?? null)),
      checkFolderPermission().then(setFolderPermission),
    ])
  }

  const refreshAuthState = () => {
    // Fire both in parallel rather than waiting for auth-status before starting
    // calendar-list — calendar-list already handles "not connected yet" itself.
    return Promise.all([
      getAuthStatus().then((res) => {
        setEmail(res.email ?? null)
        setGoogleConnected(!!res.googleConnected)
      }),
      getCalendarList()
        .then((r) => setCalendars(r.calendars))
        .catch(() => setCalendars(null)),
    ])
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const setupParam = params.get('setup')
    if (setupParam === 'connected' || setupParam === 'error') {
      setOauthNotice(setupParam)
      params.delete('setup')
      const newSearch = params.toString()
      window.history.replaceState({}, '', window.location.pathname + (newSearch ? `?${newSearch}` : ''))
    }

    Promise.allSettled([refreshPhotoState(), refreshAuthState()]).then(() => setLoading(false))
  }, [])

  const handleSignOut = () => {
    logout().finally(() => window.location.reload())
  }

  const handleDisconnectGoogle = () => {
    setBusy(true)
    disconnectGoogle()
      .then(() => {
        setGoogleConnected(false)
        setCalendars(null)
      })
      .finally(() => setBusy(false))
  }

  const handleSelectCalendar = (calendarId: string) => {
    setCalendarBusy(true)
    selectCalendar(calendarId)
      .then(() => {
        setCalendars((prev) => prev?.map((c) => ({ ...c, selected: c.id === calendarId })) ?? prev)
      })
      .finally(() => setCalendarBusy(false))
  }

  const handlePickFolder = async () => {
    try {
      const handle = await pickPhotosFolder()
      setFolderName(handle.name)
      setFolderPermission('granted')
    } catch {
      // User cancelled the picker — not an error worth surfacing.
    }
  }

  const handleGrantPermission = async () => {
    const granted = await requestFolderPermission()
    setFolderPermission(granted ? 'granted' : 'needs-permission')
  }

  const handleSetTheme = (next: Theme) => {
    setThemeState(next)
    setTheme(next)
  }

  const handleAddPerson = () => {
    const name = newPersonName.trim()
    if (!name) return
    addPerson({ name, color: nextDefaultColor(people.length) })
      .then(() => setNewPersonName(''))
      .catch((err) => console.error('Failed to add family member:', err))
  }

  const handleRenamePerson = (id: string, name: string) => {
    if (!name.trim()) return
    setPersonBusyId(id)
    updatePerson(id, { name: name.trim() })
      .catch((err) => console.error('Failed to rename family member:', err))
      .finally(() => setPersonBusyId(null))
  }

  const handleRecolorPerson = (id: string, color: string) => {
    setPersonBusyId(id)
    updatePerson(id, { color })
      .catch((err) => console.error('Failed to recolor family member:', err))
      .finally(() => setPersonBusyId(null))
  }

  const handleRemovePerson = (id: string, name: string) => {
    if (!window.confirm(`Remove ${name}? Existing chores or events assigned to them will show as unassigned.`)) return
    setPersonBusyId(id)
    removePerson(id)
      .catch((err) => console.error('Failed to remove family member:', err))
      .finally(() => setPersonBusyId(null))
  }

  return (
    <div className="setup-view">
      <header className="setup-header">
        <h2>Setup</h2>
        <p className="setup-subtitle">
          {email ? `Signed in as ${email}` : 'Manage connections for this dashboard'}
        </p>
      </header>

      <div className="setup-body">
        {loading && <LoadingOverlay label="Loading setup…" />}
        {!loading && (
          <>
            {oauthNotice === 'connected' && (
              <div className="setup-banner success">Google Calendar connected successfully.</div>
            )}
            {oauthNotice === 'error' && (
              <div className="setup-banner error">Couldn't connect Google Calendar. Try again below.</div>
            )}

            <section className="setup-card">
              <h3>Appearance</h3>
              <div className="setup-theme-toggle">
                <button
                  type="button"
                  className={theme === 'light' ? 'active' : ''}
                  onClick={() => handleSetTheme('light')}
                >
                  Light
                </button>
                <button
                  type="button"
                  className={theme === 'dark' ? 'active' : ''}
                  onClick={() => handleSetTheme('dark')}
                >
                  Dark
                </button>
              </div>
            </section>

            <section className="setup-card">
              <h3>Family Members</h3>
              {peopleLoading ? (
                <p className="setup-status-line">Loading…</p>
              ) : (
                <>
                  <div className="setup-people-list">
                    {people.map((p) => (
                      <div key={p.id} className="setup-person-row">
                        <label className="setup-person-swatch" style={{ background: p.color }}>
                          <input
                            type="color"
                            value={p.color}
                            disabled={personBusyId === p.id}
                            onChange={(e) => handleRecolorPerson(p.id, e.target.value)}
                          />
                        </label>
                        <input
                          className="setup-person-name"
                          defaultValue={p.name}
                          disabled={personBusyId === p.id}
                          onBlur={(e) => {
                            if (e.target.value.trim() !== p.name) handleRenamePerson(p.id, e.target.value)
                          }}
                        />
                        <button
                          type="button"
                          className="setup-person-remove"
                          aria-label={`Remove ${p.name}`}
                          disabled={personBusyId === p.id}
                          onClick={() => handleRemovePerson(p.id, p.name)}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="setup-person-add">
                    <input
                      className="setup-person-add-input"
                      placeholder="Add family member…"
                      value={newPersonName}
                      onChange={(e) => setNewPersonName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddPerson()
                      }}
                    />
                    <button type="button" className="setup-secondary-btn" onClick={handleAddPerson}>Add</button>
                  </div>
                </>
              )}
            </section>

            <section className="setup-card">
              <h3>Google Calendar</h3>
              {googleConnected ? (
                <>
                  <p className="setup-status-line connected">Connected</p>
                  {calendars && calendars.length > 0 && (
                    <label className="setup-select-label">
                      Syncing from
                      <select
                        className="setup-select"
                        value={calendars.find((c) => c.selected)?.id ?? ''}
                        disabled={calendarBusy}
                        onChange={(e) => handleSelectCalendar(e.target.value)}
                      >
                        {calendars.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </label>
                  )}
                  <button type="button" className="setup-secondary-btn" onClick={handleDisconnectGoogle} disabled={busy}>
                    Disconnect
                  </button>
                </>
              ) : (
                <>
                  <p className="setup-status-line">Not connected</p>
                  <a className="setup-primary-btn" href={googleConnectUrl()}>Connect Google Calendar</a>
                </>
              )}
            </section>

            <section className="setup-card">
              <h3>Photos</h3>
              {!isFolderPickerSupported() ? (
                <p className="setup-note">
                  This browser doesn't support picking a local folder. Try Chrome or Edge.
                </p>
              ) : (
                <>
                  <p className="setup-status-line">
                    {folderName ? `Folder: ${folderName}` : 'No folder selected'}
                  </p>
                  {folderPermission === 'needs-permission' && (
                    <button type="button" className="setup-secondary-btn" onClick={handleGrantPermission}>
                      Re-grant access
                    </button>
                  )}
                  <button type="button" className="setup-primary-btn" onClick={handlePickFolder}>
                    {folderName ? 'Change folder' : 'Choose folder'}
                  </button>
                </>
              )}
            </section>

            <section className="setup-card">
              <h3>ErinsList (Meals)</h3>
              <p className="setup-status-line connected">Connected</p>
              <p className="setup-note">Proxied through this dashboard's own backend — no key ever reaches the browser.</p>
            </section>

            <button type="button" className="setup-lock-btn" onClick={handleSignOut}>Sign out</button>
          </>
        )}
      </div>
    </div>
  )
}
