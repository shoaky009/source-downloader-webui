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
  type FileContent,
  fileStatusGrouping,
  itemStatusOf,
  type ProcessingContent,
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

export function ProcessorDryRun({ processorName }: { processorName?: string }) {
  const [dryRunFormData, setDryRunFormData] = useState({ filterProcessed: true, pointer: '{}' })
  const [streamable, setStreamable] = useState(true)
  const [loading, setLoading] = useState(false)
  const [dryRunOpened, setDryRunOpened] = useState(false)
  const [dryRunResult, setDryRunResult] = useState<ProcessingContent[]>([])
  const [fileContents, setFileContents] = useState<FileContent[]>([])
  const [showFileContentDialog, setShowFileContentDialog] = useState(false)

  const dryRunOpenedRef = useRef(false)

  const handleDryRunFormSubmit = async () => {
    if (!processorName) {
      return
    }
    dryRunOpenedRef.current = true
    setDryRunOpened(true)
    setDryRunResult([])
    setLoading(true)

    const payload = {
      filterProcessed: dryRunFormData.filterProcessed,
      pointer: dryRunFormData.pointer.trim() ? JSON.parse(dryRunFormData.pointer) : null,
    }

    if (!streamable) {
      const response = await processorService.dryRun(processorName, payload).finally(() => setLoading(false))
      setDryRunResult(response.data)
      return
    }

    const response = await processorService.dryRunStream(processorName, payload)
    const body = response.body
    if (!body) {
      setLoading(false)
      return
    }

    let firstLineFlag = true
    for await (const line of makeStreamLineIterator(body, () => !dryRunOpenedRef.current)) {
      if (firstLineFlag) {
        setLoading(false)
        firstLineFlag = false
      }
      try {
        const content = JSON.parse(line) as ProcessingContent
        setDryRunResult((current) => [...current, content])
      } catch {
        console.warn('Failed to parse line:', line)
      }
    }
    setLoading(false)
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
          setDryRunResult([])
        }
      }}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>Dry Run</DialogTitle>
            <DialogDescription>展示当前处理器的演练执行结果和产出文件。</DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hash</TableHead>
                  <TableHead>条目</TableHead>
                  <TableHead>文件</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dryRunResult.map((row) => {
                  const status = itemStatusOf(row.status)
                  return (
                    <TableRow key={`${row.itemHash}-${row.id ?? 'dry-run'}`}>
                      <TableCell>
                        <div className="flex flex-col gap-2">
                          <Badge variant={statusVariant(status.type)}>状态:{status.label}</Badge>
                          <Badge variant="secondary">Hash:{row.itemHash}</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[360px]">
                        <ItemContentDetail content={row.itemContent} />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2">
                          <Button variant="outline" size="sm" onClick={() => {
                            setFileContents(row.itemContent.fileContents)
                            setShowFileContentDialog(true)
                          }}>
                            查看{row.itemContent.fileContents.length}个文件
                          </Button>
                          {Array.from(fileStatusGrouping(row.itemContent.fileContents)).map(([groupStatus, count]) => (
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
