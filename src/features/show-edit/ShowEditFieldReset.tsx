import { Button } from 'antd-mobile'
import { UndoOutline } from 'antd-mobile-icons'
import classNames from 'classnames'

import styles from './ShowEdit.module.css'

type ShowEditFieldResetProps = {
  visible: boolean
  onReset: () => void
}

export function ShowEditFieldReset({ visible, onReset }: ShowEditFieldResetProps) {
  return (
    <span className={styles.resetSlot} aria-hidden={!visible}>
      <Button
        fill="none"
        size="mini"
        color="primary"
        disabled={!visible}
        tabIndex={visible ? 0 : -1}
        className={classNames(!visible && styles.resetHidden)}
        onClick={onReset}
      >
        <UndoOutline />
      </Button>
    </span>
  )
}
