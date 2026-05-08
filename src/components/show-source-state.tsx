import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { JsonEditor } from '@/components/shared/json-editor'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { processorService } from '@/services/data.service'

export function ShowSourceState({ processorName, open, onOpenChange }: { processorName?: string; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [data, setData] = useState('')
  const [sourceId, setSourceId] = useState<string | null | undefined>()

  useEffect(() => {
    if (!open || !processorName) {
      return
    }
    processorService.sourceState(processorName).then((response) => {
      setData(JSON.stringify(response.data.pointer ?? {}, null, 2))
      setSourceId(response.data.sourceId)
    })
  }, [open, processorName])

  const submitPointerData = async () => {
    if (!processorName) {
      toast.error('缺少 processorName')
      return
    }
    if (!data.trim()) {
      toast.error('Pointer 数据不能为空')
      return
    }

    let pointerPayload: unknown
    try {
      pointerPayload = JSON.parse(data)
    } catch {
      toast.error('JSON 格式错误，无法解析')
      return
    }

    if (pointerPayload === null || typeof pointerPayload !== 'object' || Array.isArray(pointerPayload)) {
      toast.error('Pointer 必须是一个 JSON 对象')
      return
    }

    try {
      await processorService.updateSourcePointer(processorName, {
        sourceId,
        pointer: pointerPayload,
      })
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '提交失败')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Pointer</DialogTitle>
        </DialogHeader>
        <JsonEditor value={data} onChange={setData} height={420} />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={submitPointerData}>提交修改</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
