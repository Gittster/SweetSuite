import './LoadingOverlay.css'

interface LoadingOverlayProps {
  label?: string
}

export default function LoadingOverlay({ label }: LoadingOverlayProps) {
  return (
    <div className="loading-overlay">
      <div className="loading-overlay-spinner" aria-hidden="true" />
      {label && <p className="loading-overlay-label">{label}</p>}
    </div>
  )
}
