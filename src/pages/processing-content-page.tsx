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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import { useDocumentTitle } from '@/hooks/use-document-title'
import { FileContentDetail } from '@/components/file-content-detail'
import { ItemContentDetail } from '@/components/item-content-detail'
import { ProcessorSelector } from '@/components/processor-selector'
import { MultiSelect } from '@/components/shared/multi-select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  type FileContent,
  fileStatusGrouping,
  itemStatusOf,
  type ProcessingContent,
  processingContentService,
  processingContentStatuses,
} from '@/services/data.service'

function statusVariant(type: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (type === 'danger') return 'destructive'
  if (type === 'warning') return 'outline'
  if (type === 'info') return 'secondary'
  return 'default'
}

interface QueryFilters {
  selectedProcessors: string[]
  status: string[]
  itemHash: string
  itemTitle: string
  createTimeRange?: [string, string]
}

export function ProcessingContentPage() {
  useDocumentTitle('记录')
  const [itemContents, setItemContents] = useState<ProcessingContent[]>([])
  const [nextMaxId, setNextMaxId] = useState(0)
  const [loadingState, setLoadingState] = useState<'initial' | 'append' | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
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
  const requestIdRef = useRef(0)
  const filtersRef = useRef<QueryFilters>({
    selectedProcessors: [],
    status: [],
    itemHash: '',
    itemTitle: '',
    createTimeRange: undefined,
  })
  const queryStateRef = useRef({
    nextMaxId: 0,
    hasMore: true,
    loadError: null as string | null,
    isLoading: false,
  })
  const [hasMore, setHasMore] = useState(true)

  const isLoading = loadingState !== null

  useEffect(() => {
    filtersRef.current = {
      selectedProcessors,
      status,
      itemHash,
      itemTitle,
      createTimeRange,
    }
  }, [createTimeRange, itemHash, itemTitle, selectedProcessors, status])

  const mergeContentsById = (current: ProcessingContent[], incoming: ProcessingContent[]) => {
    const merged = new Map<number, ProcessingContent>()

    for (const item of current) {
      merged.set(item.id, item)
    }

    for (const item of incoming) {
      merged.set(item.id, item)
    }

    return Array.from(merged.values())
  }

  const fetchData = useCallback(
    async ({
      clear = false,
      filters,
    }: {
      clear?: boolean
      filters?: Partial<QueryFilters>
    } = {}) => {
      if (!clear && (queryStateRef.current.isLoading || !queryStateRef.current.hasMore || queryStateRef.current.loadError)) {
        return
      }

      const nextFilters: QueryFilters = {
        ...filtersRef.current,
        ...filters,
      }

      const cursor = clear ? 0 : queryStateRef.current.nextMaxId
      const requestId = requestIdRef.current + 1
      requestIdRef.current = requestId

      if (clear) {
        queryStateRef.current.nextMaxId = 0
        queryStateRef.current.hasMore = true
        setHasMore(true)
        setNextMaxId(0)
      }

      queryStateRef.current.isLoading = true
      queryStateRef.current.loadError = null
      setLoadError(null)
      setLoadingState(clear ? 'initial' : 'append')

      try {
        const response = await processingContentService.query({
          maxId: cursor.toString(),
          processorName: nextFilters.selectedProcessors.join(','),
          status: nextFilters.status.join(','),
          itemHash: nextFilters.itemHash,
          'item.title': nextFilters.itemTitle,
          'createTime.begin': nextFilters.createTimeRange?.[0] ?? '',
          'createTime.end': nextFilters.createTimeRange?.[1] ?? '',
        })

        if (requestId !== requestIdRef.current) {
          return
        }

        setItemContents((current) => (clear ? response.contents : mergeContentsById(current, response.contents)))
        if (clear) {
          setSelectedRows([])
        }

        queryStateRef.current.nextMaxId = response.nextMaxId
        queryStateRef.current.hasMore = response.nextMaxId > 0 && response.contents.length > 0
        queryStateRef.current.loadError = null

        setNextMaxId(response.nextMaxId)
        setHasMore(queryStateRef.current.hasMore)
      } catch (error) {
        if (requestId !== requestIdRef.current) {
          return
        }

        const message = error instanceof Error ? error.message : '加载失败，请稍后重试'
        queryStateRef.current.loadError = message
        setLoadError(message)
      } finally {
        if (requestId === requestIdRef.current) {
          queryStateRef.current.isLoading = false
          setLoadingState(null)
        }
      }
    },
    [],
  )

  const debouncedTitleChange = useMemo(
    () =>
      debounce((text: string) => {
        setItemTitle(text)
        void fetchData({ clear: true, filters: { itemTitle: text } })
      }, 200),
    [fetchData],
  )

  useEffect(() => {
    void fetchData({ clear: true })
  }, [fetchData])

  useEffect(() => {
    return () => {
      debouncedTitleChange.cancel()
    }
  }, [debouncedTitleChange])

  useEffect(() => {
    if (!bottomRef.current) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isLoading && !loadError) {
          void fetchData({ clear: false })
        }
      },
      { rootMargin: '400px 0px', threshold: 0 },
    )
    observer.observe(bottomRef.current)
    return () => observer.disconnect()
  }, [fetchData, hasMore, isLoading, loadError])

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
      await fetchData({ clear: true })
    } catch {
      toast.error('操作失败')
    }
  }

  const handleDateInputChange = (index: 0 | 1, value: string) => {
    const nextRange = [createTimeRange?.[0] ?? '', createTimeRange?.[1] ?? ''] as [string, string]
    nextRange[index] = value

    const normalizedRange = nextRange[0] || nextRange[1] ? nextRange : undefined
    setCreateTimeRange(normalizedRange)
    void fetchData({ clear: true, filters: { createTimeRange: normalizedRange } })
  }

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
              const nextStatus = selected.length === 0 ? [] : status
              setSelectedProcessors(selected)
              if (selected.length === 0) {
                setStatus([])
              }
              void fetchData({
                clear: true,
                filters: { selectedProcessors: selected, status: nextStatus },
              })
            }}
          />
          <MultiSelect
            options={statusOptions}
            value={status}
            disabled={selectedProcessors.length === 0}
            onChange={(next) => {
              setStatus(next)
              void fetchData({ clear: true, filters: { status: next } })
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
              onBlur={(event) => void fetchData({ clear: true, filters: { itemHash: event.target.value } })}
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
          <div className="grid w-full gap-3 sm:w-auto sm:min-w-[420px] sm:grid-cols-2">
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="date"
                value={createTimeRange?.[0] ?? ''}
                className="pl-9"
                onChange={(event) => handleDateInputChange(0, event.target.value)}
              />
            </div>
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="date"
                value={createTimeRange?.[1] ?? ''}
                className="pl-9"
                onChange={(event) => handleDateInputChange(1, event.target.value)}
              />
            </div>
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
                              await fetchData({ clear: true })
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
                              await fetchData({ clear: true })
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
        {loadingState === 'append' && hasMore && (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">加载中...</span>
          </div>
        )}

        {loadError && (
          <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{loadError}</span>
            </div>
            <Button size="sm" variant="outline" onClick={() => void fetchData({ clear: itemContents.length === 0 })}>
              重试加载
            </Button>
          </div>
        )}

        {/* 空状态 */}
        {!isLoading && !loadError && itemContents.length === 0 && (
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
