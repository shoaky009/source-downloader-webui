import { AlertCircle, ChevronDown, ChevronRight, Layers, Plus, RefreshCw, Search } from 'lucide-react'
import { useEffect, useState } from 'react'

import { useDocumentTitle } from '~/hooks/use-document-title'
import { ComponentForm } from '~/components/component-form'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { Dialog, DialogContent } from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import type { Component } from '~/services/data.service'
import { componentService } from '~/services/data.service'

function StateDetailView({ data }: { data: unknown }) {
  if (data === null || data === undefined) {
    return <span className="text-muted-foreground">无数据</span>
  }

  if (typeof data !== 'object') {
    return <span className="font-mono text-sm">{String(data)}</span>
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return <span className="text-muted-foreground">空数组</span>
    }
    return (
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="rounded border bg-muted/30 p-2">
            <StateDetailView data={item} />
          </div>
        ))}
      </div>
    )
  }

  const entries = Object.entries(data as Record<string, unknown>)
  if (entries.length === 0) {
    return <span className="text-muted-foreground">空对象</span>
  }

  return (
    <div className="grid gap-2">
      {entries.map(([key, value]) => {
        const isComplexValue = typeof value === 'object' && value !== null
        return (
          <div key={key} className={isComplexValue ? 'space-y-1' : 'flex items-start gap-2'}>
            <span className="shrink-0 text-xs font-medium text-muted-foreground">{key}:</span>
            {isComplexValue ? (
              <div className="ml-3 border-l-2 border-muted pl-3">
                <StateDetailView data={value} />
              </div>
            ) : (
              <span className="break-all font-mono text-sm">
                {value === null ? (
                  <span className="text-muted-foreground">null</span>
                ) : value === undefined ? (
                  <span className="text-muted-foreground">undefined</span>
                ) : typeof value === 'boolean' ? (
                  <Badge variant={value ? 'default' : 'secondary'}>{String(value)}</Badge>
                ) : typeof value === 'number' ? (
                  <span className="text-blue-600 dark:text-blue-400">{value}</span>
                ) : (
                  String(value)
                )}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function ComponentPage() {
  useDocumentTitle('组件')
  const [loading, setLoading] = useState(false)
  const [components, setComponents] = useState<Component[]>([])
  const [creationFormOpen, setCreationFormOpen] = useState(false)
  const [expandedRows, setExpandedRows] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  const fetchComponents = async () => {
    setLoading(true)
    try {
      setComponents(await componentService.query({}))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchComponents()
  }, [])

  useEffect(() => {
    if (expandedRows.length === 0) {
      return
    }
    const eventSource = componentService.stateStream(expandedRows, (event) => {
      const [type, typeName, name] = event.lastEventId.split(':')
      setComponents((current) =>
        current.map((component) =>
          component.type === type && component.typeName === typeName && component.name === name
            ? { ...component, stateDetail: JSON.parse(event.data) }
            : component,
        ),
      )
    })
    return () => eventSource.close()
  }, [expandedRows])

  const filteredComponents = components.filter((component) => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      component.name.toLowerCase().includes(search) ||
      component.type.toLowerCase().includes(search) ||
      component.typeName.toLowerCase().includes(search)
    )
  })

  const groupedComponents = filteredComponents.reduce<Record<string, Component[]>>((acc, component) => {
    const key = component.type
    if (!acc[key]) acc[key] = []
    acc[key].push(component)
    return acc
  }, {})

  const stats = {
    total: components.length,
    types: Object.keys(groupedComponents).length,
    errors: components.filter((c) => c.errorMessage).length,
  }

  return (
    <div className="space-y-6">
      {/* 顶部工具栏 */}
      <div className="sticky -top-4 z-10 -mx-4 bg-background px-4 pb-4 pt-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索组件..."
              className="pl-9"
            />
          </div>
          <Button className="gap-2" onClick={() => setCreationFormOpen(true)}>
            <Plus className="h-4 w-4" />
            新建组件
          </Button>
          <div className="ml-auto flex items-center gap-4 text-sm text-muted-foreground">
            <span>共 {stats.total} 个组件</span>
            <span>{stats.types} 种类型</span>
            {stats.errors > 0 && <span className="text-destructive">{stats.errors} 个异常</span>}
          </div>
        </div>
      </div>

      {/* 加载状态 */}
      {loading && components.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center text-muted-foreground">
            <RefreshCw className="mx-auto mb-2 h-6 w-6 animate-spin" />
            <p>加载中...</p>
          </div>
        </div>
      )}

      {/* 组件列表 - 按类型分组 */}
      {Object.entries(groupedComponents).map(([type, typeComponents]) => (
        <div key={type} className="space-y-3">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-medium text-muted-foreground">{type}</h2>
            <Badge variant="secondary" className="ml-1">
              {typeComponents.length}
            </Badge>
          </div>

          <div className="grid gap-3 sm:grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3">
            {typeComponents.map((component) => {
              const rowKey = `${component.type}:${component.typeName}:${component.name}`
              const expanded = expandedRows.includes(rowKey)
              const hasError = Boolean(component.errorMessage)
              const hasStateDetail = component.stateDetail != null

              return (
                <Card
                  key={rowKey}
                  className={`transition-colors ${hasError ? 'border-destructive/50 bg-destructive/5' : ''}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* 状态指示器 */}
                      <div
                        className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                          hasError ? 'bg-destructive' : 'bg-emerald-500'
                        }`}
                      />

                      {/* 主要内容 */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="truncate font-medium">{component.name}</h3>
                            <p className="mt-0.5 text-sm text-muted-foreground">{component.typeName}</p>
                          </div>

                          {/* 操作按钮 */}
                          <div className="flex shrink-0 items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2"
                              onClick={async () => {
                                await componentService.reload(component)
                                await fetchComponents()
                              }}
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>

                        {/* 引用标签 */}
                        {component.refs && component.refs.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {component.refs.map((ref) => (
                              <Badge key={ref} variant="secondary" className="text-xs">
                                {ref}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* 错误信息 */}
                        {hasError && (
                          <div className="mt-2 flex items-start gap-1.5 rounded bg-destructive/10 p-2 text-xs text-destructive">
                            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            <span className="break-all">{component.errorMessage}</span>
                          </div>
                        )}

                        {/* 展开状态详情按钮 */}
                        {hasStateDetail && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="mt-2 h-7 w-full justify-start gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
                            onClick={() =>
                              setExpandedRows((current) =>
                                expanded ? current.filter((item) => item !== rowKey) : [...current, rowKey],
                              )
                            }
                          >
                            {expanded ? (
                              <ChevronDown className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5" />
                            )}
                            {expanded ? '收起状态信息' : '查看状态信息'}
                          </Button>
                        )}

                        {/* 展开的状态详情 */}
                        {expanded && hasStateDetail && (
                          <div className="mt-2 max-h-80 overflow-auto rounded-md border bg-muted/30 p-3">
                            <StateDetailView data={component.stateDetail} />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      ))}

      {/* 空状态 */}
      {!loading && filteredComponents.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Layers className="mb-3 h-12 w-12 text-muted-foreground/50" />
          <p className="text-muted-foreground">
            {searchTerm ? '没有找到匹配的组件' : '暂无组件'}
          </p>
        </div>
      )}

      <Dialog open={creationFormOpen} onOpenChange={setCreationFormOpen}>
        <DialogContent className="max-w-5xl">
          <ComponentForm />
        </DialogContent>
      </Dialog>
    </div>
  )
}
