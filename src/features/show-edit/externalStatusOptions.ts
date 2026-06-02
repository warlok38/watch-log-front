import type { ExternalShowStatus } from '@/entities/show'

export const EXTERNAL_STATUS_OPTIONS: ExternalShowStatus[] = [
  'running',
  'ended',
  'to_be_determined',
  'in_development',
  'unknown',
]

export function getExternalStatusSelectorOptions(t: (key: string) => string) {
  return EXTERNAL_STATUS_OPTIONS.map((value) => ({
    label: t(`externalStatus.${value}`),
    value,
  }))
}
