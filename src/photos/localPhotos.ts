const DB_NAME = 'sweetsuite-photos'
const STORE_NAME = 'handles'
const HANDLE_KEY = 'photosFolder'
const IMAGE_EXTENSIONS = /\.(jpe?g|png|gif|webp)$/i

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function idbGet<T>(key: string): Promise<T | undefined> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).get(key)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function idbSet(key: string, value: unknown): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(value, key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export function isFolderPickerSupported(): boolean {
  return typeof window.showDirectoryPicker === 'function'
}

export async function pickPhotosFolder(): Promise<FileSystemDirectoryHandle> {
  const handle = await window.showDirectoryPicker!({ id: 'sweetsuite-photos', mode: 'read' })
  await idbSet(HANDLE_KEY, handle)
  return handle
}

export async function getStoredFolderHandle(): Promise<FileSystemDirectoryHandle | undefined> {
  return idbGet<FileSystemDirectoryHandle>(HANDLE_KEY)
}

export type FolderPermissionState = 'granted' | 'needs-permission' | 'none'

export async function checkFolderPermission(): Promise<FolderPermissionState> {
  const handle = await getStoredFolderHandle()
  if (!handle) return 'none'
  const state = await handle.queryPermission({ mode: 'read' })
  return state === 'granted' ? 'granted' : 'needs-permission'
}

// Must be called from inside a click handler — browsers require a user
// gesture to grant file-system permission, so this can't run on page load.
export async function requestFolderPermission(): Promise<boolean> {
  const handle = await getStoredFolderHandle()
  if (!handle) return false
  const state = await handle.requestPermission({ mode: 'read' })
  return state === 'granted'
}

export async function listPhotoFiles(): Promise<FileSystemFileHandle[]> {
  const handle = await getStoredFolderHandle()
  if (!handle) return []

  const files: FileSystemFileHandle[] = []
  for await (const entry of handle.values()) {
    if (entry.kind === 'file' && IMAGE_EXTENSIONS.test(entry.name)) {
      files.push(entry)
    }
  }
  return files
}
