import type { ReactNode } from 'react'

import { AppHeader } from '~/components/layouts/base-header'
import { AppSidebar } from '~/components/layouts/base-side'

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AppHeader />
      <div className="flex min-h-0 flex-1">
        <AppSidebar />
        <main className="min-w-0 flex-1 overflow-auto p-4">{children}</main>
      </div>
    </div>
  )
}
