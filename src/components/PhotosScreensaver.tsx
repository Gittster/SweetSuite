import { useEffect, useState } from 'react'
import './PhotosScreensaver.css'

const ROTATE_MS = 6000

// Placeholder "photos" (gradients) standing in for the local photo folder from
// the design doc — swap for real <img> sources reading a synced photos directory.
const SLIDES = [
  { gradient: 'linear-gradient(135deg, #ff9a9e, #fecfef)', caption: 'Beach day, July' },
  { gradient: 'linear-gradient(135deg, #a1c4fd, #c2e9fb)', caption: 'Winter hike' },
  { gradient: 'linear-gradient(135deg, #ffecd2, #fcb69f)', caption: 'Birthday party' },
  { gradient: 'linear-gradient(135deg, #84fab0, #8fd3f4)', caption: 'Backyard BBQ' },
  { gradient: 'linear-gradient(135deg, #d4fc79, #96e6a1)', caption: 'Family game night' },
]

interface PhotosScreensaverProps {
  onWake: () => void
}

export default function PhotosScreensaver({ onWake }: PhotosScreensaverProps) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length)
    }, ROTATE_MS)
    return () => clearInterval(id)
  }, [])

  const slide = SLIDES[index]

  return (
    <div
      className="screensaver"
      style={{ background: slide.gradient }}
      onClick={onWake}
      role="button"
      tabIndex={0}
    >
      <p className="screensaver-caption">{slide.caption}</p>
      <p className="screensaver-hint">Tap to wake</p>
    </div>
  )
}
