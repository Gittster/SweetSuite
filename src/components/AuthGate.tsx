import { useEffect, useState } from 'react'
import { getAuthStatus, signInUrl } from '../api/backend'
import './AuthGate.css'

type Status = 'checking' | 'signed-out' | 'signed-in'

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>('checking')
  const [notice, setNotice] = useState<'denied' | 'error' | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const authParam = params.get('auth')
    if (authParam === 'denied' || authParam === 'error') {
      setNotice(authParam)
      params.delete('auth')
      const newSearch = params.toString()
      window.history.replaceState({}, '', window.location.pathname + (newSearch ? `?${newSearch}` : ''))
    }

    getAuthStatus()
      .then((res) => setStatus(res.authenticated ? 'signed-in' : 'signed-out'))
      .catch(() => setStatus('signed-out'))
  }, [])

  if (status === 'checking') {
    return <div className="auth-gate-checking">Loading…</div>
  }

  if (status === 'signed-out') {
    return (
      <div className="auth-gate">
        <div className="auth-gate-card">
          <h1>SweetSuite</h1>
          <p>Sign in with an approved Google account to use this dashboard.</p>
          {notice === 'denied' && (
            <p className="auth-gate-error">That Google account isn't approved for this dashboard.</p>
          )}
          {notice === 'error' && (
            <p className="auth-gate-error">Something went wrong signing in. Please try again.</p>
          )}
          <a className="auth-gate-btn" href={signInUrl()}>Sign in with Google</a>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
