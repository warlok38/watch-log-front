import classNames from 'classnames'

import { usePosterSrc } from '@/shared/lib/usePosterSrc'

import styles from './ShowPoster.module.css'

type ShowPosterProps = {
  src?: string
  posterBlob?: Blob
  cacheKey?: string
  title: string
  className?: string
}

export function ShowPoster({ src, posterBlob, cacheKey, title, className }: ShowPosterProps) {
  const resolvedSrc = usePosterSrc(src, posterBlob, cacheKey)

  if (resolvedSrc) {
    return (
      <img
        className={classNames(styles.poster, className)}
        src={resolvedSrc}
        alt={title}
        loading="lazy"
      />
    )
  }

  return (
    <div className={classNames(styles.poster, styles.fallback, className)}>
      {title.slice(0, 1).toUpperCase()}
    </div>
  )
}
