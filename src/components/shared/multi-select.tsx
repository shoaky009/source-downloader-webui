import { Check, ChevronDown } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Checkbox } from '~/components/ui/checkbox'
import { Input } from '~/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { cn } from '~/lib/utils'

export interface SelectOption {
  label: string
  value: string
}

const CLEAR_SELECT_VALUE = '__clear__'

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder,
  disabled,
  searchable = true,
}: {
  options: SelectOption[]
  value: string[]
  onChange: (next: string[]) => void
  placeholder: string
  disabled?: boolean
  searchable?: boolean
}) {
  const selectedOptions = options.filter((option) => value.includes(option.value))

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-auto min-h-10 w-full justify-between" disabled={disabled}>
          <div className="flex min-h-6 flex-1 flex-wrap items-center gap-1 text-left">
            {selectedOptions.length > 0 ? selectedOptions.map((option) => <Badge key={option.value} variant="secondary">{option.label}</Badge>) : <span className="text-sm text-muted-foreground">{placeholder}</span>}
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-2" align="start">
        <MultiSelectPanel options={options} value={value} onChange={onChange} searchable={searchable} />
      </PopoverContent>
    </Popover>
  )
}

function MultiSelectPanel({
  options,
  value,
  onChange,
  searchable,
}: {
  options: SelectOption[]
  value: string[]
  onChange: (next: string[]) => void
  searchable: boolean
}) {
  const [query, setQuery] = useState('')
  const filteredOptions = useMemo(() => {
    if (!query) {
      return options
    }
    return options.filter((option) => option.label.toLowerCase().includes(query.toLowerCase()))
  }, [options, query])

  return (
    <div className="space-y-2">
      {searchable ? <Input placeholder="搜索" onChange={(event) => setQuery(event.target.value)} /> : null}
      <div className="max-h-64 space-y-1 overflow-auto">
        {filteredOptions.map((option) => {
          const checked = value.includes(option.value)
          return (
            <label key={option.value} className={cn('flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 hover:bg-accent')}>
              <Checkbox
                checked={checked}
                onCheckedChange={(next) => {
                  if (next) {
                    onChange([...value, option.value])
                  } else {
                    onChange(value.filter((item) => item !== option.value))
                  }
                }}
              />
              <span className="flex-1 text-sm">{option.label}</span>
              {checked ? <Check className="h-4 w-4 text-primary" /> : null}
            </label>
          )
        })}
      </div>
    </div>
  )
}

export function SingleSelect({
  options,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  options: SelectOption[]
  value?: string
  onChange: (next?: string) => void
  placeholder: string
  disabled?: boolean
}) {
  const selected = options.find((option) => option.value === value)

  return (
    <Select
      value={value}
      onValueChange={(next) => onChange(next === CLEAR_SELECT_VALUE ? undefined : next)}
      disabled={disabled}
    >
      <SelectTrigger className={cn('w-full', !selected && 'text-muted-foreground')}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={CLEAR_SELECT_VALUE}>清空</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
