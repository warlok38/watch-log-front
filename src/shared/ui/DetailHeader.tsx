import { Button } from 'antd-mobile'
import { LeftOutline, MoreOutline } from 'antd-mobile-icons'
import classNames from 'classnames'

import styles from './DetailHeader.module.css'

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
    <header className={classNames(styles.header, { [styles.hidden]: hidden })}>
      <button className={styles.back} type="button" onClick={onBack}>
        <LeftOutline />
        <span>{backLabel}</span>
      </button>
      <div className={styles.title}>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <Button className={styles.button} fill="none" aria-label={menuLabel} onClick={onMenuClick}>
        <MoreOutline />
      </Button>
    </header>
  )
}
