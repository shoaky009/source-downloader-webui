import type { FieldProps } from '@rjsf/utils'

import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'

type Pair = { key: string; value: string }

function toPairs(value: unknown): Pair[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return []
  }
  return Object.entries(value as Record<string, unknown>).map(([key, val]) => ({ key, value: String(val ?? '') }))
}

export function KeyValueField(props: FieldProps) {
  const pairs = toPairs(props.formData)

  const updatePairs = (next: Pair[]) => {
    const nextValue = next.reduce<Record<string, string>>((acc, pair) => {
        if (pair.key) {
          acc[pair.key] = pair.value
        }
        return acc
      }, {})
    props.onChange(nextValue, [], props.schema, props.idSchema)
  }

  return (
    <div className="space-y-2">
      {pairs.map((pair, index) => (
        <div key={`${pair.key}-${index}`} className="flex items-center gap-2">
          <Input
            value={pair.key}
            placeholder={(props.uiSchema?.['ui:placeholder'] as { key?: string } | undefined)?.key ?? 'Key'}
            onChange={(event) => {
              const next = [...pairs]
              next[index] = { ...pair, key: event.target.value }
              updatePairs(next)
            }}
          />
          <Input
            value={pair.value}
            placeholder={(props.uiSchema?.['ui:placeholder'] as { value?: string } | undefined)?.value ?? 'Value'}
            onChange={(event) => {
              const next = [...pairs]
              next[index] = { ...pair, value: event.target.value }
              updatePairs(next)
            }}
          />
          <Button type="button" variant="destructive" onClick={() => updatePairs(pairs.filter((_, currentIndex) => currentIndex !== index))}>
            删除
          </Button>
        </div>
      ))}
      <Button type="button" onClick={() => updatePairs([...pairs, { key: '', value: '' }])}>
        添加
      </Button>
    </div>
  )
}
