import Form from '@rjsf/shadcn'
import validator from '@rjsf/validator-ajv8'
import { Pencil, Plus, Search, Server, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { useDocumentTitle } from '@/hooks/use-document-title'
import { FormRow } from '@/components/shared/form-row'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Combobox } from '@/components/ui/combobox'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { type InstanceCapability, type InstanceConfig, instanceService } from '@/services/data.service'

interface InstanceFormValue {
  name: string
  type: string
  props: Record<string, unknown>
}

function InstanceForm({ value, capabilities, onSaved }: {
  value?: InstanceConfig
  capabilities: InstanceCapability[]
  onSaved: () => void | Promise<void>
}) {
  const [formValue, setFormValue] = useState<InstanceFormValue>({
    name: value?.name ?? '', type: value?.type ?? '', props: value?.props ?? {},
  })
  const [metadata, setMetadata] = useState<InstanceCapability | undefined>()
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!formValue.type) {
      setMetadata(undefined)
      return
    }
    void instanceService.capability(formValue.type).then(setMetadata)
  }, [formValue.type])

  const schema = metadata?.metadata?.propsJsonSchema ?? { type: 'object', properties: {} }
  const uiSchema = metadata?.metadata?.propsUiSchema ?? {}

  return (
    <div className="space-y-4">
      <FormRow label="实例名称" required>
        <Input
          disabled={Boolean(value)}
          value={formValue.name}
          onChange={(event) => setFormValue((current) => ({ ...current, name: event.target.value }))}
        />
      </FormRow>
      <FormRow label="工厂类型" required>
        <Combobox
          disabled={Boolean(value)}
          options={capabilities.map((factory) => ({ label: factory.simpleName, value: factory.type }))}
          value={formValue.type}
          onChange={(type) => setFormValue((current) => ({ ...current, type: type ?? '', props: {} }))}
          placeholder="选择实例工厂"
        />
      </FormRow>
      {metadata?.description && <p className="text-sm text-muted-foreground">{metadata.description}</p>}
      <FormRow label="实例属性">
        <Form
          schema={schema}
          uiSchema={uiSchema}
          formData={formValue.props}
          validator={validator}
          templates={{ ButtonTemplates: { SubmitButton: () => null } }}
          onChange={(event) => setFormValue((current) => ({ ...current, props: event.formData as Record<string, unknown> }))}
        />
      </FormRow>
      <Button
        disabled={submitting || !formValue.name.trim() || !formValue.type}
        onClick={async () => {
          setSubmitting(true)
          try {
            if (value) {
              await instanceService.update(value.name, { type: formValue.type, props: formValue.props })
            } else {
              await instanceService.create(formValue)
            }
            await onSaved()
          } finally {
            setSubmitting(false)
          }
        }}
      >
        {submitting ? '保存中...' : '保存'}
      </Button>
    </div>
  )
}

export function InstancePage() {
  useDocumentTitle('实例')
  const [instances, setInstances] = useState<InstanceConfig[]>([])
  const [capabilities, setCapabilities] = useState<InstanceCapability[]>([])
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<InstanceConfig | null | undefined>(undefined)
  const [deleting, setDeleting] = useState<InstanceConfig | undefined>()
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    const [nextInstances, nextCapabilities] = await Promise.all([
      instanceService.query(), instanceService.capabilities(),
    ])
    setInstances(nextInstances)
    setCapabilities(nextCapabilities)
    setLoading(false)
  }

  useEffect(() => { void refresh() }, [])

  const filtered = useMemo(() => {
    const term = search.toLowerCase()
    return instances.filter((item) => !term || item.name.toLowerCase().includes(term) || item.type.toLowerCase().includes(term))
  }, [instances, search])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索实例..." className="pl-9" />
        </div>
        <Button className="gap-2" onClick={() => setEditing(null)}><Plus className="h-4 w-4" />新建实例</Button>
        <span className="ml-auto text-sm text-muted-foreground">共 {instances.length} 个实例</span>
      </div>

      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center py-12 text-muted-foreground"><Server className="mb-3 h-12 w-12 opacity-50" />暂无实例</div>
      )}
      <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
        {filtered.map((item) => (
          <Card key={item.name}>
            <CardContent className="flex items-start gap-3 p-4">
              <Server className="mt-1 h-5 w-5 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2"><h3 className="truncate font-medium">{item.name}</h3><Badge variant={item.loaded ? 'default' : 'secondary'}>{item.loaded ? '已加载' : '未加载'}</Badge></div>
                <p className="mt-1 truncate text-sm text-muted-foreground">{item.type}</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setEditing(item)}><Pencil className="h-4 w-4" /></Button>
              <Button size="sm" variant="ghost" onClick={() => setDeleting(item)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={editing !== undefined} onOpenChange={(open) => { if (!open) setEditing(undefined) }}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? '编辑实例' : '新建实例'}</DialogTitle><DialogDescription>实例属性保存前会由后端工厂校验。</DialogDescription></DialogHeader>
          <InstanceForm value={editing ?? undefined} capabilities={capabilities} onSaved={async () => { setEditing(undefined); await refresh() }} />
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => { if (!open) setDeleting(undefined) }}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>删除实例 {deleting?.name}？</AlertDialogTitle><AlertDialogDescription>配置将被永久删除，已加载实例会立即销毁。</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>取消</AlertDialogCancel><AlertDialogAction onClick={async () => { if (deleting) await instanceService.delete(deleting.name); setDeleting(undefined); await refresh() }}>删除</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
