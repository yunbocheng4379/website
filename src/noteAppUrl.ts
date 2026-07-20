export function getNoteAppUrl(
  location: Pick<Location, 'protocol' | 'hostname'> = window.location,
) {
  const configuredUrl = import.meta.env.VITE_NOTE_APP_URL?.trim()
  if (configuredUrl) return configuredUrl

  const port = import.meta.env.VITE_NOTE_APP_PORT?.trim() || '3015'
  return `${location.protocol}//${location.hostname}:${port}/`
}
