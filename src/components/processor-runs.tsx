import { LoaderCircle, Play, RefreshCw, Square } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import {
  type ProcessorItemStage,
  type ProcessorRun,
  type ProcessorRunEvent,
  type ProcessorRunKind,
  type ProcessorRunStage,
  type ProcessorRunStatus,
  processorService,
} from '@/services/data.service'

const kindLabels: Record<ProcessorRunKind, string> = {
  automatic: '自动', scheduledFull: '定时触发', manualFull: '手动触发', items: '提交项目',
  rename: '移动文件', reprocess: '重新处理', dryRunCollected: '演练', dryRunStreamed: '流式演练',
}
const statusLabels: Record<ProcessorRunStatus, string> = {
  queued: '等待中', running: '运行中', succeeded: '成功', failed: '失败', cancelled: '已取消',
}
const runStageLabels: Record<ProcessorRunStage, string> = {
  initializing: '初始化', fetchingItems: '获取项目', scanningItems: '扫描可移动项目',
  processingItems: '处理项目', finalizing: '收尾',
}
const itemStageLabels: Record<ProcessorItemStage, string> = {
  filteringItem: '过滤项目', resolvingVariables: '解析变量', resolvingFiles: '解析文件',
  buildingTargets: '处理目标与内容', filteringContent: '处理目标与内容', checkingFiles: '检查文件',
  decidingReplacements: '判断替换', submittingDownload: '提交下载', movingFiles: '移动文件',
  replacingFiles: '替换文件', awaitingSettlement: '等待结算', persisting: '保存结果', notifying: '发送通知',
}


function statusVariant(status: ProcessorRunStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'failed') return 'destructive'
  if (status === 'succeeded') return 'default'
  if (status === 'cancelled') return 'outline'
  return 'secondary'
}

function formatTime(value?: string) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('zh-CN')
}

function sortRuns(runs: ProcessorRun[]) {
  return [...runs].sort((left, right) => right.id - left.id)
}

function applyRunEvent(runs: ProcessorRun[], event: ProcessorRunEvent, processorName: string): ProcessorRun[] {
  if (event.type === 'resync') {
    return sortRuns(event.runs.filter((run) => run.processorName === processorName))
  }
  if (event.type === 'created') {
    if (event.run.processorName !== processorName) return runs
    return sortRuns([...runs.filter((run) => run.id !== event.run.id), event.run])
  }
  if (event.type === 'finished') {
    return runs.filter((run) => run.id !== event.runId)
  }
  return runs.map((run) => {
    if (run.id !== event.runId) return run
    if (event.type === 'started') {
      return { ...run, status: 'running' as const, startedAt: event.startedAt }
    }
    if (event.type === 'runStageChanged') return { ...run, stage: event.stage }
    if (event.type === 'totalItemsChanged') {
      return { ...run, progress: { ...run.progress, totalItems: event.totalItems } }
    }
    if (event.type === 'itemStarted') {
      return {
        ...run,
        progress: {
          ...run.progress,
          activeItems: { ...run.progress.activeItems, [event.itemId]: event.item },
        },
      }
    }
    if (event.type === 'itemStageChanged') {
      const item = run.progress.activeItems[event.itemId]
      if (!item) return run
      return {
        ...run,
        progress: {
          ...run.progress,
          activeItems: {
            ...run.progress.activeItems,
            [event.itemId]: { ...item, stage: event.stage },
          },
        },
      }
    }
    const activeItems = { ...run.progress.activeItems }
    delete activeItems[event.itemId]
    return {
      ...run,
      progress: { ...run.progress, activeItems, completedItems: event.completedItems },
    }
  })
}

