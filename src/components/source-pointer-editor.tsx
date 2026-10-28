import Form from '@rjsf/shadcn'
import validator from '@rjsf/validator-ajv8'
import { ADDITIONAL_PROPERTY_FLAG, replaceStringParameters, type RJSFSchema, type WrapIfAdditionalTemplateProps } from '@rjsf/utils'
import { lazy, Suspense, useId, useMemo, useState } from 'react'

import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { parseSourcePointer, pointerFormDefaults, pointerUiSchema } from '~/lib/source-pointer'

const JsonEditor = lazy(() => import('~/components/shared/json-editor').then((module) => ({ default: module.JsonEditor })))

const translations: Record<string, string> = {
  'Add Item': '添加记录', Add: '添加', Remove: '删除', Copy: '复制',
  'Move up': '上移', 'Move down': '下移', 'clear input': '清空',
  Yes: '是', No: '否', Item: '记录', 'New Value': '',
  'No items yet. Use the button below to add some.': '暂无记录',
  'Add data for optional field': '填写此项', 'Remove data for optional field': '移除此项',
  'No data for optional field': '未设置', '%1 Key': '%1 标识',
}

function PointerMapEntry({ schema, children, classNames, style, id, label, disabled, readonly, onKeyRenameBlur, onRemoveProperty }: WrapIfAdditionalTemplateProps) {
  if (!(ADDITIONAL_PROPERTY_FLAG in schema)) {
    return <div className={classNames} style={style}>{children}</div>
  }
  return (
    <div className="min-w-0 space-y-3 border-l-2 pl-3">
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1 space-y-1">
          <label htmlFor={`${id}-key`} className="text-xs text-muted-foreground">名称 / ID</label>
          <Input key={label} id={`${id}-key`} defaultValue={label} disabled={disabled || readonly} onBlur={onKeyRenameBlur} />
        </div>
        <Button type="button" variant="outline" size="sm" disabled={disabled || readonly} onClick={onRemoveProperty} aria-label={`删除 ${label}`}>删除</Button>
      </div>
      {children}
    </div>
  )
}

export function SourcePointerEditor({ value, onChange, schema, disabled = false }: {
  value: string
  onChange: (value: string) => void
  schema?: RJSFSchema | null
  disabled?: boolean
}) {
  const id = useId()
  const [mode, setMode] = useState('form')
  const parsed = useMemo(() => {
    try { return { pointer: parseSourcePointer(value), error: undefined } }
    catch (error) { return { pointer: undefined, error: (error as Error).message } }
  }, [value])
  const uiSchema = useMemo(() => schema ? pointerUiSchema(schema) : {}, [schema])
  const hasSchema = Boolean(schema && Object.keys(schema).length)
  const activeMode = hasSchema && parsed.pointer ? mode : 'json'

  return (
    <Tabs value={activeMode} onValueChange={setMode} className="min-w-0 space-y-3">
      <TabsList aria-label="抓取进度编辑方式">
        <TabsTrigger value="form" disabled={!hasSchema || !parsed.pointer}>字段</TabsTrigger>
        <TabsTrigger value="json">JSON</TabsTrigger>
      </TabsList>
      {!hasSchema && <p className="text-sm text-muted-foreground">暂无可用的进度描述，使用 JSON 编辑。</p>}
      <TabsContent value="form" className="mt-0">
        {schema && parsed.pointer && (
          <Form
            idPrefix={`pointer-${id}`}
            schema={schema}
            uiSchema={uiSchema}
            formData={parsed.pointer}
            validator={validator}
            disabled={disabled}
            liveValidate
            showErrorList={false}
            omitExtraData={false}
            experimental_defaultFormStateBehavior={pointerFormDefaults}
            templates={{ WrapIfAdditionalTemplate: PointerMapEntry, ButtonTemplates: { SubmitButton: () => null } }}
            translateString={(key, params) => replaceStringParameters(translations[key] ?? key, params)}
            onChange={(event) => onChange(JSON.stringify(event.formData ?? {}, null, 2))}
            onSubmit={() => {}}
          />
        )}
      </TabsContent>
      <TabsContent value="json" className="mt-0 space-y-2">
        <Suspense fallback={<p className="text-sm text-muted-foreground">加载编辑器…</p>}>
          <JsonEditor value={value} onChange={onChange} readOnly={disabled} height={360} />
        </Suspense>
        {parsed.error && <p role="alert" className="text-sm text-destructive">{parsed.error}</p>}
      </TabsContent>
    </Tabs>
  )
}
