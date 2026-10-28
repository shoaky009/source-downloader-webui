import Form from '@rjsf/shadcn'
import validator from '@rjsf/validator-ajv8'
import { ADDITIONAL_PROPERTY_FLAG, getUiOptions, replaceStringParameters, type RJSFSchema, type WrapIfAdditionalTemplateProps } from '@rjsf/utils'
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

function PointerMapEntry({ schema, uiSchema, children, classNames, style, id, label, rawDescription, disabled, readonly, onKeyRenameBlur, onRemoveProperty }: WrapIfAdditionalTemplateProps) {
  if (!(ADDITIONAL_PROPERTY_FLAG in schema)) {
    return <div className={classNames} style={style}>{children}</div>
  }
  const { keyTitle } = getUiOptions(uiSchema)
  const types = Array.isArray(schema.type) ? schema.type : [schema.type]
  const isContainer = types.includes('object') || types.includes('array')
  const valueTitle = schema.title || '值'
  const valueField = (
    <div className="min-w-0 space-y-1">
      {isContainer ? <div className="text-sm font-medium">{valueTitle}</div> : <label htmlFor={id} className="block text-sm font-medium">{valueTitle}</label>}
      {children}
      {rawDescription && <p className="text-xs text-muted-foreground">{rawDescription}</p>}
    </div>
  )
  return (
    <div className="min-w-0 space-y-3 rounded-md border p-3">
      <div className={`grid items-start gap-3 ${isContainer ? 'grid-cols-[minmax(0,1fr)_auto]' : 'sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto]'}`}>
        <div className="min-w-0 space-y-1">
          <label htmlFor={`${id}-key`} className="block text-sm font-medium">{typeof keyTitle === 'string' && keyTitle ? keyTitle : '键'}</label>
          <div className="p-0.5">
            <Input key={label} id={`${id}-key`} className="h-9" defaultValue={label} disabled={disabled || readonly} onBlur={onKeyRenameBlur} />
          </div>
        </div>
        {!isContainer && valueField}
        <Button type="button" variant="outline" className={`h-9 justify-self-end ${isContainer ? 'mt-[26px]' : 'sm:mt-[26px]'}`} disabled={disabled || readonly} onClick={onRemoveProperty} aria-label={`删除 ${label}`}>删除</Button>
      </div>
      {isContainer && valueField}
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
  const uiSchema = useMemo(() => schema ? { ...pointerUiSchema(schema), 'ui:title': '' } : {}, [schema])
  const hasSchema = Boolean(schema && Object.keys(schema).length)
  const activeMode = hasSchema && parsed.pointer ? mode : 'json'

  return (
    <Tabs value={activeMode} onValueChange={setMode} className="min-w-0 space-y-3">
      <TabsList aria-label="数据源游标编辑方式">
        <TabsTrigger value="form" disabled={!hasSchema || !parsed.pointer}>字段</TabsTrigger>
        <TabsTrigger value="json">JSON</TabsTrigger>
      </TabsList>
      {!hasSchema && <p className="text-sm text-muted-foreground">暂无游标字段描述，使用 JSON 编辑。</p>}
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
