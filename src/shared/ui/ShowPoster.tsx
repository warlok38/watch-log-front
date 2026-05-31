import classNames from 'classnames'

import styles from './ShowPoster.module.css'

type ShowPosterProps = {
  src?: string
  title: string
  className?: string
}

export function ShowPoster({ src, title, className }: ShowPosterProps) {
  if (src) {
    return <img className={classNames(styles.poster, className)} src={src} alt={title} loading="lazy" />
  }

  return <div className={classNames(styles.poster, styles.fallback, className)}>{title.slice(0, 1).toUpperCase()}</div>
}
