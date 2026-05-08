import type { ReactNode } from 'react'

import { AppHeader } from '~/components/layouts/base-header'
import { AppSidebar } from '~/components/layouts/base-side'

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
      <AppHeader />
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4">{children}</main>
      </div>
    </div>
  )
}
