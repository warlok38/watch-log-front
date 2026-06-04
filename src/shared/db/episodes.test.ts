/// <reference types="vitest/globals" />

import { buildEpisodesFromStructure } from './episodes'

it('builds episodes from season structure', () => {
  const episodes = buildEpisodesFromStructure('show_1', [
    { seasonNumber: 1, episodeCount: 2 },
    { seasonNumber: 2, episodeCount: 3 },
  ])

  expect(episodes).toHaveLength(5)
  expect(episodes[0]).toMatchObject({
    id: 'show_1_s1_e1',
    seasonNumber: 1,
    episodeNumber: 1,
    watched: false,
  })
  expect(episodes[4]).toMatchObject({
    id: 'show_1_s2_e3',
    seasonNumber: 2,
    episodeNumber: 3,
  })
})
