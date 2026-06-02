import { describe, expect, it } from 'vitest'

import type { Show } from '@/entities/show'

import { isDraftFieldModified, isShowFieldModified, getPosterMetadataPatch } from './showMetadata'

function createShow(overrides: Partial<Show> = {}): Show {
  return {
    id: 'show_test',
    title: 'Test Show',
    kind: 'series',
    status: 'planned',
    externalStatus: 'unknown',
    isArchived: false,
    externalProvider: 'tvmaze',
    seasonsCount: 1,
    episodesPerSeason: 12,
    currentSeason: 1,
    currentEpisode: 0,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    providerSnapshot: {
      title: 'Test Show',
      posterUrl: 'https://example.com/poster.jpg',
      summary: 'Original summary',
    },
    ...overrides,
  }
}

const snapshot = {
  title: 'Test Show',
  posterUrl: 'https://example.com/poster.jpg',
  summary: 'Original summary',
}

describe('isShowFieldModified', () => {
  it('returns false when snapshot is missing', () => {
    const show = createShow({ providerSnapshot: undefined })

    expect(isShowFieldModified(show, 'title')).toBe(false)
  })

  it('detects modified title, summary, and poster', () => {
    const show = createShow({
      title: 'Changed title',
      summary: 'Changed summary',
      posterUrl: 'https://example.com/new.jpg',
    })

    expect(isShowFieldModified(show, 'title')).toBe(true)
    expect(isShowFieldModified(show, 'summary')).toBe(true)
    expect(isShowFieldModified(show, 'posterUrl')).toBe(true)
  })

  it('detects poster changes from local blob', () => {
    const show = createShow({ posterBlob: new Blob(['poster'], { type: 'image/png' }) })

    expect(isShowFieldModified(show, 'posterUrl')).toBe(true)
  })
})

describe('isDraftFieldModified', () => {
  it('detects draft changes before save', () => {
    const draft = {
      title: 'Draft title',
      summary: 'Original summary',
      posterUrl: snapshot.posterUrl,
    }

    expect(isDraftFieldModified(snapshot, draft, 'title')).toBe(true)
    expect(isDraftFieldModified(snapshot, draft, 'summary')).toBe(false)
  })

  it('detects draft poster blob changes', () => {
    const draft = {
      title: snapshot.title,
      summary: snapshot.summary ?? '',
      posterBlob: new Blob(['poster'], { type: 'image/png' }),
    }

    expect(isDraftFieldModified(snapshot, draft, 'posterUrl')).toBe(true)
  })
})

describe('getPosterMetadataPatch', () => {
  it('returns clearPoster when url-only poster is removed', () => {
    const patch = getPosterMetadataPatch({}, { posterUrl: 'https://example.com/poster.jpg' })

    expect(patch).toEqual({ clearPoster: true })
  })

  it('returns posterBlob when a new local poster is selected', () => {
    const blob = new Blob(['poster'], { type: 'image/png' })
    const patch = getPosterMetadataPatch({ posterBlob: blob }, { posterUrl: 'https://example.com/poster.jpg' })

    expect(patch).toEqual({ posterBlob: blob })
  })
})
