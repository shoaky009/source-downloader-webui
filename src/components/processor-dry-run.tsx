import { useRef, useState } from 'react'

import { FileContentDetail } from '@/components/file-content-detail'
import { ItemContentDetail } from '@/components/item-content-detail'
import { JsonEditor } from '@/components/shared/json-editor'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  type DryRunError,
  type DryRunEvent,
  type DryRunSummary,
  type FileContent,
  fileStatusGrouping,
  itemStatusOf,
  processorService,
} from '@/services/data.service'

function statusVariant(type: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (type === 'danger') return 'destructive'
  if (type === 'warning') return 'outline'
  if (type === 'info') return 'secondary'
  return 'default'
}

async function* makeStreamLineIterator(readerStream: ReadableStream<Uint8Array>, terminateSignal: () => boolean) {
  const reader = readerStream.getReader()
  let { value: chunk, done: readerDone } = await reader.read()
  const utf8Decoder = new TextDecoder('utf-8')
  let partialLine = chunk ? utf8Decoder.decode(chunk, { stream: true }) : ''

  const re = /\r\n|\n|\r/gm
  let startIndex = 0
  for (;;) {
    if (terminateSignal()) {
      await reader.cancel('terminate signal received')
      break
    }

    const result = re.exec(partialLine)
    if (!result) {
      if (readerDone) {
        break
      }
      const remainder = partialLine.substring(startIndex)
      ;({ value: chunk, done: readerDone } = await reader.read())
      partialLine = remainder + (chunk ? utf8Decoder.decode(chunk, { stream: true }) : '')
      startIndex = re.lastIndex = 0
      continue
    }
    yield partialLine.substring(startIndex, result.index)
    startIndex = re.lastIndex
  }
  if (startIndex < partialLine.length) {
    yield partialLine.substring(startIndex)
  }
}

type DryRunRow = Extract<DryRunEvent, { type: 'item' | 'itemError' }>

