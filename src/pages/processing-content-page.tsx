import debounce from 'lodash/debounce'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import { useDocumentTitle } from '~/hooks/use-document-title'
import { FileContentDetail } from '~/components/file-content-detail'
import { ItemContentDetail } from '~/components/item-content-detail'
import { ProcessorSelector } from '~/components/processor-selector'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog'
import { Card, CardContent } from '~/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { MultiSelect } from '~/components/shared/multi-select'
import {
  type FileContent,
  fileStatusGrouping,
  itemStatusOf,
  type ProcessingContent,
  processingContentService,
  processingContentStatuses,
} from '~/services/data.service'

function statusVariant(type: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (type === 'danger') return 'destructive'
  if (type === 'warning') return 'outline'
  if (type === 'info') return 'secondary'
  return 'default'
}

function toRangeValue(value: [string, string] | undefined) {
  return value ? `${value[0]} ~ ${value[1]}` : ''
}

export function ProcessingContentPage() {
  useDocumentTitle('记录')
  const [itemContents, setItemContents] = useState<ProcessingContent[]>([])
  const [maxId, setMaxId] = useState(0)
  const [loading, setLoading] = useState(false)
  const [fileContents, setFileContents] = useState<FileContent[]>([])
  const [showFileContentDialog, setShowFileContentDialog] = useState(false)
  const [selectedProcessors, setSelectedProcessors] = useState<string[]>([])
  const [status, setStatus] = useState<string[]>([])
  const [itemHash, setItemHash] = useState('')
  const [itemTitle, setItemTitle] = useState('')
  const [createTimeRange, setCreateTimeRange] = useState<[string, string]>()
  const [selectedRows, setSelectedRows] = useState<ProcessingContent[]>([])
  const [pendingAction, setPendingAction] = useState<{ type: 'reprocess' | 'delete'; rows: ProcessingContent[] } | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  const fetchData = async (clear = false) => {
    if (loading) {
      return
    }

    const nextMaxId = clear ? 0 : maxId
    setLoading(true)
    try {
      const response = await processingContentService.query({
        maxId: nextMaxId.toString(),
        processorName: selectedProcessors.join(','),
        status: status.join(','),
        itemHash,
        'item.title': itemTitle,
        'createTime.begin': createTimeRange?.[0] ?? '',
        'createTime.end': createTimeRange?.[1] ?? '',
      })

      setItemContents((current) => (clear ? response.contents : [...current, ...response.contents]))
      if (response.nextMaxId) {
        setMaxId(response.nextMaxId)
      }
      if (clear && response.nextMaxId === 0) {
        setMaxId(0)
      }
    } finally {
      setLoading(false)
    }
  }

  const debouncedLoadMore = useMemo(
    () =>
      debounce(() => {
        void fetchData(false)
      }, 1000),
    [maxId, selectedProcessors, status, itemHash, itemTitle, createTimeRange, loading],
  )

  useEffect(() => {
    void fetchData(true)
    return () => debouncedLoadMore.cancel()
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          debouncedLoadMore()
        }
      },
      { threshold: 1 },
    )
    if (bottomRef.current) {
      observer.observe(bottomRef.current)
    }
    return () => observer.disconnect()
  }, [debouncedLoadMore])

  const statusOptions = processingContentStatuses.map((item) => ({ label: item.label, value: item.value }))

  const handleBatchSubmit = async () => {
    if (!pendingAction) {
      return
    }
    try {
      if (pendingAction.type === 'reprocess') {
        await Promise.all(pendingAction.rows.map((row) => processingContentService.reprocess(row.id)))
        toast.success('批量重新处理已完成')
      } else {
        await Promise.all(pendingAction.rows.map((row) => processingContentService.delete(row.id)))
        toast.success('批量删除已完成')
      }
      setPendingAction(null)
      await fetchData(true)
    } catch {
      toast.error('操作失败')
    }
  }

  const handleDateInputChange = (value: string) => {
    if (!value.trim()) {
      setCreateTimeRange(undefined)
      void fetchData(true)
      return
    }
    const [begin, end] = value.split('~').map((item) => item.trim())
    if (begin && end) {
      setCreateTimeRange([begin, end])
      void fetchData(true)
    }
  }

  const debouncedTitleChange = useMemo(
    () =>
      debounce((text: string) => {
        setItemTitle(text)
        void fetchData(true)
      }, 200),
    [selectedProcessors, status, itemHash, createTimeRange, maxId, loading],
  )

  return (
    <div className="space-y-4">
      <div className="sticky top-14 z-10 space-y-3 bg-background py-2">
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
          <ProcessorSelector
            value={selectedProcessors}
            onChange={(selected) => {
              setSelectedProcessors(selected)
              if (selected.length === 0) {
                setStatus([])
              }
              void fetchData(true)
            }}
          />
          <MultiSelect
            options={statusOptions}
            value={status}
            onChange={(next) => {
              if (selectedProcessors.length > 0) {
                setStatus(next)
                void fetchData(true)
              }
            }}
            placeholder="状态"
          />
          <Input
            value={itemHash}
            placeholder="条目哈希"
            onChange={(event) => setItemHash(event.target.value)}
            onBlur={() => void fetchData(true)}
          />
          <Input
            defaultValue={itemTitle}
            placeholder="条目标题"
            onChange={(event) => debouncedTitleChange(event.target.value)}
          />
        </div>

        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
          <Input value={toRangeValue(createTimeRange)} placeholder="YYYY-MM-DDTHH:mm:ss ~ YYYY-MM-DDTHH:mm:ss" onChange={(event) => handleDateInputChange(event.target.value)} />
          <Button variant="outline" onClick={() => setPendingAction({ type: 'reprocess', rows: selectedRows })}>
            批量重新处理({selectedRows.length})
          </Button>
          <Button variant="destructive" onClick={() => setPendingAction({ type: 'delete', rows: selectedRows })}>
            批量删除({selectedRows.length})
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>选择</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>条目</TableHead>
                <TableHead>文件</TableHead>
                <TableHead>操作</TableHead>
                <TableHead>其他</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {itemContents.map((row) => {
                const selected = selectedRows.some((item) => item.id === row.id)
                const statusInfo = itemStatusOf(row.status)
                return (
                  <TableRow key={row.id} data-state={selected ? 'selected' : undefined}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={(event) => {
                          if (event.target.checked) {
                            setSelectedRows((current) => [...current, row])
                          } else {
                            setSelectedRows((current) => current.filter((item) => item.id !== row.id))
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell className="min-w-[220px]">
                      <div className="flex flex-col gap-2">
                        <Badge variant="secondary">ID:{row.id}</Badge>
                        <Badge variant="secondary">处理器:{row.processorName}</Badge>
                        <Badge variant={statusVariant(statusInfo.type)}>状态:{statusInfo.label}</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="min-w-[320px]">
                      <ItemContentDetail content={row.itemContent} />
                    </TableCell>
                    <TableCell className="min-w-[180px]">
                      <div className="flex flex-col gap-2">
                        <Button variant="outline" size="sm" onClick={() => {
                          setFileContents(row.itemContent.fileContents)
                          setShowFileContentDialog(true)
                        }}>
                          查看{row.itemContent.fileContents.length}个文件
                        </Button>
                        <Badge variant="secondary">命名次数:{row.renameTimes}</Badge>
                        {Array.from(fileStatusGrouping(row.itemContent.fileContents)).map(([groupStatus, count]) => (
                          <Badge key={groupStatus.value} variant={statusVariant(groupStatus.type)}>
                            {groupStatus.label}:{count}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="min-w-[120px]">
                      <div className="flex flex-col gap-2">
                        <Button variant="outline" size="sm" onClick={async () => {
                          await processingContentService.reprocess(row.id)
                          await fetchData(true)
                        }}>
                          重新处理
                        </Button>
                        <Button variant="destructive" size="sm" onClick={async () => {
                          await processingContentService.delete(row.id)
                          await fetchData(true)
                        }}>
                          删除
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="min-w-[300px]">
                      <div className="grid gap-1 text-sm">
                        <div>Hash:{row.itemHash}</div>
                        {row.failureReason ? <div>错误信息:{row.failureReason}</div> : null}
                        <div>创建时间:{row.createTime}</div>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          {loading ? <div className="p-4 text-sm text-muted-foreground">加载中...</div> : null}
          <div ref={bottomRef} className="h-4" />
        </CardContent>
      </Card>

      <Dialog open={showFileContentDialog} onOpenChange={setShowFileContentDialog}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>文件内容</DialogTitle>
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

      <AlertDialog open={pendingAction != null} onOpenChange={(open) => !open && setPendingAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>提示</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.type === 'reprocess'
                ? `确定要重新处理${pendingAction.rows.length}个条目吗？`
                : `确定要删除${pendingAction?.rows.length ?? 0}个条目吗？`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleBatchSubmit}>确定</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
