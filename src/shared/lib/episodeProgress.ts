import type { Episode } from '@/entities/episode'
import type { Show } from '@/entities/show'

export type NextEpisodeAction =
  | { kind: 'mark'; season: number; episode: number }
  | { kind: 'wait'; season: number; episode: number; airDate?: string }
  | { kind: 'archive' }
  | { kind: 'none' }

export function isEpisodeReleased(airDate?: string): boolean {
  if (!airDate) return true

  const airTime = new Date(airDate).getTime()

  return Number.isNaN(airTime) || airTime <= Date.now()
}

export function isFutureAirDate(airDate?: string): boolean {
  if (!airDate) return false

  const airTime = new Date(airDate).getTime()

  return !Number.isNaN(airTime) && airTime > Date.now()
}

export function sortEpisodes(episodes: Episode[]): Episode[] {
  return episodes.toSorted((left, right) => {
    if (left.seasonNumber !== right.seasonNumber) {
      return left.seasonNumber - right.seasonNumber
    }

    return left.episodeNumber - right.episodeNumber
  })
}

export function formatEpisodeAirDate(
  airDate: string,
  locale?: string,
  month: 'short' | 'long' = 'short',
): string {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month,
  }).format(new Date(airDate))
}

export function getNextEpisodeAction(show: Show, episodes: Episode[]): NextEpisodeAction {
  const sortedEpisodes = sortEpisodes(episodes)

  const nextAvailableEpisode = sortedEpisodes.find(
    (episode) => !episode.watched && isEpisodeReleased(episode.airDate),
  )

  if (nextAvailableEpisode) {
    return {
      kind: 'mark',
      season: nextAvailableEpisode.seasonNumber,
      episode: nextAvailableEpisode.episodeNumber,
    }
  }

  const nextFutureEpisode = sortedEpisodes.find(
    (episode) => !episode.watched && isFutureAirDate(episode.airDate),
  )

  if (nextFutureEpisode) {
    return {
      kind: 'wait',
      season: nextFutureEpisode.seasonNumber,
      episode: nextFutureEpisode.episodeNumber,
      airDate: nextFutureEpisode.airDate,
    }
  }

  if (show.status === 'completed' && !show.isArchived) {
    return { kind: 'archive' }
  }

  if (show.status === 'waiting' || show.status === 'completed') {
    return { kind: 'none' }
  }

  return { kind: 'none' }
}

export function shouldShowAllCaughtUpBanner(show: Show, action: NextEpisodeAction): boolean {
  return action.kind === 'none' && show.status === 'waiting'
}

export function shouldShowNextEpisodeCard(show: Show, action: NextEpisodeAction): boolean {
  if (action.kind === 'mark' || action.kind === 'wait' || action.kind === 'archive') {
    return true
  }

  return shouldShowAllCaughtUpBanner(show, action)
}

export function getActiveSeasonNumber(
  show: Show,
  episodes: Episode[],
  action: NextEpisodeAction,
): number {
  if (action.kind === 'mark' || action.kind === 'wait') {
    return action.season
  }

  const sortedEpisodes = sortEpisodes(episodes)

  return show.currentSeason ?? sortedEpisodes[0]?.seasonNumber ?? 1
}

export type LibrarySortGroup = 0 | 1 | 2

export function getLibrarySortGroup(show: Show, episodes: Episode[]): LibrarySortGroup {
  if (show.status === 'planned') {
    return 0
  }

  const action = getNextEpisodeAction(show, episodes)

  if (action.kind === 'mark' || action.kind === 'wait') {
    return 0
  }

  if (action.kind === 'none') {
    return 1
  }

  return 2
}

function compareShowTitles(left: Show, right: Show): number {
  return left.title.localeCompare(right.title, undefined, { sensitivity: 'base' })
}

export function compareLibraryShows(
  left: Show,
  right: Show,
  episodesByShowId: Map<string, Episode[]>,
): number {
  const groupLeft = getLibrarySortGroup(left, episodesByShowId.get(left.id) ?? [])
  const groupRight = getLibrarySortGroup(right, episodesByShowId.get(right.id) ?? [])

  if (groupLeft !== groupRight) {
    return groupLeft - groupRight
  }

  return compareShowTitles(left, right)
}

export function sortLibraryShows(
  shows: Show[],
  episodesByShowId: Map<string, Episode[]>,
): Show[] {
  return shows.toSorted((left, right) => compareLibraryShows(left, right, episodesByShowId))
}

export function sortShowsAlphabetically(shows: Show[]): Show[] {
  return shows.toSorted(compareShowTitles)
}
