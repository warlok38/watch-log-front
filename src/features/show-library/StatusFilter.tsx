import { CapsuleTabs } from 'antd-mobile'
import { useTranslation } from 'react-i18next'

import type { WatchStatus } from '@/entities/show'
import { useAppStore } from '@/app/providers/useAppStore'
import { WATCH_STATUSES } from '@/shared/config/watchStatuses'

export function StatusFilter() {
  const { t } = useTranslation()
  const { activeStatus, setActiveStatus } = useAppStore()

  return (
    <CapsuleTabs
      activeKey={activeStatus}
      onChange={(key) => setActiveStatus(key as WatchStatus | 'all')}
    >
      <CapsuleTabs.Tab title="Все" key="all" />
      {WATCH_STATUSES.map((status) => (
        <CapsuleTabs.Tab title={t(`status.${status}`)} key={status} />
      ))}
    </CapsuleTabs>
  )
}
