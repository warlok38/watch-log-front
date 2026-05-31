import { Button, Form, Input, Selector, Stepper, Toast } from 'antd-mobile'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import type { ShowKind } from '@/entities/show'
import { routes } from '@/shared/config/routes'
import { addShow } from '@/shared/db'

type ManualShowFormValues = {
  title: string
  kind: ShowKind
  seasonsCount: number
  episodesPerSeason: number
}

export function ManualShowForm() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const handleFinish = async (values: ManualShowFormValues) => {
    const id = await addShow({
      title: values.title,
      kind: values.kind,
      externalProvider: 'manual',
      seasonsCount: values.seasonsCount,
      episodesPerSeason: values.episodesPerSeason,
    })

    Toast.show({ content: t('search.add') })
    navigate(routes.showDetails(id), { state: { fromAdd: true } })
  }

  return (
    <Form
      layout="vertical"
      initialValues={{ kind: ['series'], seasonsCount: 1, episodesPerSeason: 12 }}
      footer={
        <Button block type="submit" color="primary" size="large">
          {t('form.save')}
        </Button>
      }
      onFinish={(values) =>
        void handleFinish({
          ...values,
          kind: values.kind[0],
        } as ManualShowFormValues)
      }
    >
      <Form.Item name="title" label={t('form.title')} rules={[{ required: true }]}>
        <Input placeholder={t('form.title')} />
      </Form.Item>
      <Form.Item name="kind" label={t('form.kind')}>
        <Selector
          options={[
            { label: t('form.series'), value: 'series' },
            { label: t('form.anime'), value: 'anime' },
          ]}
        />
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
