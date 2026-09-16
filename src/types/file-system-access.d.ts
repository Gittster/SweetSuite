// Minimal ambient types for the File System Access API (Chromium-based browsers).
// Not yet part of TypeScript's standard DOM lib since it isn't a W3C standard.
export {}

declare global {
  type FileSystemPermissionMode = 'read' | 'readwrite'

  interface FileSystemHandlePermissionDescriptor {
    mode?: FileSystemPermissionMode
  }

  interface FileSystemHandle {
    queryPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>
    requestPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>
  }

  interface Window {
    showDirectoryPicker?: (options?: { id?: string; mode?: FileSystemPermissionMode }) => Promise<FileSystemDirectoryHandle>
  }
}
