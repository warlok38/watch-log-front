import { AddOutline, MinusOutline } from 'antd-mobile-icons'
import { Button, Input } from 'antd-mobile'
import 'antd-mobile/es/components/stepper/stepper.css'
import { useState } from 'react'

import { clampEpisodeCount, parsePositiveIntegerInput } from './seasonStructure'

type EpisodeCountStepperProps = {
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}

export function EpisodeCountStepper({ value, min, max, onChange }: EpisodeCountStepperProps) {
  const [focused, setFocused] = useState(false)
  const [inputValue, setInputValue] = useState(String(value))

  const commitInput = (text: string) => {
    const nextValue = clampEpisodeCount(parsePositiveIntegerInput(text, value), min, max)
    onChange(nextValue)
    setInputValue(String(nextValue))
  }

  return (
    <div className="adm-stepper">
      <Button
        className="adm-stepper-minus"
        fill="none"
        shape="rectangular"
        color="primary"
        disabled={value <= min}
        onClick={() => onChange(clampEpisodeCount(value - 1, min, max))}
      >
        <MinusOutline />
      </Button>

      <div className="adm-stepper-middle">
        <Input
          className="adm-stepper-input"
          inputMode="numeric"
          pattern="[0-9]*"
          value={focused ? inputValue : String(value)}
          onFocus={() => {
            setFocused(true)
            setInputValue(String(value))
          }}
          onBlur={() => {
            setFocused(false)
            commitInput(inputValue)
          }}
          onChange={(text) => {
            if (!/^\d*$/.test(text)) return

            setInputValue(text)

            if (text === '') return

            const parsed = Number.parseInt(text, 10)
            if (Number.isNaN(parsed)) return

            onChange(clampEpisodeCount(parsed, min, max))
          }}
        />
      </div>

      <Button
        className="adm-stepper-plus"
        fill="none"
        shape="rectangular"
        color="primary"
        disabled={value >= max}
        onClick={() => onChange(clampEpisodeCount(value + 1, min, max))}
      >
        <AddOutline />
      </Button>
    </div>
  )
}