export function ProcessorRuns({ processorName, open }: { processorName?: string; open: boolean }) {
  const [runs, setRuns] = useState<ProcessorRun[]>([])
  const [loading, setLoading] = useState(false)
  const [action, setAction] = useState<'trigger' | 'rename' | number>()

  const loadRuns = useCallback(async () => {
    if (!processorName) return
    setLoading(true)
    try {
      setRuns(sortRuns(await processorService.runs(processorName)))
    } finally {
      setLoading(false)
    }
  }, [processorName])

  useEffect(() => {
    if (!open || !processorName) return
    void loadRuns()
    const stream = processorService.runStream((event) => {
      setRuns((current) => applyRunEvent(current, event, processorName))
    })
    return () => stream.close()
  }, [loadRuns, open, processorName])

  const runAction = async (type: 'trigger' | 'rename') => {
    if (!processorName) return
    setAction(type)
    try {
      if (type === 'trigger') await processorService.trigger(processorName)
      else await processorService.rename(processorName)
      await loadRuns()
    } finally {
      setAction(undefined)
    }
  }

  const cancel = async (id: number) => {
    setAction(id)
    try {
      await processorService.cancelRun(id)
    } finally {
      setAction(undefined)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-medium">{processorName}</h3>
          <p className="text-sm text-muted-foreground">实时查看运行阶段、进度和正在处理的项目。</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => void loadRuns()} disabled={loading}>
            <RefreshCw className={cn('mr-1.5 h-4 w-4', loading && 'animate-spin')} />刷新
          </Button>
          <Button size="sm" variant="outline" onClick={() => void runAction('rename')} disabled={action !== undefined}>
            {action === 'rename' && <LoaderCircle className="mr-1.5 h-4 w-4 animate-spin" />}移动文件
          </Button>
          <Button size="sm" onClick={() => void runAction('trigger')} disabled={action !== undefined}>
            {action === 'trigger' ? <LoaderCircle className="mr-1.5 h-4 w-4 animate-spin" /> : <Play className="mr-1.5 h-4 w-4" />}触发运行
          </Button>
        </div>
      </div>

      <div className="max-h-[60vh] overflow-auto rounded-md border">
        <Table>
          <TableHeader><TableRow>
            <TableHead className="w-20">ID</TableHead><TableHead>类型</TableHead><TableHead>状态</TableHead>
            <TableHead>阶段 / 进度</TableHead><TableHead>正在处理</TableHead><TableHead>开始时间</TableHead>
            <TableHead className="w-20 text-right">操作</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {runs.map((run) => {
              const activeItems = Object.entries(run.progress.activeItems)
              const total = run.progress.totalItems
              return <TableRow key={run.id}>
                <TableCell className="font-mono text-xs">#{run.id}</TableCell>
                <TableCell>{kindLabels[run.kind] ?? run.kind}</TableCell>
                <TableCell><Badge variant={statusVariant(run.status)}>{statusLabels[run.status] ?? run.status}</Badge></TableCell>
                <TableCell className="min-w-36 text-xs">
                  <div>{run.stage ? runStageLabels[run.stage] : '等待启动'}</div>
                  <div className="text-muted-foreground">{run.progress.completedItems} / {total ?? '—'}</div>
                </TableCell>
                <TableCell className="min-w-64">
                  <div className="space-y-1">
                    {activeItems.map(([id, item]) => <div key={id} className="flex items-center justify-between gap-3 text-xs">
                      <span className="max-w-40 truncate" title={item.title}>{item.title}</span>
                      <Badge variant="outline" className="whitespace-nowrap font-normal">{itemStageLabels[item.stage]}</Badge>
                    </div>)}
                    {activeItems.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{formatTime(run.startedAt ?? run.createdAt)}</TableCell>
                <TableCell className="text-right">
                  {(run.status === 'queued' || run.status === 'running') && <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => void cancel(run.id)} disabled={action !== undefined} aria-label={`取消运行 ${run.id}`}>
                    {action === run.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Square className="h-4 w-4" />}
                  </Button>}
                </TableCell>
              </TableRow>
            })}
            {!loading && runs.length === 0 && <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">暂无正在运行的任务</TableCell></TableRow>}
            {loading && runs.length === 0 && <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground"><LoaderCircle className="mr-2 inline h-4 w-4 animate-spin" />正在加载</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
