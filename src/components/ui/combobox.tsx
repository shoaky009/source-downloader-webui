import { Check, ChevronDown } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export interface ComboboxOption {
  label: string
  value: string
}

function matchesOption(option: ComboboxOption, query: string) {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) {
    return true
  }

  return option.label.toLowerCase().includes(normalizedQuery) || option.value.toLowerCase().includes(normalizedQuery)
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder,
  disabled,
  emptyText = '无匹配项',
}: {
  options: ComboboxOption[]
  value?: string
  onChange: (next?: string) => void
  placeholder: string
  disabled?: boolean
  emptyText?: string
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const selected = options.find((option) => option.value === value)
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState(selected?.label ?? '')
  const [highlightedIndex, setHighlightedIndex] = useState(-1)

  const filteredOptions = useMemo(() => options.filter((option) => matchesOption(option, inputValue)), [options, inputValue])

  useEffect(() => {
    if (!open) {
      setInputValue(selected?.label ?? '')
    }
  }, [open, selected?.label])

  useEffect(() => {
    if (!open) {
      return
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [open])

  useEffect(() => {
    if (!open) {
      return
    }

    if (filteredOptions.length === 0) {
      setHighlightedIndex(-1)
      return
    }

    setHighlightedIndex((current) => {
      if (current >= 0 && current < filteredOptions.length) {
        return current
      }

      const selectedIndex = filteredOptions.findIndex((option) => option.value === value)
      return selectedIndex >= 0 ? selectedIndex : 0
    })
  }, [filteredOptions, open, value])

  const closeDropdown = () => {
    setOpen(false)
    setHighlightedIndex(-1)
  }

  const selectOption = (next?: ComboboxOption) => {
    onChange(next?.value)
    setInputValue(next?.label ?? '')
    closeDropdown()
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          value={inputValue}
          placeholder={placeholder}
          disabled={disabled}
          className={cn('pr-9', !selected && !inputValue && 'text-muted-foreground')}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setInputValue(event.target.value)
            setOpen(true)
          }}
          onKeyDown={(event) => {
            if (!open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
              setOpen(true)
              return
            }

            if (event.key === 'ArrowDown') {
              event.preventDefault()
              setHighlightedIndex((current) => (filteredOptions.length === 0 ? -1 : Math.min(current + 1, filteredOptions.length - 1)))
              return
            }

            if (event.key === 'ArrowUp') {
              event.preventDefault()
              setHighlightedIndex((current) => (filteredOptions.length === 0 ? -1 : Math.max(current - 1, 0)))
              return
            }

            if (event.key === 'Enter' && open) {
              event.preventDefault()
              if (highlightedIndex >= 0) {
                selectOption(filteredOptions[highlightedIndex])
              }
              return
            }

            if (event.key === 'Escape') {
              event.preventDefault()
              closeDropdown()
            }
          }}
        />

        <button
          type="button"
          className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-muted-foreground"
          tabIndex={-1}
          disabled={disabled}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            setInputValue('')
            setOpen((current) => !current)
          }}
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      {open ? (
        <div className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <button
                key={option.value}
                type="button"
                className={cn(
                  'flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent',
                  (option.value === value || index === highlightedIndex) && 'bg-accent/50',
                )}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setHighlightedIndex(index)}
                onClick={() => selectOption(option)}
              >
                <span className="truncate">{option.label}</span>
                {option.value === value ? <Check className="h-4 w-4 text-primary" /> : null}
              </button>
            ))
          ) : (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">{emptyText}</div>
          )}
        </div>
      ) : null}
    </div>
  )
}
