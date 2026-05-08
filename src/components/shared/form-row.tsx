import type { ReactNode } from 'react'

import { Label } from '~/components/ui/label'
import { cn } from '~/lib/utils'

export function FormRow({
  label,
  required,
  children,
  className,
}: {
  label: string
  required?: boolean
  children?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('grid gap-2', className)}>
      <Label className="text-sm font-medium">
        {label}
        {required ? <span className="ml-1 text-destructive">*</span> : null}
      </Label>
      {children ?? <div className="h-10 rounded-md border border-dashed border-input bg-muted/30" />}
    </div>
  )
}
