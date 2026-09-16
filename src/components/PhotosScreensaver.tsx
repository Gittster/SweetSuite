import { useEffect, useRef, useState } from 'react'
import { checkFolderPermission, listPhotoFiles } from '../photos/localPhotos'
import './PhotosScreensaver.css'

const ROTATE_MS = 6000

// Fallback "photos" (gradients) shown when no local folder is configured yet
// or its permission has lapsed — see Setup tab to pick a real folder.
const PLACEHOLDER_SLIDES = [
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
  const [photoFiles, setPhotoFiles] = useState<FileSystemFileHandle[] | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const currentUrlRef = useRef<string | null>(null)

  useEffect(() => {
    checkFolderPermission().then((state) => {
      if (state === 'granted') {
        listPhotoFiles().then(setPhotoFiles)
      } else {
        setPhotoFiles([])
      }
    })
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => i + 1)
    }, ROTATE_MS)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!photoFiles || photoFiles.length === 0) return
    const handle = photoFiles[index % photoFiles.length]

    let cancelled = false
    handle.getFile().then((file) => {
      if (cancelled) return
      const url = URL.createObjectURL(file)
      if (currentUrlRef.current) URL.revokeObjectURL(currentUrlRef.current)
      currentUrlRef.current = url
      setPhotoUrl(url)
    })

    return () => {
      cancelled = true
    }
  }, [photoFiles, index])

  useEffect(() => {
    return () => {
      if (currentUrlRef.current) URL.revokeObjectURL(currentUrlRef.current)
    }
  }, [])

  const usingRealPhotos = !!photoFiles && photoFiles.length > 0
  const slide = usingRealPhotos ? null : PLACEHOLDER_SLIDES[index % PLACEHOLDER_SLIDES.length]

  return (
    <div
      className="screensaver"
      style={usingRealPhotos
        ? { backgroundImage: photoUrl ? `url(${photoUrl})` : undefined }
        : { background: slide!.gradient }}
      onClick={onWake}
      role="button"
      tabIndex={0}
    >
      {!usingRealPhotos && <p className="screensaver-caption">{slide!.caption}</p>}
      <p className="screensaver-hint">Tap to wake</p>
    </div>
  )
}
