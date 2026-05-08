import type { ReactNode } from 'react'

import { cn } from '~/lib/utils'

export function Descriptions({ children, className }: { children: ReactNode; className?: string }) {
  return <dl className={cn('grid gap-2 text-sm', className)}>{children}</dl>
}

export function DescriptionsItem({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn('grid gap-1 sm:grid-cols-[96px_minmax(0,1fr)] sm:items-start', className)}>
      <dt className="font-medium text-muted-foreground">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  )
}
