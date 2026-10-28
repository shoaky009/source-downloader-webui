import type { Experimental_DefaultFormStateBehavior, RJSFSchema, UiSchema } from '@rjsf/utils'
import validator from '@rjsf/validator-ajv8'

export const pointerFormDefaults: Experimental_DefaultFormStateBehavior = {
  emptyObjectFields: 'skipDefaults',
  arrayMinItems: { populate: 'never' },
  constAsDefaults: 'never',
}

export function sourceTypeFromId(sourceId: string): string {
  const parts = sourceId.split(':')
  return parts.length === 3 && parts[0] === 'source' ? parts[1] : parts[0]
}

export function parseSourcePointer(text: string, schema?: RJSFSchema | null): Record<string, unknown> {
  let pointer: unknown
  try {
    pointer = JSON.parse(text)
  } catch {
    throw new Error('抓取进度不是有效的 JSON')
  }
  if (pointer === null || typeof pointer !== 'object' || Array.isArray(pointer)) {
    throw new Error('抓取进度必须是 JSON 对象')
  }
  if (schema) {
    const { errors } = validator.validateFormData(pointer, schema)
    if (errors.length) {
      throw new Error(`请检查抓取进度：${errors[0].stack}`)
    }
  }
  return pointer as Record<string, unknown>
}

export function pointerUiSchema(schema: RJSFSchema): UiSchema {
  const ui: UiSchema = {}
  if (Array.isArray(schema.type) && schema.type.includes('null')) {
    ui['ui:emptyValue'] = null
  }
  // Preserve offsets and fractional seconds; native datetime-local inputs convert
  // to the browser's timezone and can discard precision when edited.
  if (schema.format === 'date-time') ui['ui:widget'] = 'text'
  for (const [key, child] of Object.entries(schema.properties ?? {})) {
    if (typeof child === 'object') ui[key] = pointerUiSchema(child)
  }
  if (typeof schema.additionalProperties === 'object') {
    ui.additionalProperties = pointerUiSchema(schema.additionalProperties)
  }
  if (Array.isArray(schema.items)) {
    const items = schema.items
    ui.items = (_data, index) => typeof items[index] === 'object' ? pointerUiSchema(items[index]) : {}
    ui['ui:options'] = { orderable: false }
  } else if (typeof schema.items === 'object') {
    ui.items = pointerUiSchema(schema.items)
  }
  return ui
}
