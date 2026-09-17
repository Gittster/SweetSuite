import { useEffect, useState } from 'react'
import { disconnectGoogle, getAuthStatus, googleConnectUrl, logout } from '../api/backend'
import {
  checkFolderPermission,
  getStoredFolderHandle,
  isFolderPickerSupported,
  pickPhotosFolder,
  requestFolderPermission,
  type FolderPermissionState,
} from '../photos/localPhotos'
import './SetupView.css'

export default function SetupView() {
  const [email, setEmail] = useState<string | null>(null)
  const [googleConnected, setGoogleConnected] = useState(false)
  const [busy, setBusy] = useState(false)
  const [oauthNotice, setOauthNotice] = useState<'connected' | 'error' | null>(null)

  const [folderName, setFolderName] = useState<string | null>(null)
  const [folderPermission, setFolderPermission] = useState<FolderPermissionState>('none')

  const refreshPhotoState = () => {
    getStoredFolderHandle().then((handle) => setFolderName(handle?.name ?? null))
    checkFolderPermission().then(setFolderPermission)
  }

  const refreshAuthState = () => {
    getAuthStatus().then((res) => {
      setEmail(res.email ?? null)
      setGoogleConnected(!!res.googleConnected)
    })
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
    refreshAuthState()
  }, [])

  const handleSignOut = () => {
    logout().finally(() => window.location.reload())
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
        <p className="setup-subtitle">
          {email ? `Signed in as ${email}` : 'Manage connections for this dashboard'}
        </p>
      </header>

      <div className="setup-body">
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
      </div>
    </div>
  )
}
