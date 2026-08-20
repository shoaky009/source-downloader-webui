import { useEffect, useMemo, useState } from 'react'

import { MultiSelect, SingleSelect } from '@/components/shared/multi-select'
import { componentService, type ComponentRootType } from '@/services/data.service'

export function ComponentSelector({
  type,
  multiple,
  value,
  onChange,
}: {
  type: ComponentRootType
  multiple?: boolean
  value?: string | string[]
  onChange: (next: string | string[] | undefined) => void
}) {
  const [options, setOptions] = useState<{ label: string; value: string }[]>([])

  useEffect(() => {
    let active = true
    void componentService.query({ type }).then((components) => {
      if (!active) {
        return
      }
      setOptions(
        components.map((component) => {
          const componentId = component.typeName === component.name ? component.typeName : `${component.typeName}:${component.name}`
          return { label: componentId, value: componentId }
        }),
      )
    })
    return () => {
      active = false
    }
  }, [type])

  const displayOptions = useMemo(() => {
    const selectedValues = Array.isArray(value) ? value : value ? [value] : []
    const missingValues = selectedValues.filter((selected) => !options.some((option) => option.value === selected))
    return [...options, ...missingValues.map((selected) => ({ label: selected, value: selected }))]
  }, [options, value])

  return multiple ? (
    <MultiSelect options={displayOptions} value={Array.isArray(value) ? value : []} onChange={(next) => onChange(next)} placeholder="选择组件ID" />
  ) : (
    <SingleSelect options={displayOptions} value={typeof value === 'string' ? value : undefined} onChange={(next) => onChange(next)} placeholder="选择组件ID" />
  )
}
