import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import editStyles from '@/features/show-edit/ShowEdit.module.css'
import { ShowPosterField, type PosterFieldValue } from '@/features/show-edit'
import { routes } from '@/shared/config/routes'
import { useDetailHeaderVisibility } from '@/shared/lib/useDetailHeaderVisibility'
import { DetailHeader } from '@/shared/ui'

import { ManualShowForm } from './ManualShowForm'

export function ManualShowCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const isHeaderHidden = useDetailHeaderVisibility()
  const [poster, setPoster] = useState<PosterFieldValue>({})
  const [draftTitle, setDraftTitle] = useState('')

  const handleBack = () => {
    navigate(routes.search, { replace: true })
  }

  return (
    <section className={editStyles.page}>
      <DetailHeader
        title={t('search.addManual')}
        backLabel={t('common.back')}
        hidden={isHeaderHidden}
        onBack={handleBack}
      />
      <ShowPosterField
        centered
        showLabel={false}
        title={draftTitle}
        cacheKey="manual-draft"
        value={poster}
        onChange={setPoster}
      />
      <ManualShowForm poster={poster} onTitleChange={setDraftTitle} />
    </section>
  )
}
