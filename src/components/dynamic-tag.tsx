import { X } from 'lucide-react'
import { useRef, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function DynamicTag({ value = [], onChange }: { value?: string[]; onChange: (next: string[]) => void }) {
  const [inputVisible, setInputVisible] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const showInput = () => {
    setInputVisible(true)
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  const handleConfirm = () => {
    if (inputValue.trim()) {
      onChange([...value, inputValue.trim()])
    }
    setInputVisible(false)
    setInputValue('')
  }

  return (
    <div className="flex flex-wrap gap-2">
      {value.map((tag) => (
        <Badge key={tag} variant="secondary" className="gap-1 pr-1">
          {tag}
          <button type="button" onClick={() => onChange(value.filter((item) => item !== tag))}>
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      {inputVisible ? (
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onBlur={handleConfirm}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              handleConfirm()
            }
          }}
          className="h-8 w-32"
        />
      ) : (
        <Button type="button" variant="outline" size="sm" onClick={showInput}>
          +
        </Button>
      )}
    </div>
  )
}
