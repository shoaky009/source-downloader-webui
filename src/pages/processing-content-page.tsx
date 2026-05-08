import debounce from 'lodash/debounce'
import {
  AlertCircle,
  Calendar,
  CheckSquare,
  ExternalLink,
  FileText,
  Hash,
  RefreshCw,
  Search,
  Square,
  Trash2,
} from 'lucide-react'
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
  const [pendingAction, setPendingAction] = useState<{ type: 'reprocess' | 'delete'; rows: ProcessingContent[] } | null>(
    null,
  )
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
      setSelectedRows([])
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

  const toggleSelectAll = () => {
    if (selectedRows.length === itemContents.length) {
      setSelectedRows([])
    } else {
      setSelectedRows([...itemContents])
    }
  }

  return (
    <div className="space-y-6">
      {/* 筛选工具栏 */}
      <div className="sticky -top-4 z-10 -mx-4 space-y-3 bg-background px-4 pb-4 pt-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
            placeholder="状态筛选"
          />
          <div className="relative">
            <Hash className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={itemHash}
              placeholder="条目哈希"
              className="pl-9"
              onChange={(event) => setItemHash(event.target.value)}
              onBlur={() => void fetchData(true)}
            />
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              defaultValue={itemTitle}
              placeholder="条目标题"
              className="pl-9"
              onChange={(event) => debouncedTitleChange(event.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-auto sm:min-w-[320px]">
            <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={toRangeValue(createTimeRange)}
              placeholder="时间范围: YYYY-MM-DD ~ YYYY-MM-DD"
              className="pl-9"
              onChange={(event) => handleDateInputChange(event.target.value)}
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            {selectedRows.length > 0 && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => setPendingAction({ type: 'reprocess', rows: selectedRows })}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  重新处理 ({selectedRows.length})
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="gap-1.5"
                  onClick={() => setPendingAction({ type: 'delete', rows: selectedRows })}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  删除 ({selectedRows.length})
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 记录列表 */}
      <div className="space-y-3">
        {/* 全选按钮 */}
        {itemContents.length > 0 && (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" className="h-7 gap-1.5 px-2" onClick={toggleSelectAll}>
              {selectedRows.length === itemContents.length ? (
                <CheckSquare className="h-4 w-4" />
              ) : (
                <Square className="h-4 w-4" />
              )}
              {selectedRows.length === itemContents.length ? '取消全选' : '全选'}
            </Button>
            <span className="text-sm text-muted-foreground">共 {itemContents.length} 条记录</span>
          </div>
        )}

        {/* 记录卡片 */}
        <div className="grid gap-3 sm:grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3">
          {itemContents.map((row) => {
            const selected = selectedRows.some((item) => item.id === row.id)
            const statusInfo = itemStatusOf(row.status)
            const hasError = statusInfo.type === 'danger'
            const fileStatusGroups = Array.from(fileStatusGrouping(row.itemContent.fileContents))

            return (
              <Card
                key={row.id}
                className={`transition-colors ${selected ? 'ring-2 ring-primary' : ''} ${hasError ? 'border-destructive/50' : ''}`}
              >
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    {/* 选择框 */}
                    <button
                      type="button"
                      className="mt-0.5 shrink-0"
                      onClick={() => {
                        if (selected) {
                          setSelectedRows((current) => current.filter((item) => item.id !== row.id))
                        } else {
                          setSelectedRows((current) => [...current, row])
                        }
                      }}
                    >
                      {selected ? (
                        <CheckSquare className="h-4 w-4 text-primary" />
                      ) : (
                        <Square className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>

                    {/* 主要内容 */}
                    <div className="min-w-0 flex-1 space-y-3">
                      {/* 头部信息 */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary" className="shrink-0 font-mono text-xs">
                              #{row.id}
                            </Badge>
                            <Badge variant={statusVariant(statusInfo.type)}>{statusInfo.label}</Badge>
                          </div>
                          <p className="mt-1.5 truncate text-sm text-muted-foreground">{row.processorName}</p>
                        </div>
                      </div>

                      {/* 条目信息 */}
                      <div className="rounded-md border bg-muted/30 p-3">
                        <ItemContentDetail content={row.itemContent} />
                      </div>

                      {/* 文件统计 */}
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1.5 text-xs"
                          onClick={() => {
                            setFileContents(row.itemContent.fileContents)
                            setShowFileContentDialog(true)
                          }}
                        >
                          <FileText className="h-3.5 w-3.5" />
                          {row.itemContent.fileContents.length} 个文件
                        </Button>
                        {fileStatusGroups.map(([groupStatus, count]) => (
                          <Badge key={groupStatus.value} variant={statusVariant(groupStatus.type)} className="text-xs">
                            {groupStatus.label}: {count}
                          </Badge>
                        ))}
                        {row.renameTimes > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            命名: {row.renameTimes}
                          </Badge>
                        )}
                      </div>

                      {/* 错误信息 */}
                      {row.failureReason && (
                        <div className="flex items-start gap-1.5 rounded bg-destructive/10 p-2 text-xs text-destructive">
                          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          <span className="break-all">{row.failureReason}</span>
                        </div>
                      )}

                      {/* 底部信息 */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <span className="text-muted-foreground/70">Hash</span>
                            <span className="font-mono">{row.itemHash.slice(0, 8)}...</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="text-muted-foreground/70">创建</span>
                            <span>{row.createTime}</span>
                          </span>
                        </div>

                        {/* 操作按钮 */}
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 gap-1 px-2 text-xs"
                            onClick={async () => {
                              await processingContentService.reprocess(row.id)
                              await fetchData(true)
                            }}
                          >
                            <RefreshCw className="h-3 w-3" />
                            重新处理
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={async () => {
                              await processingContentService.delete(row.id)
                              await fetchData(true)
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* 加载状态 */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">加载中...</span>
          </div>
        )}

        {/* 空状态 */}
        {!loading && itemContents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="mb-3 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">暂无记录</p>
          </div>
        )}

        <div ref={bottomRef} className="h-4" />
      </div>

      {/* 文件内容弹窗 */}
      <Dialog open={showFileContentDialog} onOpenChange={setShowFileContentDialog}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>文件内容详情</DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] space-y-3 overflow-auto">
            {fileContents.map((file, index) => (
              <Card key={file.fileDownloadPath || index}>
                <CardContent className="p-4">
                  <FileContentDetail file={file} />
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* 批量操作确认弹窗 */}
      <AlertDialog open={pendingAction != null} onOpenChange={(open) => !open && setPendingAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认操作</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.type === 'reprocess'
                ? `确定要重新处理选中的 ${pendingAction.rows.length} 个条目吗？`
                : `确定要删除选中的 ${pendingAction?.rows.length ?? 0} 个条目吗？此操作不可撤销。`}
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
