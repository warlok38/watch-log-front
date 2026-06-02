import { AddOutline, CloseOutline } from 'antd-mobile-icons'
import classNames from 'classnames'
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { ShowPoster } from '@/shared/ui'

import styles from './ShowEdit.module.css'
import { ShowEditFieldReset } from './ShowEditFieldReset'

export type PosterFieldValue = {
  posterUrl?: string
  posterBlob?: Blob
}

type ShowPosterFieldProps = {
  title: string
  value: PosterFieldValue
  cacheKey?: string
  onChange: (value: PosterFieldValue) => void
  centered?: boolean
  showLabel?: boolean
  showReset?: boolean
  onReset?: () => void
}

export function ShowPosterField({
  title,
  value,
  cacheKey,
  onChange,
  centered = false,
  showLabel = true,
  showReset = false,
  onReset,
}: ShowPosterFieldProps) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const hasPoster = Boolean(value.posterBlob || value.posterUrl)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    onChange({ posterBlob: file })
    event.target.value = ''
  }

  const openFilePicker = () => {
    inputRef.current?.click()
  }

  const handleDelete = () => {
    onChange({})
  }

  return (
    <div className={classNames(centered ? styles.posterHero : styles.formSection)}>
      {showLabel && (
        <div className={styles.fieldLabelRow}>
          <span className={styles.fieldLabel}>{t('edit.poster')}</span>
          {onReset && <ShowEditFieldReset visible={showReset} onReset={onReset} />}
        </div>
      )}
      <div className={classNames(styles.posterField, centered && styles.posterFieldCentered)}>
        <div className={styles.posterPickerWrapper}>
          <button
            type="button"
            className={classNames(styles.posterPicker, { [styles.posterPickerFilled]: hasPoster })}
            onClick={openFilePicker}
            aria-label={t('edit.uploadPoster')}
          >
            {hasPoster ? (
              <ShowPoster
                className={styles.posterPreview}
                cacheKey={cacheKey}
                posterBlob={value.posterBlob}
                src={value.posterUrl}
                title={title}
              />
            ) : (
              <span className={styles.posterEmpty}>
                <AddOutline />
              </span>
            )}
          </button>
          {hasPoster && (
            <button
              type="button"
              className={styles.posterDelete}
              aria-label={t('edit.removePoster')}
              onClick={handleDelete}
            >
              <CloseOutline />
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          className={styles.hiddenInput}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
        />
      </div>
      {!showLabel && onReset && <ShowEditFieldReset visible={showReset} onReset={onReset} />}
    </div>
  )
}
