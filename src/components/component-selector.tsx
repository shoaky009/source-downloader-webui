import { useState } from 'react'

import { MultiSelect, SingleSelect } from '~/components/shared/multi-select'
import { componentService } from '~/services/data.service'

export function ComponentSelector({
  type,
  multiple,
  value,
  onChange,
}: {
  type: string
  multiple?: boolean
  value?: string | string[]
  onChange: (next: string | string[] | undefined) => void
}) {
  const [options, setOptions] = useState<{ label: string; value: string }[]>([])

  const loadOptions = async () => {
    if (options.length > 0) {
      return
    }
    const components = await componentService.query({ type })
    setOptions(
      components.map((component) => {
        const componentId = component.typeName === component.name ? component.typeName : `${component.typeName}:${component.name}`
        return {
          label: componentId,
          value: componentId,
        }
      }),
    )
  }

  return (
    <div onClick={loadOptions}>
      {multiple ? (
        <MultiSelect options={options} value={Array.isArray(value) ? value : []} onChange={(next) => onChange(next)} placeholder="选择组件ID" />
      ) : (
        <SingleSelect options={options} value={typeof value === 'string' ? value : undefined} onChange={(next) => onChange(next)} placeholder="选择组件ID" />
      )}
    </div>
  )
}
