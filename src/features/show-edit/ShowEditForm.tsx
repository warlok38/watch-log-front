import { Button, Form, Input, TextArea, Toast } from 'antd-mobile'
import { useLiveQuery } from 'dexie-react-hooks'
import { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { Episode } from '@/entities/episode'
import type { ProviderSnapshot, Show, ShowMetadataField } from '@/entities/show'
import {
  createDefaultStructure,
  getWatchedBySeasonForStructure,
  getWatchedCountsBySeason,
  ManualShowStructureField,
  seasonStructureFromEpisodes,
  validateSeasonStructure,
} from '@/features/manual-show-structure'
import type { SeasonStructureItem } from '@/features/manual-show-structure'
import { db, resetShowField, updateShowMetadata, updateShowStructure } from '@/shared/db'
import {
  getPosterMetadataPatch,
  isDraftFieldModified,
  isShowFieldModified,
  type PosterFieldValue,
} from '@/shared/lib/showMetadata'
import { ExternalStatusField } from './ExternalStatusField'
import styles from './ShowEdit.module.css'
import { ShowEditFieldReset } from './ShowEditFieldReset'

type ShowEditFormProps = {
  show: Show
  poster: PosterFieldValue
  formVersion: number
  onSaved: () => void
  onFormVersionChange: () => void
}

type ShowEditFormValues = {
  title: string
  summary: string
}

type FieldLabelProps = {
  text: string
  resetVisible?: boolean
  onReset?: () => void
}

function FieldLabel({ text, resetVisible, onReset }: FieldLabelProps) {
  return (
    <span className={styles.fieldLabelRow}>
      <span>{text}</span>
      {onReset && <ShowEditFieldReset visible={Boolean(resetVisible)} onReset={onReset} />}
    </span>
  )
}

function getDraftFromForm(
  snapshot: ProviderSnapshot | undefined,
  title: string,
  summary: string,
  poster: PosterFieldValue,
) {
  if (!snapshot) return null

  return {
    title,
    summary,
    posterUrl: poster.posterUrl,
    posterBlob: poster.posterBlob,
  }
}

function getStructureFromEpisodes(episodes: Episode[]): SeasonStructureItem[] {
  return episodes.length > 0 ? seasonStructureFromEpisodes(episodes) : createDefaultStructure()
}

export function ShowEditForm({
  show,
  poster,
  formVersion,
  onSaved,
  onFormVersionChange,
}: ShowEditFormProps) {
  const { t } = useTranslation()
  const [form] = Form.useForm<ShowEditFormValues>()
  const isManual = show.externalProvider === 'manual'
  const snapshot = show.providerSnapshot
  const externalStatusRef = useRef(show.externalStatus)
  const [structureDraft, setStructureDraft] = useState<SeasonStructureItem[] | null>(null)
  const [structureBaseline, setStructureBaseline] = useState<SeasonStructureItem[] | null>(null)
  const episodes = useLiveQuery(
    () => (isManual ? db.episodes.where('showId').equals(show.id).toArray() : []),
    [isManual, show.id],
  )

  if (isManual && episodes !== undefined && structureDraft === null) {
    const next = getStructureFromEpisodes(episodes)
    setStructureDraft(next)
    setStructureBaseline(next)
  }

  const handleStructureChange = useCallback((nextStructure: SeasonStructureItem[]) => {
    setStructureDraft(nextStructure)
  }, [])

  const isFieldResetVisible = useCallback(
    (field: ShowMetadataField, title: string, summary: string) => {
      if (!snapshot) return false

      const draft = getDraftFromForm(snapshot, title, summary, poster)
      if (!draft) return false

      return isDraftFieldModified(snapshot, draft, field)
    },
    [poster, snapshot],
  )

  const handleReset = async (field: ShowMetadataField) => {
    if (!snapshot) return

    switch (field) {
      case 'title':
        form.setFieldsValue({ title: snapshot.title })
        break
      case 'summary':
        form.setFieldsValue({ summary: snapshot.summary ?? '' })
        break
    }

    if (isShowFieldModified(show, field)) {
      await resetShowField(show.id, field)
      onFormVersionChange()
    }
  }

  const syncStructureFromDb = async () => {
    const freshEpisodes = await db.episodes.where('showId').equals(show.id).toArray()
    const next = getStructureFromEpisodes(freshEpisodes)

    setStructureDraft(next)
    setStructureBaseline(next)
  }

  const handleFinish = async (values: ShowEditFormValues) => {
    const structure = structureDraft

    if (isManual && structure) {
      const watchedBySeason = getWatchedCountsBySeason(episodes ?? [])
      const validationWatchedBySeason = getWatchedBySeasonForStructure(structure, watchedBySeason)
      const validationErrors = validateSeasonStructure(structure, validationWatchedBySeason)

      if (validationErrors.length > 0) {
        Toast.show({ content: t(`structure.${validationErrors[0]}`) })
        return
      }
    }

    const posterPatch = getPosterMetadataPatch(poster, show)

    await updateShowMetadata(show.id, {
      title: values.title,
      summary: values.summary,
      ...(isManual ? { externalStatus: externalStatusRef.current } : {}),
      ...posterPatch,
    })

    if (isManual && structure) {
      try {
        await updateShowStructure(show.id, structure)
        await syncStructureFromDb()
      } catch {
        Toast.show({ content: t('structure.cannotReduceBelowWatched') })
        return
      }
    }

    Toast.show({ content: t('edit.saved') })
    onSaved()
  }

  return (
    <>
      <Form
        key={`${show.id}-${show.updatedAt}-${formVersion}`}
        className={styles.form}
        form={form}
        layout="vertical"
        initialValues={{
          title: show.title,
          summary: show.summary ?? '',
        }}
        onFinish={(values) => void handleFinish(values as ShowEditFormValues)}
      >
        <Form.Subscribe to={['title', 'summary']}>
          {(values) => {
            const title = String(values.title ?? show.title)
            const summary = String(values.summary ?? show.summary ?? '')

            return (
              <>
                <Form.Item
                  name="title"
                  label={
                    <FieldLabel
                      text={t('form.title')}
                      resetVisible={isFieldResetVisible('title', title, summary)}
                      onReset={snapshot ? () => void handleReset('title') : undefined}
                    />
                  }
                  rules={[{ required: true }]}
                >
                  <Input placeholder={t('form.title')} />
                </Form.Item>

                <Form.Item
                  name="summary"
                  label={
                    <FieldLabel
                      text={t('edit.summary')}
                      resetVisible={isFieldResetVisible('summary', title, summary)}
                      onReset={snapshot ? () => void handleReset('summary') : undefined}
                    />
                  }
                >
                  <TextArea placeholder={t('edit.summary')} autoSize={{ minRows: 1, maxRows: 4 }} />
                </Form.Item>
              </>
            )
          }}
        </Form.Subscribe>
      </Form>

      {isManual && structureDraft && episodes !== undefined && (
        <ManualShowStructureField
          value={structureDraft}
          originalStructure={structureBaseline ?? structureDraft}
          watchedBySeason={getWatchedCountsBySeason(episodes)}
          defaultActiveSeason={show.currentSeason}
          onChange={handleStructureChange}
        />
      )}

      {isManual && (
        <ExternalStatusField
          key={`${show.id}-${show.externalStatus}-${show.updatedAt}`}
          initialStatus={show.externalStatus}
          onChange={(status) => {
            externalStatusRef.current = status
          }}
        />
      )}

      <div className={styles.saveFooter}>
        <Button block color="primary" size="large" onClick={() => form.submit()}>
          {t('edit.save')}
        </Button>
      </div>
    </>
  )
}
