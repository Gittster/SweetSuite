import { useEffect, useState } from 'react'
import {
  disconnectGoogle,
  getSetupStatus,
  googleConnectUrl,
  isBackendConfigured,
  login,
  logout,
} from '../api/backend'
import {
  checkFolderPermission,
  getStoredFolderHandle,
  isFolderPickerSupported,
  pickPhotosFolder,
  requestFolderPermission,
  type FolderPermissionState,
} from '../photos/localPhotos'
import './SetupView.css'

type LockState = 'checking' | 'locked' | 'unlocked'

export default function SetupView() {
  const backendReady = isBackendConfigured()
  const [lockState, setLockState] = useState<LockState>(backendReady ? 'checking' : 'locked')
  const [googleConnected, setGoogleConnected] = useState(false)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [oauthNotice, setOauthNotice] = useState<'connected' | 'error' | null>(null)

  const [folderName, setFolderName] = useState<string | null>(null)
  const [folderPermission, setFolderPermission] = useState<FolderPermissionState>('none')

  const refreshPhotoState = () => {
    getStoredFolderHandle().then((handle) => setFolderName(handle?.name ?? null))
    checkFolderPermission().then(setFolderPermission)
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

    refreshPhotoState()

    if (!backendReady) return
    getSetupStatus()
      .then((res) => {
        setLockState(res.authenticated ? 'unlocked' : 'locked')
        setGoogleConnected(!!res.googleConnected)
      })
      .catch(() => setLockState('locked'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setPinError(null)
    login(pin)
      .then(() => {
        setLockState('unlocked')
        setPin('')
        return getSetupStatus()
      })
      .then((res) => setGoogleConnected(!!res.googleConnected))
      .catch((err: Error) => setPinError(err.message))
      .finally(() => setBusy(false))
  }

  const handleLock = () => {
    logout().finally(() => setLockState('locked'))
  }

  const handleDisconnectGoogle = () => {
    setBusy(true)
    disconnectGoogle()
      .then(() => setGoogleConnected(false))
      .finally(() => setBusy(false))
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
        <p className="setup-subtitle">Manage connections for this dashboard</p>
      </header>

      <div className="setup-body">
        {oauthNotice === 'connected' && (
          <div className="setup-banner success">Google Calendar connected successfully.</div>
        )}
        {oauthNotice === 'error' && (
          <div className="setup-banner error">Couldn't connect Google Calendar. Try again from Setup.</div>
        )}

        {lockState === 'checking' && <p className="empty-state">Checking…</p>}

        {lockState === 'locked' && (
          <form className="setup-pin-form" onSubmit={handlePinSubmit}>
            <label htmlFor="setup-pin">Enter the Setup PIN</label>
            <input
              id="setup-pin"
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              autoFocus
            />
            {!backendReady && (
              <p className="setup-note">
                No backend is configured yet, so Google Calendar can't be managed here — see
                backend/README.md. Photos still works below without a backend.
              </p>
            )}
            {pinError && <p className="setup-error">{pinError}</p>}
            <button type="submit" disabled={busy || !pin}>Unlock</button>
          </form>
        )}

        {lockState === 'unlocked' && (
          <>
            <section className="setup-card">
              <h3>Google Calendar</h3>
              {googleConnected ? (
                <>
                  <p className="setup-status-line connected">Connected</p>
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
              <p className="setup-status-line connected">Configured via Netlify</p>
              <p className="setup-note">Managed in the recipe repo's Netlify environment variables.</p>
            </section>

            <button type="button" className="setup-lock-btn" onClick={handleLock}>Lock Setup</button>
          </>
        )}
      </div>
    </div>
  )
}
