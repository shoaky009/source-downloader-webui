import { LoaderCircle, Moon, RefreshCw, Sun } from 'lucide-react'
import { useState } from 'react'

import { Button } from '~/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip'
import { useDarkMode } from '~/hooks'
import { applicationService } from '~/services/data.service'

export function AppHeader() {
  const { isDark, toggleDark } = useDarkMode()
  const [loading, setLoading] = useState(false)

  const handleReload = async () => {
    setLoading(true)
    try {
      await applicationService.reload()
    } finally {
      setLoading(false)
    }
  }

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur">
      <div className="text-lg font-semibold">SourceDownloader</div>
      <TooltipProvider>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={toggleDark}>
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>黑夜模式</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleReload} disabled={loading}>
                {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>重载应用</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </header>
  )
}
