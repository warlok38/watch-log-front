type CachedPosterUrl = {
  fingerprint: string
  url: string
}

const cache = new Map<string, CachedPosterUrl>()

export function getPosterBlobFingerprint(blob: Blob): string {
  return `${blob.size}:${blob.type}`
}

export function getCachedPosterBlobUrl(cacheKey: string, blob: Blob): string {
  const fingerprint = getPosterBlobFingerprint(blob)
  const cached = cache.get(cacheKey)

  if (cached?.fingerprint === fingerprint) {
    return cached.url
  }

  if (cached) {
    URL.revokeObjectURL(cached.url)
  }

  const url = URL.createObjectURL(blob)
  cache.set(cacheKey, { fingerprint, url })

  return url
}

export function revokePosterBlobUrl(cacheKey: string): void {
  const cached = cache.get(cacheKey)

  if (!cached) {
    return
  }

  URL.revokeObjectURL(cached.url)
  cache.delete(cacheKey)
}
