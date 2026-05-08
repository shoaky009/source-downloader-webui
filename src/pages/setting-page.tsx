import { Package, Server } from 'lucide-react'
import { useEffect, useState } from 'react'

import { useDocumentTitle } from '@/hooks/use-document-title'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { actuatorService } from '@/services/data.service'

interface BuildInfo {
  version?: string
  buildTime?: string
  commitHash?: string
  [key: string]: unknown
}

function JsonDisplay({ data }: { data: unknown }) {
  if (data === null || data === undefined) {
    return <span className="text-muted-foreground">无数据</span>
  }

  if (typeof data !== 'object') {
    return <span className="font-mono text-sm">{String(data)}</span>
  }

  const entries = Object.entries(data as Record<string, unknown>)
  if (entries.length === 0) {
    return <span className="text-muted-foreground">空</span>
  }

  return (
    <div className="space-y-0">
      {entries.map(([key, value]) => {
        const isComplexValue = typeof value === 'object' && value !== null

        if (isComplexValue) {
          return (
            <div key={key} className="border-b py-3 last:border-0">
              <span className="text-sm font-medium text-muted-foreground">{key}</span>
              <div className="ml-4 mt-2 rounded-md border bg-muted/30 p-3">
                <JsonDisplay data={value} />
              </div>
            </div>
          )
        }

        return (
          <div key={key} className="flex items-center justify-between border-b py-3 last:border-0">
            <span className="text-sm text-muted-foreground">{key}</span>
            <span className="break-all text-right font-mono text-sm">
              {value === null ? (
                <span className="text-muted-foreground">null</span>
              ) : value === undefined ? (
                <span className="text-muted-foreground">undefined</span>
              ) : typeof value === 'boolean' ? (
                <span className={value ? 'text-emerald-600' : 'text-muted-foreground'}>{String(value)}</span>
              ) : typeof value === 'number' ? (
                <span className="text-blue-600 dark:text-blue-400">{value}</span>
              ) : (
                String(value)
              )}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export function SettingPage() {
  useDocumentTitle('设置')
  const [backendAppInfo, setBackendAppInfo] = useState<unknown>()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    actuatorService
      .info()
      .then((response) => setBackendAppInfo(response.data))
      .finally(() => setLoading(false))
  }, [])

  const uiInfo = __APP_INFO__ as BuildInfo | undefined
  const backendInfo = backendAppInfo as BuildInfo | undefined

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* UI 构建信息 */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                <Package className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">前端信息</CardTitle>
                <CardDescription className="text-xs">UI 构建版本和配置</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {uiInfo ? (
              <JsonDisplay data={uiInfo} />
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">无构建信息</p>
            )}
          </CardContent>
        </Card>

        {/* 后端构建信息 */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500/10">
                <Server className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <CardTitle className="text-base">后端信息</CardTitle>
                <CardDescription className="text-xs">API 服务版本和状态</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="py-4 text-center text-sm text-muted-foreground">加载中...</p>
            ) : backendInfo ? (
              <JsonDisplay data={backendInfo} />
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">无法获取后端信息</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
