import {
  AlertCircle,
  CheckCircle2,
  Clock,
  LoaderCircle,
  MoreHorizontal,
  Play,
  Plus,
  Power,
  Search,
  Zap,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { useDocumentTitle } from '~/hooks/use-document-title'
import { ProcessorForm } from '~/components/processor-form'
import { ProcessorDryRun } from '~/components/processor-dry-run'
import { ShowSourceState } from '~/components/show-source-state'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { Switch } from '~/components/ui/switch'
import { cn } from '~/lib/utils'
import type { Processor } from '~/services/data.service'
import { processorService } from '~/services/data.service'

const relativeTimeFormatter = new Intl.RelativeTimeFormat('zh-CN', { numeric: 'auto' })

function toRelativeDate(text?: string) {
  if (!text) {
    return null
  }

  const date = new Date(text)
  if (Number.isNaN(date.getTime())) {
    return text
  }

  const diff = date.getTime() - Date.now()
  const ranges: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 1000 * 60 * 60 * 24 * 365],
    ['month', 1000 * 60 * 60 * 24 * 30],
    ['day', 1000 * 60 * 60 * 24],
    ['hour', 1000 * 60 * 60],
    ['minute', 1000 * 60],
  ]

  for (const [unit, value] of ranges) {
    if (Math.abs(diff) >= value) {
      return relativeTimeFormatter.format(Math.round(diff / value), unit)
    }
  }

  return relativeTimeFormatter.format(Math.round(diff / 1000), 'second')
}

