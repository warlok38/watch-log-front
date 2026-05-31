export function getRouterBasename(): string {
  return import.meta.env.BASE_URL.replace(/\/$/, '')
}

export function withBasePath(path: string): string {
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path
  return `${import.meta.env.BASE_URL}${normalizedPath}`.replace(/\/{2,}/g, '/')
}