export function ProcessorDryRun({ processorName }: { processorName?: string }) {
  const [dryRunFormData, setDryRunFormData] = useState({ filterProcessed: true, pointer: '{}' })
  const [streamable, setStreamable] = useState(true)
  const [loading, setLoading] = useState(false)
  const [dryRunOpened, setDryRunOpened] = useState(false)
  const dryRunOpenedRef = useRef(false)
  const [dryRunRows, setDryRunRows] = useState<DryRunRow[]>([])
  const [runError, setRunError] = useState<DryRunError>()
  const [responseError, setResponseError] = useState<string>()
  const [summary, setSummary] = useState<DryRunSummary>()
  const [fileContents, setFileContents] = useState<FileContent[]>([])
  const [showFileContentDialog, setShowFileContentDialog] = useState(false)
  const applyDryRunEvent = (event: DryRunEvent) => {
    switch (event.type) {
      case 'item':
      case 'itemError':
        setDryRunRows((current) => [...current, event])
        break
      case 'complete':
        setSummary(event.summary)
        break
      case 'runError':
        setRunError(event.error)
        break
    }
  }


  const handleDryRunFormSubmit = async () => {
    if (!processorName) {
      return
    }
    dryRunOpenedRef.current = true
    setDryRunOpened(true)
    setDryRunRows([])
    setRunError(undefined)
    setResponseError(undefined)
    setSummary(undefined)
    setLoading(true)

    try {
      const payload = {
        filterProcessed: dryRunFormData.filterProcessed,
        pointer: dryRunFormData.pointer.trim() ? JSON.parse(dryRunFormData.pointer) : null,
      }

      if (!streamable) {
        const events = await processorService.dryRun(processorName, payload)
        events.forEach(applyDryRunEvent)
        if (!events.some((event) => event.type === 'complete' || event.type === 'runError')) {
          setResponseError('响应缺少终结事件')
        }
        return
      }

      const response = await processorService.dryRunStream(processorName, payload)
      const body = response.body
      if (!body) {
        throw new Error('浏览器未提供响应流')
      }

      let terminalReceived = false
      for await (const line of makeStreamLineIterator(body, () => !dryRunOpenedRef.current)) {
        if (!line.trim()) {
          continue
        }
        const event = JSON.parse(line) as DryRunEvent
        applyDryRunEvent(event)
        if (event.type === 'complete' || event.type === 'runError') {
          terminalReceived = true
        }
      }
      if (dryRunOpenedRef.current && !terminalReceived) {
        setResponseError('流式响应在终结事件前中断')
      }
    } catch (error) {
      if (dryRunOpenedRef.current) {
        setResponseError(error instanceof Error ? error.message : String(error))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        <div className="flex items-center justify-between rounded-md border p-3">
          <span className="text-sm">过滤已处理的Item</span>
          <Switch checked={dryRunFormData.filterProcessed} onCheckedChange={(checked) => setDryRunFormData((current) => ({ ...current, filterProcessed: checked }))} />
        </div>
        <div className="grid gap-2">
          <div className="text-sm font-medium">Pointer</div>
          <JsonEditor value={dryRunFormData.pointer} onChange={(value) => setDryRunFormData((current) => ({ ...current, pointer: value }))} />
        </div>
        <div className="flex items-center justify-between rounded-md border p-3">
          <span className="text-sm">流式响应</span>
          <Switch checked={streamable} onCheckedChange={setStreamable} />
        </div>
        <Button onClick={handleDryRunFormSubmit}>确认</Button>
      </div>

      <Dialog open={dryRunOpened} onOpenChange={(open) => {
        dryRunOpenedRef.current = open
        setDryRunOpened(open)
        if (!open) {
          setDryRunRows([])
          setRunError(undefined)
          setResponseError(undefined)
          setSummary(undefined)
        }
      }}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>Dry Run</DialogTitle>
            <DialogDescription>展示当前处理器的演练执行结果和产出文件。</DialogDescription>
          </DialogHeader>
          {runError ? (
            <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
              <div className="font-medium">Dry-run 执行失败</div>
              <div>{runError.message}</div>
            </div>
          ) : null}
          {responseError ? (
            <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
              <div className="font-medium">响应异常</div>
              <div>{responseError}</div>
            </div>
          ) : null}
          <div className="max-h-[70vh] overflow-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hash</TableHead>
                  <TableHead>条目</TableHead>
                  <TableHead>文件 / 错误</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dryRunRows.map((row) => {
                  if (row.type === 'itemError') {
                    return (
                      <TableRow key={`${row.itemHash}-error`}>
                        <TableCell>
                          <div className="flex flex-col gap-2">
                            <Badge variant="destructive">状态:失败</Badge>
                            <Badge variant={row.action === 'continue' ? 'outline' : 'destructive'}>
                              {row.action === 'continue' ? '错误后继续' : '错误后停止'}
                            </Badge>
                            <Badge variant="secondary">Hash:{row.itemHash}</Badge>
                          </div>
                        </TableCell>
                        <TableCell className="min-w-[360px]">
                          <ItemContentDetail content={{
                            sourceItem: row.item,
                            itemVariables: {},
                            fileContents: [],
                          }} />
                        </TableCell>
                        <TableCell>
                          <div className="flex max-w-md flex-col gap-2 text-sm">
                            <span className="font-medium text-destructive">{row.error.message}</span>
                            <span className="text-muted-foreground">
                              {row.error.kind === 'retryable' ? '可重试错误' : '不可重试错误'}
                              {row.error.skippable ? ' · 可跳过' : ''}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  }

                  const content = row.content
                  const status = itemStatusOf(content.status)
                  return (
                    <TableRow key={`${content.itemHash}-${content.id ?? 'dry-run'}`}>
                      <TableCell>
                        <div className="flex flex-col gap-2">
                          <Badge variant={statusVariant(status.type)}>状态:{status.label}</Badge>
                          <Badge variant="secondary">Hash:{content.itemHash}</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[360px]">
                        <ItemContentDetail content={content.itemContent} />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2">
                          <Button variant="outline" size="sm" onClick={() => {
                            setFileContents(content.itemContent.fileContents)
                            setShowFileContentDialog(true)
                          }}>
                            查看{content.itemContent.fileContents.length}个文件
                          </Button>
                          {Array.from(fileStatusGrouping(content.itemContent.fileContents)).map(([groupStatus, count]) => (
                            <Badge key={groupStatus.value} variant={statusVariant(groupStatus.type)}>
                              {groupStatus.label}:{count}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            {loading ? <div className="p-4 text-sm text-muted-foreground">加载中...</div> : null}
            {summary ? (
              <div className="flex flex-wrap gap-2 border-t p-3 text-sm">
                <Badge variant="secondary">成功:{summary.succeeded}</Badge>
                <Badge variant={summary.failed > 0 ? 'destructive' : 'secondary'}>
                  失败:{summary.failed}
                </Badge>
                {summary.stopped ? <Badge variant="destructive">已因错误停止</Badge> : null}
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showFileContentDialog} onOpenChange={setShowFileContentDialog}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>文件内容</DialogTitle>
            <DialogDescription>查看当前演练结果关联的文件内容明细。</DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] space-y-4 overflow-auto">
            {fileContents.map((file) => (
              <div key={file.fileDownloadPath} className="rounded-md border p-4">
                <FileContentDetail file={file} />
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
