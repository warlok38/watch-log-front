import type { ProviderSnapshot, Show, ShowMetadataField, ShowMetadataPatch } from '@/entities/show'

export type PosterFieldValue = {
  posterUrl?: string
  posterBlob?: Blob
}

export type MetadataDraft = {
  title: string
  summary: string
  posterUrl?: string
  posterBlob?: Blob
}

export function toMetadataDraft(source: Pick<Show, 'title' | 'summary' | 'posterUrl' | 'posterBlob'>): MetadataDraft {
  return {
    title: source.title,
    summary: source.summary ?? '',
    posterUrl: source.posterUrl,
    posterBlob: source.posterBlob,
  }
}

export function isShowFieldModified(show: Show, field: ShowMetadataField): boolean {
  const snapshot = show.providerSnapshot
  if (!snapshot) return false

  return isDraftFieldModified(snapshot, toMetadataDraft(show), field)
}

export function isDraftFieldModified(
  snapshot: ProviderSnapshot,
  draft: MetadataDraft,
  field: ShowMetadataField,
): boolean {
  switch (field) {
    case 'title':
      return draft.title !== snapshot.title
    case 'summary':
      return draft.summary !== (snapshot.summary ?? '')
    case 'posterUrl':
      return Boolean(draft.posterBlob) || (draft.posterUrl ?? '') !== (snapshot.posterUrl ?? '')
  }
}

export function getPosterMetadataPatch(
  current: PosterFieldValue,
  original: Pick<Show, 'posterUrl' | 'posterBlob'>,
): Pick<ShowMetadataPatch, 'posterUrl' | 'posterBlob' | 'clearPoster'> | undefined {
  const blobChanged = current.posterBlob !== original.posterBlob
  const urlChanged = (current.posterUrl ?? '') !== (original.posterUrl ?? '')

  if (!blobChanged && !urlChanged) {
    return undefined
  }

  if (current.posterBlob) {
    return { posterBlob: current.posterBlob }
  }

  const hadPoster = Boolean(original.posterUrl || original.posterBlob)
  const hasPoster = Boolean(current.posterUrl || current.posterBlob)

  if (!hasPoster && hadPoster) {
    return { clearPoster: true }
  }

  return { posterUrl: current.posterUrl, posterBlob: null }
}
