import type { FieldProps, FormContextType, RJSFSchema } from '@rjsf/utils'

import { InstanceSelector } from '@/components/instance-selector'

interface InstanceFieldOptions {
  factoryType?: string
}

export function InstanceField(
  props: FieldProps<string, RJSFSchema, FormContextType>,
) {
  const options = props.uiSchema?.['ui:options'] as InstanceFieldOptions | undefined

  return (
    <InstanceSelector
      factoryType={options?.factoryType}
      value={props.formData}
      onChange={(value) => props.onChange(typeof value === 'string' ? value : undefined, [])}
      disabled={props.disabled || props.readonly}
    />
  )
}
