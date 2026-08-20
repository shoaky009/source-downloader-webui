import { useEffect, useState } from 'react'

import { MultiSelect, SingleSelect } from '@/components/shared/multi-select'
import { instanceService } from '@/services/data.service'

export function InstanceSelector({
  factoryType,
  multiple,
  value,
  onChange,
  disabled,
}: {
  factoryType?: string
  multiple?: boolean
  value?: string | string[]
  onChange: (next: string | string[] | undefined) => void
  disabled?: boolean
}) {
  const [options, setOptions] = useState<{ label: string; value: string }[]>([])

  useEffect(() => {
    void instanceService.query().then((instances) => {
      setOptions(
        instances
          .filter((instance) => !factoryType || instance.type === factoryType)
          .map((instance) => ({ label: instance.name, value: instance.name })),
      )
    })
  }, [factoryType])

  return multiple ? (
    <MultiSelect
      options={options}
      value={Array.isArray(value) ? value : []}
      onChange={onChange}
      placeholder="选择实例"
      disabled={disabled}
    />
  ) : (
    <SingleSelect
      options={options}
      value={typeof value === 'string' ? value : undefined}
      onChange={onChange}
      placeholder="选择实例"
      disabled={disabled}
    />
  )
}
