import { useLayoutEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { ExternalShowStatus } from '@/entities/show'

import { ExternalStatusPicker } from './ExternalStatusPicker'
import styles from './ShowEdit.module.css'

type ExternalStatusFieldProps = {
  initialStatus: ExternalShowStatus
  onChange: (status: ExternalShowStatus) => void
}

export function ExternalStatusField({ initialStatus, onChange }: ExternalStatusFieldProps) {
  const { t } = useTranslation()
  const [status, setStatus] = useState(initialStatus)

  useLayoutEffect(() => {
    onChange(initialStatus)
  }, [initialStatus, onChange])

  const handleChange = (next: ExternalShowStatus) => {
    setStatus(next)
    onChange(next)
  }

  return (
    <div className={styles.statusField}>
      <span className={styles.fieldLabel}>{t('edit.externalStatus')}</span>
      <ExternalStatusPicker value={status} onChange={handleChange} />
    </div>
  )
}
