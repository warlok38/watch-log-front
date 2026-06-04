import { AddOutline } from 'antd-mobile-icons'
import { Collapse, Dialog } from 'antd-mobile'
import { useTranslation } from 'react-i18next'

import { EpisodeCountStepper } from './EpisodeCountStepper'
import {
  addSeason,
  getSourceSeasonNumber,
  getStructureTotals,
  getUnwatchedRemovalCount,
  removeSeason,
  updateSeasonEpisodeCount,
} from './seasonStructure'
import styles from './ManualShowStructureField.module.css'
import type { SeasonStructureItem } from './types'

type ManualShowStructureFieldProps = {
  value: SeasonStructureItem[]
  onChange: (value: SeasonStructureItem[]) => void
  watchedBySeason?: Map<number, number>
  originalStructure?: SeasonStructureItem[]
  defaultActiveSeason?: number
}

function getOriginalEpisodeCount(
  originalStructure: SeasonStructureItem[] | undefined,
  season: SeasonStructureItem,
): number {
  const sourceSeasonNumber = getSourceSeasonNumber(season)

  return (
    originalStructure?.find((item) => getSourceSeasonNumber(item) === sourceSeasonNumber)
      ?.episodeCount ?? season.episodeCount
  )
}

export function ManualShowStructureField({
  value,
  onChange,
  watchedBySeason,
  originalStructure,
  defaultActiveSeason = 1,
}: ManualShowStructureFieldProps) {
  const { t } = useTranslation()
  const totals = getStructureTotals(value)
  const hasWatchProgress = Boolean(watchedBySeason)

  const handleEpisodeCountChange = (seasonNumber: number, episodeCount: number) => {
    onChange(updateSeasonEpisodeCount(value, seasonNumber, episodeCount))
  }

  const handleAddSeason = () => {
    onChange(addSeason(value))
  }

  const handleDeleteSeason = async (seasonNumber: number) => {
    const season = value.find((item) => item.seasonNumber === seasonNumber)
    const watchedCount = season
      ? (watchedBySeason?.get(getSourceSeasonNumber(season)) ?? 0)
      : 0

    if (watchedCount > 0) {
      const confirmed = await Dialog.confirm({
        cancelText: t('common.cancel'),
        confirmText: t('common.confirm'),
        content: t('structure.confirmDeleteSeason', { season: seasonNumber }),
      })

      if (!confirmed) return
    }

    onChange(removeSeason(value, seasonNumber))
  }

  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>{t('structure.title')}</span>

      <Collapse
        className={styles.seasonCollapse}
        accordion
        defaultActiveKey={String(defaultActiveSeason)}
      >
        {value.map((season) => {
          const watchedCount = watchedBySeason?.get(getSourceSeasonNumber(season)) ?? 0
          const originalCount = getOriginalEpisodeCount(originalStructure, season)
          const currentCount = originalCount
          const unwatchedRemovalCount = getUnwatchedRemovalCount(
            currentCount,
            season.episodeCount,
            watchedCount,
          )
          const minEpisodeCount = Math.max(watchedCount, 1)

          return (
            <Collapse.Panel
              key={String(season.seasonNumber)}
              title={
                <div className={styles.seasonPanelTitle}>
                  <span>{t('details.season', { season: season.seasonNumber })}</span>
                  <span className={styles.seasonPanelMeta}>
                    {hasWatchProgress
                      ? `${watchedCount}/${season.episodeCount}`
                      : t('structure.episodesCount', { count: season.episodeCount })}
                  </span>
                </div>
              }
            >
              <div className={styles.panelBody}>
                <div className={styles.episodeRow}>
                  <span className={styles.episodeLabel}>{t('form.episodes')}</span>
                  <EpisodeCountStepper
                    min={minEpisodeCount}
                    max={200}
                    value={season.episodeCount}
                    onChange={(nextValue) =>
                      handleEpisodeCountChange(season.seasonNumber, nextValue)
                    }
                  />
                </div>

                {unwatchedRemovalCount > 0 && (
                  <p className={styles.warning}>
                    {t('structure.unwatchedWillBeRemoved', { count: unwatchedRemovalCount })}
                  </p>
                )}

                {value.length > 1 && (
                  <button
                    type="button"
                    className={styles.deleteSeason}
                    onClick={() => void handleDeleteSeason(season.seasonNumber)}
                  >
                    {t('structure.deleteSeason')}
                  </button>
                )}
              </div>
            </Collapse.Panel>
          )
        })}
      </Collapse>

      <button type="button" className={styles.addSeason} onClick={handleAddSeason}>
        <AddOutline /> {t('structure.addSeason')}
      </button>

      <p className={styles.total}>
        {t('structure.total', { seasons: totals.seasons, episodes: totals.episodes })}
      </p>
    </div>
  )
}
