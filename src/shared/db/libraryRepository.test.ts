import { describe, expect, it } from 'vitest'

import { buildEpisodes } from './libraryRepository'

describe('buildEpisodes', () => {
  it('creates local episodes for every season', () => {
    const episodes = buildEpisodes('show_1', 2, 3)

    expect(episodes).toHaveLength(6)
    expect(episodes[0]).toMatchObject({
      id: 'show_1_s1_e1',
      showId: 'show_1',
      seasonNumber: 1,
      episodeNumber: 1,
      watched: false,
    })
    expect(episodes[5]).toMatchObject({
      id: 'show_1_s2_e3',
      seasonNumber: 2,
      episodeNumber: 3,
    })
  })
})