export function ProcessorPage() {
  useDocumentTitle('处理器')
  const [loading, setLoading] = useState(false)
  const [processors, setProcessors] = useState<Processor[]>([])
  const [processNameFilter, setProcessNameFilter] = useState('')
  const [creationFormOpen, setCreationFormOpen] = useState(false)
  const [stateJsonViewer, setStateJsonViewer] = useState(false)
  const [stateProcessor, setStateProcessor] = useState<string>()
  const [openDryRunForm, setOpenDryRunForm] = useState(false)
  const [dryRunProcessor, setDryRunProcessor] = useState<string>()

  const fetchProcessors = async () => {
    setLoading(true)
    try {
      const response = await processorService.query()
      setProcessors(response)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchProcessors()
  }, [])

  const filteredData = useMemo(() => {
    if (!processNameFilter) {
      return processors
    }

    return processors.filter((item) => item.name.toLowerCase().includes(processNameFilter.toLowerCase()))
  }, [processors, processNameFilter])

  const summary = useMemo(() => {
    const enabledCount = processors.filter((item) => item.enabled).length
    const errorCount = processors.filter((item) => Boolean(item.errorMessage)).length

    return { total: processors.length, enabled: enabledCount, error: errorCount }
  }, [processors])

  const isInitialLoading = loading && processors.length === 0

  const handleToggleEnabled = async (processor: Processor, nextEnabled: boolean) => {
    if (nextEnabled) {
      await processorService.enable(processor.name)
    } else {
      await processorService.disable(processor.name)
    }

    await fetchProcessors()
  }

  const handleReload = async (name: string) => {
    await processorService.reload(name)
    await fetchProcessors()
  }

  const handleTrigger = async (name: string) => {
    await processorService.trigger(name)
    await fetchProcessors()
  }

  const handleRename = async (name: string) => {
    await processorService.rename(name)
    await fetchProcessors()
  }

  return (
    <div className="space-y-6">
      {/* 顶部工具栏 */}
      <div className="sticky -top-4 z-10 -mx-4 bg-background px-4 pb-4 pt-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={processNameFilter}
                onChange={(event) => setProcessNameFilter(event.target.value)}
                placeholder="搜索处理器..."
                className="h-9 pl-9"
              />
            </div>
            <Button size="sm" className="gap-1.5" onClick={() => setCreationFormOpen(true)}>
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">新建</span>
            </Button>
          </div>

          {/* 统计信息 */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">总计</span>
              <span className="font-medium">{summary.total}</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-muted-foreground">启用</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">{summary.enabled}</span>
            </div>
            {summary.error > 0 && (
              <>
                <div className="h-4 w-px bg-border" />
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                  <span className="text-muted-foreground">异常</span>
                  <span className="font-medium text-red-600 dark:text-red-400">{summary.error}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 加载状态 */}
      {isInitialLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 animate-pulse rounded-lg bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-48 animate-pulse rounded bg-muted" />
                </div>
                <div className="h-8 w-20 animate-pulse rounded-md bg-muted" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 空状态 */}
      {!isInitialLoading && filteredData.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            <div className="rounded-full bg-muted p-3">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">没有找到处理器</p>
              <p className="text-sm text-muted-foreground">
                {processNameFilter ? '换个关键词试试' : '创建第一个处理器开始使用'}
              </p>
            </div>
            <div className="flex gap-2">
              {processNameFilter && (
                <Button variant="outline" size="sm" onClick={() => setProcessNameFilter('')}>
                  清空搜索
                </Button>
              )}
              <Button size="sm" onClick={() => setCreationFormOpen(true)}>
                <Plus className="mr-1.5 h-4 w-4" />
                新建处理器
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 处理器列表 - 响应式多列 */}
      {!isInitialLoading && filteredData.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3">
          {filteredData.map((processor) => {
            const hasError = Boolean(processor.errorMessage)
            const runtime = processor.runtime
            const times = [
              { label: '创建', value: runtime?.createdAt },
              { label: '开始', value: runtime?.lastStartProcessTime },
              { label: '结束', value: runtime?.lastEndProcessTime },
            ].filter((t) => t.value)

            return (
              <div
                key={processor.name}
                className={cn(
                  'group rounded-lg border bg-card transition-all hover:shadow-sm',
                  hasError && 'border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/20',
                )}
              >
                <div className="flex items-start gap-4 p-4">
                  {/* 状态指示器 */}
                  <div
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                      hasError
                        ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                        : processor.enabled
                          ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {hasError ? (
                      <AlertCircle className="h-5 w-5" />
                    ) : processor.enabled ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Power className="h-5 w-5" />
                    )}
                  </div>

                  {/* 主要信息 */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate font-medium leading-tight">{processor.name}</h3>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                          {processor.category && (
                            <Badge variant="secondary" className="h-5 text-xs font-normal">
                              {processor.category}
                            </Badge>
                          )}
                          {processor.tags?.length > 0 && (
                            <span className="hidden text-xs sm:inline">
                              {processor.tags.slice(0, 2).join(', ')}
                              {processor.tags.length > 2 && ` +${processor.tags.length - 2}`}
                            </span>
                          )}
                        </div>
                        {/* 时间信息 */}
                        {times.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            {times.map((t) => (
                              <span key={t.label} className="flex items-center gap-1">
                                <span className="text-muted-foreground/70">{t.label}</span>
                                <span>{toRelativeDate(t.value)}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* 操作区域 */}
                      <div className="flex shrink-0 items-center gap-2">
                        <Switch
                          checked={processor.enabled}
                          onCheckedChange={(checked) => void handleToggleEnabled(processor, checked)}
                          className="data-[state=checked]:bg-emerald-500"
                        />
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent align="end" className="w-44 p-1.5">
                            <div className="grid gap-0.5">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="justify-start"
                                onClick={() => {
                                  setStateProcessor(processor.name)
                                  setStateJsonViewer(true)
                                }}
                              >
                                查看 Pointer
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="justify-start"
                                onClick={() => void handleReload(processor.name)}
                              >
                                重载
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="justify-start"
                                onClick={() => void handleRename(processor.name)}
                              >
                                移动
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="justify-start"
                                onClick={() => console.log('WIP编辑', processor)}
                              >
                                编辑
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="justify-start text-destructive hover:text-destructive"
                                onClick={() => console.log('WIP删除', processor)}
                              >
                                删除
                              </Button>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    {/* 错误信息 */}
                    {hasError && (
                      <div className="mt-3 rounded-md bg-red-100/80 px-3 py-2 text-sm text-red-700 dark:bg-red-900/40 dark:text-red-300">
                        <span className="line-clamp-2">{processor.errorMessage}</span>
                      </div>
                    )}

                    {/* 快捷操作 */}
                    <div className="mt-3 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 gap-1 px-2 text-xs"
                        onClick={() => {
                          setDryRunProcessor(processor.name)
                          setOpenDryRunForm(true)
                        }}
                      >
                        <Play className="h-3 w-3" />
                        演练
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 gap-1 px-2 text-xs"
                        onClick={() => void handleTrigger(processor.name)}
                      >
                        <Zap className="h-3 w-3" />
                        触发
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 刷新状态 */}
      {loading && processors.length > 0 && (
        <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          正在刷新...
        </div>
      )}

      <ShowSourceState processorName={stateProcessor} open={stateJsonViewer} onOpenChange={setStateJsonViewer} />

      <Dialog open={openDryRunForm} onOpenChange={setOpenDryRunForm}>
        <DialogContent className="max-w-6xl">
          <DialogHeader className="sr-only">
            <DialogTitle>处理器演练</DialogTitle>
            <DialogDescription>查看并执行当前处理器的演练结果。</DialogDescription>
          </DialogHeader>
          <ProcessorDryRun processorName={dryRunProcessor} />
        </DialogContent>
      </Dialog>

      <Dialog open={creationFormOpen} onOpenChange={setCreationFormOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader className="sr-only">
            <DialogTitle>新建处理器</DialogTitle>
            <DialogDescription>填写处理器配置并创建新的处理器。</DialogDescription>
          </DialogHeader>
          <ProcessorForm />
        </DialogContent>
      </Dialog>
    </div>
  )
}
