import { Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { ProcessorForm } from '~/components/processor-form'
import { ProcessorDryRun } from '~/components/processor-dry-run'
import { ShowSourceState } from '~/components/show-source-state'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { Dialog, DialogContent } from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Switch } from '~/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip'
import type { Processor } from '~/services/data.service'
import { processorService } from '~/services/data.service'

const operationDescription = '重载: 重新创建处理器实例\n演练: 模拟处理器执行,不执行下载等实际行为\n触发: 手动触发处理器执行\n移动: 执行可移动的Item'
const detailDescription = 'Pointer: 数据源的处理进度'

function toLocalDate(text: string) {
  return text ? new Date(text).toLocaleString() : ''
}

export function ProcessorPage() {
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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button size="icon" onClick={() => setCreationFormOpen(true)}>
          <Plus className="h-4 w-4" />
        </Button>
        <Input value={processNameFilter} onChange={(event) => setProcessNameFilter(event.target.value)} placeholder="处理器名称" className="max-w-xs" />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>运行时</TableHead>
                <TableHead>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>详情</TooltipTrigger>
                      <TooltipContent>{detailDescription}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
                <TableHead>类目</TableHead>
                <TableHead>标签</TableHead>
                <TableHead>开启</TableHead>
                <TableHead>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>操作</TooltipTrigger>
                      <TooltipContent className="max-w-xs whitespace-pre-line">{operationDescription}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
                <TableHead>消息</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((processor) => (
                <TableRow key={processor.name} className={processor.errorMessage ? 'text-red-600' : undefined}>
                  <TableCell>{processor.name}</TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      <p>创建时间: {toLocalDate(processor.runtime?.createdAt)}</p>
                      <p>上一次处理开始: {toLocalDate(processor.runtime?.lastStartProcessTime)}</p>
                      <p>上一次处理结束: {toLocalDate(processor.runtime?.lastEndProcessTime)}</p>
                      <p>上一次错误: {toLocalDate(processor.runtime?.lastProcessFailedMessage)}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => {
                      setStateProcessor(processor.name)
                      setStateJsonViewer(true)
                    }}>
                      Pointer
                    </Button>
                  </TableCell>
                  <TableCell>{processor.category}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {processor.tags?.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Switch checked={processor.enabled} onCheckedChange={() => undefined} />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => console.log('WIP编辑', processor)}>
                        WIP编辑
                      </Button>
                      <Button size="sm" variant="outline" onClick={async () => {
                        await processorService.reload(processor.name)
                        await fetchProcessors()
                      }}>
                        重载
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => {
                        setDryRunProcessor(processor.name)
                        setOpenDryRunForm(true)
                      }}>
                        演练
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => void processorService.trigger(processor.name)}>
                        触发
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => void processorService.rename(processor.name)}>
                        移动
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => console.log('WIP删除', processor)}>
                        WIP删除
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>{processor.errorMessage}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {loading ? <div className="p-4 text-sm text-muted-foreground">加载中...</div> : null}
        </CardContent>
      </Card>

      <ShowSourceState processorName={stateProcessor} open={stateJsonViewer} onOpenChange={setStateJsonViewer} />

      <Dialog open={openDryRunForm} onOpenChange={setOpenDryRunForm}>
        <DialogContent className="max-w-6xl">
          <ProcessorDryRun processorName={dryRunProcessor} />
        </DialogContent>
      </Dialog>

      <Dialog open={creationFormOpen} onOpenChange={setCreationFormOpen}>
        <DialogContent className="max-w-5xl">
          <ProcessorForm />
        </DialogContent>
      </Dialog>
    </div>
  )
}
