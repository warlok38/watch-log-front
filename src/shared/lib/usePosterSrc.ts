import { useSyncExternalStore } from 'react'

import type { Show } from '@/entities/show'

import { getCachedPosterBlobUrl, getPosterBlobFingerprint } from './posterBlobUrlCache'

export function useShowPosterSrc(
  show: Pick<Show, 'id' | 'posterUrl' | 'posterBlob'>,
): string | undefined {
  return usePosterSrc(show.posterUrl, show.posterBlob, show.id)
}

export function usePosterSrc(src?: string, posterBlob?: Blob, cacheKey?: string): string | undefined {
  const blobFingerprint = posterBlob ? getPosterBlobFingerprint(posterBlob) : undefined

  const blobUrl = useSyncExternalStore(
    () => () => undefined,
    () => {
      if (!posterBlob || !cacheKey) {
        return undefined
      }

      return getCachedPosterBlobUrl(cacheKey, posterBlob)
    },
    () => undefined,
  )

  if (posterBlob) {
    if (cacheKey) {
      return blobUrl
    }

    return getCachedPosterBlobUrl(`draft:${blobFingerprint}`, posterBlob)
  }

  return src
}
