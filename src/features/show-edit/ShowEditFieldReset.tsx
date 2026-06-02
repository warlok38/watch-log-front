import { Button } from 'antd-mobile'
import { useTranslation } from 'react-i18next'

type ShowEditFieldResetProps = {
  visible: boolean
  onReset: () => void
}

export function ShowEditFieldReset({ visible, onReset }: ShowEditFieldResetProps) {
  const { t } = useTranslation()

  if (!visible) return null

  return (
    <Button fill="none" size="mini" color="primary" onClick={onReset}>
      {t('edit.resetToDefault')}
    </Button>
  )
}
