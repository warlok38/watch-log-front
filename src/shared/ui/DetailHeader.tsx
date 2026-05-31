import { Button } from 'antd-mobile'
import { LeftOutline, MoreOutline } from 'antd-mobile-icons'

type DetailHeaderProps = {
  title: string
  subtitle?: string
  backLabel: string
  menuLabel: string
  hidden?: boolean
  onBack: () => void
  onMenuClick: () => void
}

export function DetailHeader({
  title,
  subtitle,
  backLabel,
  menuLabel,
  hidden = false,
  onBack,
  onMenuClick,
}: DetailHeaderProps) {
  return (
    <header className={`detail-header${hidden ? ' detail-header--hidden' : ''}`}>
      <button className="detail-header__back" type="button" onClick={onBack}>
        <LeftOutline />
        <span>{backLabel}</span>
      </button>
      <div className="detail-header__title">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <Button className="detail-header__button" fill="none" aria-label={menuLabel} onClick={onMenuClick}>
        <MoreOutline />
      </Button>
    </header>
  )
}
