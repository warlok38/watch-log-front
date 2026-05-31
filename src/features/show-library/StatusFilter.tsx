import { CapsuleTabs } from 'antd-mobile'
import { useTranslation } from 'react-i18next'

import type { LibraryFilter } from '@/app/providers/useAppStore'
import { useAppStore } from '@/app/providers/useAppStore'
import { WATCH_STATUSES } from '@/shared/config/watchStatuses'

export function StatusFilter() {
  const { t } = useTranslation()
  const { activeStatus, setActiveStatus } = useAppStore()

  return (
    <CapsuleTabs
      activeKey={activeStatus}
      onChange={(key) => setActiveStatus(key as LibraryFilter)}
    >
      <CapsuleTabs.Tab title={t('app.all')} key="all" />
      {WATCH_STATUSES.map((status) => (
        <CapsuleTabs.Tab title={t(`status.${status}`)} key={status} />
      ))}
      <CapsuleTabs.Tab title={t('status.archive')} key="archive" />
    </CapsuleTabs>
  )
}
