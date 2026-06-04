import { Button, Form, Input, TextArea, Toast } from 'antd-mobile'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import type { ExternalShowStatus } from '@/entities/show'
import { ExternalStatusField } from '@/features/show-edit/ExternalStatusField'
import editStyles from '@/features/show-edit/ShowEdit.module.css'
import type { PosterFieldValue } from '@/features/show-edit'
import {
  createDefaultStructure,
  getStructureAggregates,
  ManualShowStructureField,
  structureToEpisodeDrafts,
  validateSeasonStructure,
} from '@/features/manual-show-structure'
import type { SeasonStructureItem } from '@/features/manual-show-structure'
import { routes } from '@/shared/config/routes'
import { addShow } from '@/shared/db'

type ManualShowFormValues = {
  title: string
  summary: string
}

type ManualShowFormProps = {
  poster: PosterFieldValue
  onTitleChange?: (title: string) => void
}

export function ManualShowForm({ poster, onTitleChange }: ManualShowFormProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [form] = Form.useForm<ManualShowFormValues>()
  const externalStatusRef = useRef<ExternalShowStatus>('unknown')
  const [structure, setStructure] = useState<SeasonStructureItem[]>(createDefaultStructure)

  const handleFinish = async (values: ManualShowFormValues) => {
    const validationErrors = validateSeasonStructure(structure)

    if (validationErrors.length > 0) {
      Toast.show({ content: t(`structure.${validationErrors[0]}`) })
      return
    }

    const aggregates = getStructureAggregates(structure)

    const id = await addShow({
      title: values.title,
      kind: 'series',
      externalProvider: 'manual',
      externalStatus: externalStatusRef.current,
      summary: values.summary || undefined,
      posterBlob: poster.posterBlob,
      posterUrl: poster.posterUrl,
      seasonsCount: aggregates.seasonsCount,
      episodesPerSeason: aggregates.episodesPerSeason,
      episodes: structureToEpisodeDrafts(structure),
    })

    Toast.show({ content: t('search.add') })
    navigate(routes.showDetails(id), { state: { fromAdd: true } })
  }

  return (
    <>
      <Form
        className={editStyles.form}
        form={form}
        layout="vertical"
        initialValues={{
          summary: '',
        }}
        onFinish={(values) => void handleFinish(values as ManualShowFormValues)}
      >
        <Form.Subscribe to={['title']}>
          {(values) => {
            onTitleChange?.(String(values.title ?? ''))
            return null
          }}
        </Form.Subscribe>

        <Form.Item name="title" label={t('form.title')} rules={[{ required: true }]}>
          <Input placeholder={t('form.title')} />
        </Form.Item>

        <Form.Item name="summary" label={t('edit.summary')}>
          <TextArea placeholder={t('edit.summary')} autoSize={{ minRows: 1, maxRows: 4 }} />
        </Form.Item>
      </Form>

      <ManualShowStructureField value={structure} onChange={setStructure} />

      <ExternalStatusField
        initialStatus="unknown"
        onChange={(status) => {
          externalStatusRef.current = status
        }}
      />

      <div className={editStyles.saveFooter}>
        <Button block color="primary" size="large" onClick={() => form.submit()}>
          {t('edit.save')}
        </Button>
      </div>
    </>
  )
}
