import { AlertCircle, LoaderCircle, MoreHorizontal, Play, Plus, Search, Zap } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { ProcessorForm } from '~/components/processor-form'
import { ProcessorDryRun } from '~/components/processor-dry-run'
import { ShowSourceState } from '~/components/show-source-state'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { Switch } from '~/components/ui/switch'
import { cn } from '~/lib/utils'
import type { Processor } from '~/services/data.service'
import { processorService } from '~/services/data.service'

const relativeTimeFormatter = new Intl.RelativeTimeFormat('zh-CN', { numeric: 'auto' })

function toLocalDate(text?: string) {
  if (!text) {
    return '暂无'
  }

  const date = new Date(text)
  return Number.isNaN(date.getTime()) ? text : date.toLocaleString()
}

function toRelativeDate(text?: string) {
  if (!text) {
    return '暂无'
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

function toDateWithRelative(text?: string) {
  const absolute = toLocalDate(text)
  const relative = toRelativeDate(text)

  if (absolute === relative) {
    return absolute
  }

  return `${absolute} (${relative})`
}

export function ProcessorPage() {
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    document.title = '处理器 - SourceDownloader'
  }, [])
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

    return [
      { label: '总数', value: processors.length, tone: 'text-foreground' },
      { label: '启用中', value: enabledCount, tone: 'text-emerald-600 dark:text-emerald-400' },
      { label: '异常', value: errorCount, tone: 'text-red-600 dark:text-red-400' },
    ]
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
    <div className="space-y-8">
      <div className="space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={processNameFilter}
                onChange={(event) => setProcessNameFilter(event.target.value)}
                placeholder="搜索处理器名称"
                className="pl-9"
              />
            </div>
            <Button className="gap-2" onClick={() => setCreationFormOpen(true)}>
              <Plus className="h-4 w-4" />
              新建处理器
            </Button>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          {summary.map((item) => (
            <Card key={item.label}>
              <CardContent className="flex items-center justify-between p-5">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className={cn('text-3xl font-semibold', item.tone)}>{item.value}</p>
                </div>
                <div className="text-xs text-muted-foreground">
                  {item.label === '总数' ? `${filteredData.length} 个结果` : '实时统计'}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {isInitialLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="overflow-hidden">
              <CardContent className="space-y-4 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="h-5 w-32 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                  </div>
                  <div className="h-9 w-9 animate-pulse rounded-md bg-muted" />
                </div>
                <div className="space-y-2 rounded-lg border bg-muted/30 p-4">
                  <div className="h-4 w-full animate-pulse rounded bg-muted" />
                  <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                </div>
                <div className="flex gap-3">
                  <div className="h-9 flex-1 animate-pulse rounded-md bg-muted" />
                  <div className="h-9 flex-1 animate-pulse rounded-md bg-muted" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {!isInitialLoading && filteredData.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="rounded-full bg-muted p-3">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-medium">没有找到匹配的处理器</p>
              <p className="text-sm text-muted-foreground">
                {processNameFilter ? '换个关键词试试，或者清空筛选后查看全部处理器。' : '当前还没有处理器，先创建一个开始。'}
              </p>
            </div>
            <div className="flex gap-3">
              {processNameFilter ? (
                <Button variant="outline" onClick={() => setProcessNameFilter('')}>
                  清空搜索
                </Button>
              ) : null}
              <Button onClick={() => setCreationFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                新建处理器
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {!isInitialLoading && filteredData.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filteredData.map((processor) => {
            const hasError = Boolean(processor.errorMessage)

            return (
              <Card
                key={processor.name}
                className={cn(
                  'flex h-full flex-col overflow-hidden transition-colors',
                  hasError && 'border-red-200 bg-red-50/40 dark:border-red-900/60 dark:bg-red-950/20',
                )}
              >
                <CardHeader className="space-y-4 border-b pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-2">
                      <CardTitle className="truncate text-lg">{processor.name}</CardTitle>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">{processor.category || '未分类'}</Badge>
                        {hasError ? <Badge variant="destructive">异常</Badge> : null}
                      </div>
                    </div>

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="shrink-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="end" className="w-52 p-2">
                        <div className="grid gap-1">
                          <Button
                            variant="ghost"
                            className="justify-start"
                            onClick={() => {
                              setStateProcessor(processor.name)
                              setStateJsonViewer(true)
                            }}
                          >
                            查看 Pointer
                          </Button>
                          <Button variant="ghost" className="justify-start" onClick={() => void handleReload(processor.name)}>
                            重载
                          </Button>
                          <Button variant="ghost" className="justify-start" onClick={() => void handleRename(processor.name)}>
                            移动
                          </Button>
                          <Button variant="ghost" className="justify-start" onClick={() => console.log('WIP编辑', processor)}>
                            WIP编辑
                          </Button>
                          <Button variant="ghost" className="justify-start text-destructive" onClick={() => console.log('WIP删除', processor)}>
                            WIP删除
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="flex min-h-6 flex-wrap gap-1.5">
                    {processor.tags?.length > 0 ? (
                      processor.tags.map((tag, index) => (
                        <Badge key={`${processor.name}-${tag}-${index}`} variant="outline">
                          {tag}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">暂无标签</span>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex flex-1 flex-col gap-5 p-6">
                  <div className="rounded-lg border bg-muted/30 p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">运行时间</p>
                        <p className="text-xs text-muted-foreground">展示最近一次创建和执行信息</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setStateProcessor(processor.name)
                          setStateJsonViewer(true)
                        }}
                      >
                        Pointer
                      </Button>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-muted-foreground">创建时间</span>
                        <span className="text-right">{toDateWithRelative(processor.runtime?.createdAt)}</span>
                      </div>
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-muted-foreground">上次开始</span>
                        <span className="text-right">{toDateWithRelative(processor.runtime?.lastStartProcessTime)}</span>
                      </div>
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-muted-foreground">上次结束</span>
                        <span className="text-right">{toDateWithRelative(processor.runtime?.lastEndProcessTime)}</span>
                      </div>
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-muted-foreground">最近失败</span>
                        <span className="text-right">{toDateWithRelative(processor.runtime?.lastProcessFailedMessage)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-5">
                    <div className="flex items-center gap-3">
                      <span className={cn('h-2.5 w-2.5 rounded-full', processor.enabled ? 'bg-emerald-500' : 'bg-muted-foreground/40')} />
                      <div>
                        <p className="text-sm font-medium">{processor.enabled ? '已启用' : '已停用'}</p>
                        <p className="text-xs text-muted-foreground">可直接切换处理器运行状态</p>
                      </div>
                    </div>
                    <Switch checked={processor.enabled} onCheckedChange={(checked) => void handleToggleEnabled(processor, checked)} />
                  </div>

                  {hasError ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
                      <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                        <AlertCircle className="h-4 w-4" />
                        错误信息
                      </div>
                      <p className="text-sm break-words">{processor.errorMessage}</p>
                    </div>
                  ) : null}

                  <div className="mt-auto flex gap-3">
                    <Button
                      className="flex-1"
                      variant="outline"
                      onClick={() => {
                        setDryRunProcessor(processor.name)
                        setOpenDryRunForm(true)
                      }}
                    >
                      <Play className="h-4 w-4" />
                      演练
                    </Button>
                    <Button className="flex-1" onClick={() => void handleTrigger(processor.name)}>
                      <Zap className="h-4 w-4" />
                      触发
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : null}

      {loading && processors.length > 0 ? (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          正在刷新处理器列表...
        </div>
      ) : null}

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
