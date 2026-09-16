import { useEffect, useRef, useState } from 'react'
import { checkFolderPermission, listPhotoFiles } from '../photos/localPhotos'
import './PhotosView.css'

const PREVIEW_LIMIT = 12

export default function PhotosView() {
  const [status, setStatus] = useState<'loading' | 'none' | 'needs-permission' | 'ready'>('loading')
  const [thumbUrls, setThumbUrls] = useState<string[]>([])
  const urlsRef = useRef<string[]>([])

  useEffect(() => {
    checkFolderPermission().then(async (state) => {
      if (state === 'none') return setStatus('none')
      if (state === 'needs-permission') return setStatus('needs-permission')

      const files = await listPhotoFiles()
      const urls = await Promise.all(
        files.slice(0, PREVIEW_LIMIT).map(async (handle) => URL.createObjectURL(await handle.getFile()))
      )
      urlsRef.current = urls
      setThumbUrls(urls)
      setStatus('ready')
    })

    return () => {
      urlsRef.current.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [])

  return (
    <div className="photos-view">
      {status === 'loading' && <p className="empty-state">Loading…</p>}
      {status === 'none' && (
        <div className="photos-empty">
          <p>No photo folder chosen yet.</p>
          <p className="empty-state">Open the Setup tab to pick one.</p>
        </div>
      )}
      {status === 'needs-permission' && (
        <div className="photos-empty">
          <p>Photo folder access needs to be re-granted.</p>
          <p className="empty-state">Open the Setup tab to reconnect it.</p>
        </div>
      )}
      {status === 'ready' && (
        <>
          <p className="photos-hint">This rotates as the idle screensaver. Tap anywhere to preview it now.</p>
          <div className="photos-grid">
            {thumbUrls.map((url) => (
              <div key={url} className="photos-thumb" style={{ backgroundImage: `url(${url})` }} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
