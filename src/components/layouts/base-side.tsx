import { Blocks, FileText, Settings, Workflow } from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { cn } from '~/lib/utils'

const navItems = [
  { to: '/processor', label: '处理器', icon: Workflow },
  { to: '/component', label: '组件', icon: Blocks },
  { to: '/processing-content', label: '记录', icon: FileText },
  { to: '/setting', label: '设置', icon: Settings },
]

export function AppSidebar() {
  return (
    <aside className="hidden w-56 shrink-0 border-r bg-muted/20 md:block">
      <nav className="flex flex-col gap-1 p-2">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn('flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground', isActive && 'bg-accent text-accent-foreground')
              }
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}
