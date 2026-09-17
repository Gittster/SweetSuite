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
import {
  checkFolderPermission,
  getStoredFolderHandle,
  isFolderPickerSupported,
  pickPhotosFolder,
  requestFolderPermission,
  type FolderPermissionState,
} from '../photos/localPhotos'
import LoadingOverlay from './LoadingOverlay'
import './SetupView.css'

export default function SetupView() {
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
