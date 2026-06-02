import { DownOutline, UpOutline } from 'antd-mobile-icons'
import classNames from 'classnames'
import { useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import styles from './ExpandableText.module.css'

type ExpandableTextProps = {
  text: string
  maxLines?: number
  className?: string
}

export function ExpandableText({ text, maxLines = 5, className }: ExpandableTextProps) {
  const { t } = useTranslation()
  const textRef = useRef<HTMLParagraphElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [canExpand, setCanExpand] = useState(false)

  useLayoutEffect(() => {
    const element = textRef.current
    if (!element || expanded) return

    const checkOverflow = () => {
      setCanExpand(element.scrollHeight > element.clientHeight + 1)
    }

    checkOverflow()
    window.addEventListener('resize', checkOverflow)

    return () => window.removeEventListener('resize', checkOverflow)
  }, [text, maxLines, expanded])

  return (
    <div className={classNames(styles.root, className)}>
      <p
        ref={textRef}
        className={classNames(styles.text, { [styles.clamped]: !expanded })}
        style={{ ['--expandable-text-max-lines' as string]: maxLines }}
      >
        {text}
      </p>

      {canExpand && (
        <button
          type="button"
          className={styles.toggle}
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          <span>{expanded ? t('details.collapseSummary') : t('details.expandSummary')}</span>
          <span aria-hidden>{expanded ? <UpOutline /> : <DownOutline />}</span>
        </button>
      )}
    </div>
  )
}
