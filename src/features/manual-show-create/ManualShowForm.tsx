import { Button, Form, Input, Selector, Stepper, TextArea, Toast } from 'antd-mobile'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import type { ExternalShowStatus } from '@/entities/show'
import { getExternalStatusSelectorOptions, ShowPosterField, type PosterFieldValue } from '@/features/show-edit'
import { routes } from '@/shared/config/routes'
import { addShow } from '@/shared/db'
type ManualShowFormValues = {
  title: string
  summary: string
  externalStatus: ExternalShowStatus[]
  seasonsCount: number
  episodesPerSeason: number
}

export function ManualShowForm() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [poster, setPoster] = useState<PosterFieldValue>({})

  const handleFinish = async (values: ManualShowFormValues) => {
    const id = await addShow({
      title: values.title,
      kind: 'series',
      externalProvider: 'manual',
      externalStatus: values.externalStatus[0],
      summary: values.summary || undefined,
      posterBlob: poster.posterBlob,
      posterUrl: poster.posterUrl,
      seasonsCount: values.seasonsCount,
      episodesPerSeason: values.episodesPerSeason,
    })

    Toast.show({ content: t('search.add') })
    navigate(routes.showDetails(id), { state: { fromAdd: true } })
  }

  return (
    <Form
      layout="vertical"
      initialValues={{
        externalStatus: ['unknown'],
        seasonsCount: 1,
        episodesPerSeason: 12,
        summary: '',
      }}
      footer={
        <Button block type="submit" color="primary" size="large">
          {t('form.save')}
        </Button>
      }
      onFinish={(values) => void handleFinish(values as ManualShowFormValues)}
    >
      <Form.Item name="title" label={t('form.title')} rules={[{ required: true }]}>
        <Input placeholder={t('form.title')} />
      </Form.Item>

      <ShowPosterField cacheKey="manual-draft" title="" value={poster} onChange={setPoster} />

      <Form.Item name="summary" label={t('form.summary')}>
        <TextArea placeholder={t('form.summary')} autoSize={{ minRows: 1, maxRows: 4 }} />
      </Form.Item>

      <Form.Item name="externalStatus" label={t('form.externalStatus')}>
        <Selector options={getExternalStatusSelectorOptions(t)} />
      </Form.Item>

      <Form.Item name="seasonsCount" label={t('form.seasons')}>
        <Stepper min={1} max={50} />
      </Form.Item>
      <Form.Item name="episodesPerSeason" label={t('form.episodes')}>
        <Stepper min={1} max={200} />
      </Form.Item>
    </Form>
  )
}
