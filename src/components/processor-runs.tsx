import { LoaderCircle, Play, RefreshCw, Square } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import {
  type ProcessorRun,
  type ProcessorRunKind,
  type ProcessorRunStatus,
  processorService,
} from '@/services/data.service'

const kindLabels: Record<ProcessorRunKind, string> = {
  automatic: '自动',
  scheduledFull: '定时触发',
  manualFull: '手动触发',
  items: '提交项目',
  rename: '移动文件',
  reprocess: '重新处理',
  dryRunCollected: '演练',
  dryRunStreamed: '流式演练',
}

const statusLabels: Record<ProcessorRunStatus, string> = {
  queued: '等待中',
  running: '运行中',
  succeeded: '成功',
  failed: '失败',
  cancelled: '已取消',
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


export function ProcessorRuns({ processorName, open }: { processorName?: string; open: boolean }) {
  const [runs, setRuns] = useState<ProcessorRun[]>([])
  const [loading, setLoading] = useState(false)
  const [action, setAction] = useState<'trigger' | 'rename' | number>()

  const loadRuns = useCallback(async () => {
    if (!processorName) return
    setLoading(true)
    try {
      const response = await processorService.runs(processorName)
      setRuns(response.sort((left, right) => right.id - left.id))
    } finally {
      setLoading(false)
    }
  }, [processorName])

  useEffect(() => {
    if (!open || !processorName) return
    void loadRuns()
    const interval = window.setInterval(() => void loadRuns(), 3000)
    return () => window.clearInterval(interval)
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
      await loadRuns()
    } finally {
      setAction(undefined)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-medium">{processorName}</h3>
          <p className="text-sm text-muted-foreground">查看运行记录，并触发或取消处理任务。</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => void loadRuns()} disabled={loading}>
            <RefreshCw className={cn('mr-1.5 h-4 w-4', loading && 'animate-spin')} />
            刷新
          </Button>
          <Button size="sm" variant="outline" onClick={() => void runAction('rename')} disabled={action !== undefined}>
            {action === 'rename' && <LoaderCircle className="mr-1.5 h-4 w-4 animate-spin" />}
            移动文件
          </Button>
          <Button size="sm" onClick={() => void runAction('trigger')} disabled={action !== undefined}>
            {action === 'trigger' ? <LoaderCircle className="mr-1.5 h-4 w-4 animate-spin" /> : <Play className="mr-1.5 h-4 w-4" />}
            触发运行
          </Button>
        </div>
      </div>

      <div className="max-h-[60vh] overflow-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">ID</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>开始时间</TableHead>
              <TableHead>结束时间</TableHead>
              <TableHead>详情</TableHead>
              <TableHead className="w-20 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {runs.map((run) => (
              <TableRow key={run.id}>
                <TableCell className="font-mono text-xs">#{run.id}</TableCell>
                <TableCell>{kindLabels[run.kind] ?? run.kind}</TableCell>
                <TableCell><Badge variant={statusVariant(run.status)}>{statusLabels[run.status] ?? run.status}</Badge></TableCell>
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{formatTime(run.startedAt ?? run.createdAt)}</TableCell>
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{formatTime(run.finishedAt)}</TableCell>
                <TableCell className="max-w-64 truncate text-xs text-destructive" title={run.failure}>{run.failure ?? '—'}</TableCell>
                <TableCell className="text-right">
                  {(run.status === 'queued' || run.status === 'running') && (
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => void cancel(run.id)} disabled={action !== undefined} aria-label={`取消运行 ${run.id}`}>
                      {action === run.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Square className="h-4 w-4" />}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {!loading && runs.length === 0 && (
              <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">暂无运行记录</TableCell></TableRow>
            )}
            {loading && runs.length === 0 && (
              <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground"><LoaderCircle className="mr-2 inline h-4 w-4 animate-spin" />正在加载</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
