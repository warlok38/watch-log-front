import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'

import { routes } from '@/shared/config/routes'
import { db, resetShowField } from '@/shared/db'
import { isDraftFieldModified, isShowFieldModified, type PosterFieldValue } from '@/shared/lib/showMetadata'
import { useDetailHeaderVisibility } from '@/shared/lib/useDetailHeaderVisibility'
import { DetailHeader } from '@/shared/ui'

import styles from './ShowEdit.module.css'
import { ShowEditForm } from './ShowEditForm'
import { ShowPosterField } from './ShowPosterField'

export function ShowEditPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const isHeaderHidden = useDetailHeaderVisibility()
  const { showId } = useParams<{ showId: string }>()
  const show = useLiveQuery(() => (showId ? db.shows.get(showId) : undefined), [showId])
  const [posterOverride, setPosterOverride] = useState<PosterFieldValue | null>(null)
  const [formVersion, setFormVersion] = useState(0)

  const handleBack = () => {
    if (!showId) {
      navigate(routes.home)
      return
    }

    navigate(routes.showDetails(showId), { replace: true })
  }

  useEffect(() => {
    if (show === null) {
      navigate(routes.home)
    }
  }, [navigate, show])

  if (!showId || show === null || show === undefined) {
    return null
  }

  const poster = posterOverride ?? { posterUrl: show.posterUrl, posterBlob: show.posterBlob }
  const snapshot = show.providerSnapshot
  const posterDraft = {
    title: show.title,
    summary: show.summary ?? '',
    posterUrl: poster.posterUrl,
    posterBlob: poster.posterBlob,
  }
  const posterResetVisible = Boolean(
    snapshot && isDraftFieldModified(snapshot, posterDraft, 'posterUrl'),
  )

  const handlePosterReset = async () => {
    if (!snapshot) return

    setPosterOverride({ posterUrl: snapshot.posterUrl, posterBlob: undefined })

    if (isShowFieldModified(show, 'posterUrl')) {
      await resetShowField(show.id, 'posterUrl')
      setPosterOverride(null)
      setFormVersion((current) => current + 1)
    }
  }

  return (
    <section className={styles.page}>
      <DetailHeader
        title={t('edit.title')}
        subtitle={show.title}
        backLabel={t('common.back')}
        hidden={isHeaderHidden}
        onBack={handleBack}
      />
      <ShowPosterField
        centered
        showLabel={false}
        title={show.title}
        cacheKey={posterOverride ? `${show.id}-draft` : show.id}
        value={poster}
        showReset={posterResetVisible}
        onChange={setPosterOverride}
        onReset={() => void handlePosterReset()}
      />
      <ShowEditForm
        show={show}
        poster={poster}
        formVersion={formVersion}
        onSaved={handleBack}
        onFormVersionChange={() => setFormVersion((current) => current + 1)}
      />
    </section>
  )
}
