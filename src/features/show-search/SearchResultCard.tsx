import { Button, Card, Tag, Toast } from 'antd-mobile'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { getShowDetails, type ShowSearchResult } from '@/shared/api'
import { routes } from '@/shared/config/routes'
import { addShow } from '@/shared/db'
import { ShowPoster } from '@/shared/ui'

import styles from '@/features/show-library/ShowCard.module.css'

type SearchResultCardProps = {
  result: ShowSearchResult
}

export function SearchResultCard({ result }: SearchResultCardProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [isAdding, setIsAdding] = useState(false)

  const handleAdd = async () => {
    setIsAdding(true)

    try {
      const draft = await getShowDetails(result)
      const showId = await addShow(draft)

      Toast.show({ content: t('search.added') })
      navigate(routes.showDetails(showId), { state: { fromAdd: true } })
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <Card className={styles.card}>
      <div className={styles.layout}>
        <ShowPoster src={result.posterUrl} title={result.title} />
        <div className={styles.body}>
          <div className={styles.titleRow}>
            <h3>{result.title}</h3>
            <Tag color={result.kind === 'anime' ? 'purple' : 'primary'}>{t(`kind.${result.kind}`)}</Tag>
          </div>
          <p>{t('search.provider', { provider: result.providerLabel })}</p>
          {result.year && <p>{result.year}</p>}
          <Button color="primary" size="small" loading={isAdding} onClick={() => void handleAdd()}>
            {t('search.add')}
          </Button>
        </div>
      </div>
    </Card>
  )
}
