import { Button, Form, Input, TextArea, Toast } from 'antd-mobile'
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'

import type { ProviderSnapshot, Show, ShowMetadataField } from '@/entities/show'
import { resetShowField, updateShowMetadata } from '@/shared/db'
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
  const title = Form.useWatch('title', form) ?? show.title
  const summary = Form.useWatch('summary', form) ?? show.summary ?? ''
  const draft = getDraftFromForm(snapshot, title, summary, poster)
  const externalStatusRef = useRef(show.externalStatus)

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

  const handleFinish = async (values: ShowEditFormValues) => {
    const posterPatch = getPosterMetadataPatch(poster, show)

    await updateShowMetadata(show.id, {
      title: values.title,
      summary: values.summary,
      ...(isManual ? { externalStatus: externalStatusRef.current } : {}),
      ...posterPatch,
    })

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
        <Form.Item
          name="title"
          label={
            <FieldLabel
              text={t('form.title')}
              resetVisible={Boolean(draft && isDraftFieldModified(snapshot!, draft, 'title'))}
              onReset={() => void handleReset('title')}
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
              resetVisible={Boolean(draft && isDraftFieldModified(snapshot!, draft, 'summary'))}
              onReset={() => void handleReset('summary')}
            />
          }
        >
          <TextArea placeholder={t('edit.summary')} autoSize={{ minRows: 1, maxRows: 4 }} />
        </Form.Item>
      </Form>

      {isManual && (
        <ExternalStatusField
          key={`${show.id}-${formVersion}`}
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
