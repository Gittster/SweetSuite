import './MealsView.css'

const ERINSLIST_URL = 'https://erinslist.netlify.app'

export default function MealsView() {
  return (
    <div className="meals-view">
      <header className="meals-header">
        <h2>Meals</h2>
        <p className="meals-subtitle">
          Powered by ErinsList &middot;{' '}
          <a href={ERINSLIST_URL} target="_top" rel="noreferrer">
            open directly
          </a>
        </p>
      </header>
      <div className="meals-frame-wrap">
        <iframe
          className="meals-frame"
          src={ERINSLIST_URL}
          title="ErinsList meal planning"
          referrerPolicy="no-referrer"
        />
        <p className="meals-fallback-note">
          Blank above? ErinsList's server is blocking iframe embedding
          (X-Frame-Options/CSP) — tap "open directly" to switch this tab to it instead.
        </p>
      </div>
    </div>
  )
}
