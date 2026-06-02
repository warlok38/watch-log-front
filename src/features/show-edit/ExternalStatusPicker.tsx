import { CapsuleTabs } from 'antd-mobile'
import { useTranslation } from 'react-i18next'

import type { ExternalShowStatus } from '@/entities/show'

import { EXTERNAL_STATUS_OPTIONS } from './externalStatusOptions'

type ExternalStatusPickerProps = {
  value: ExternalShowStatus
  onChange: (value: ExternalShowStatus) => void
}

export function ExternalStatusPicker({ value, onChange }: ExternalStatusPickerProps) {
  const { t } = useTranslation()

  return (
    <CapsuleTabs
      activeKey={value}
      onChange={(key) => onChange(key as ExternalShowStatus)}
    >
      {EXTERNAL_STATUS_OPTIONS.map((status) => (
        <CapsuleTabs.Tab key={status} title={t(`externalStatus.${status}`)} />
      ))}
    </CapsuleTabs>
  )
}
