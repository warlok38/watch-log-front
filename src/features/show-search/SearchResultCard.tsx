import { Button, Card, Tag, Toast } from 'antd-mobile'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import type { ShowSearchResult } from '@/shared/api'
import { routes } from '@/shared/config/routes'
import { addShow } from '@/shared/db'
import { ShowPoster } from '@/shared/ui'

type SearchResultCardProps = {
  result: ShowSearchResult
}

export function SearchResultCard({ result }: SearchResultCardProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const handleAdd = async () => {
    const showId = await addShow(result)
    Toast.show({ content: t('search.add') })
    navigate(routes.showDetails(showId))
  }

  return (
    <Card className="show-card">
      <div className="show-card__layout">
        <ShowPoster src={result.posterUrl} title={result.title} />
        <div className="show-card__body">
          <div className="show-card__title-row">
            <h3>{result.title}</h3>
            <Tag color={result.kind === 'anime' ? 'purple' : 'primary'}>{result.kind}</Tag>
          </div>
          <p>{t('search.provider', { provider: result.providerLabel })}</p>
          {result.year && <p>{result.year}</p>}
          <Button color="primary" size="small" onClick={() => void handleAdd()}>
            {t('search.add')}
          </Button>
        </div>
      </div>
    </Card>
  )
}
