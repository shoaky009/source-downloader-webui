import { useState } from 'react'
import { toast } from 'sonner'

import { SourcePointerEditor } from '~/components/source-pointer-editor'
import { useSourcePointer } from '~/hooks/use-source-pointer'
import { parseSourcePointer } from '~/lib/source-pointer'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { processorService, type ProcessorSourceState } from '@/services/data.service'

export function ShowSourceState({ processorName, open, onOpenChange }: { processorName?: string; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [edit, setEdit] = useState<{ source: ProcessorSourceState; value: string }>()
  const [submitting, setSubmitting] = useState(false)
  const { source, schema, loading, error, metadataError, reload } = useSourcePointer(processorName, open)

  const data = edit && edit.source === source ? edit.value : JSON.stringify(source?.pointer ?? {}, null, 2)

  const submitPointerData = async () => {
    if (!processorName || !source || loading || submitting) return
    try {
      const pointer = parseSourcePointer(data, schema)
      setSubmitting(true)
      await processorService.updateSourcePointer(processorName, {
        sourceId: source.sourceId,
        pointer,
      })
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85dvh] w-[calc(100%-2rem)] max-w-3xl flex-col">
        <DialogHeader>
          <DialogTitle>抓取进度</DialogTitle>
          <DialogDescription>{processorName} · 保存后，下次运行使用调整后的进度。</DialogDescription>
        </DialogHeader>
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto space-y-3 pr-1">
          {loading ? <p className="text-sm text-muted-foreground">加载抓取进度…</p> : error ? (
            <div className="space-y-2">
              <p role="alert" className="text-sm text-destructive">{error}</p>
              <Button variant="outline" size="sm" onClick={reload}>重新加载</Button>
            </div>
          ) : source ? (
            <>
              {metadataError && <p role="status" className="text-sm text-muted-foreground">{metadataError}</p>}
              <SourcePointerEditor key={source.sourceId} value={data} onChange={(value) => setEdit({ source, value })} schema={schema} disabled={submitting} />
            </>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button disabled={loading || !source || submitting} onClick={submitPointerData}>{submitting ? '保存中…' : '保存进度'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
