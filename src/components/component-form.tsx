import Form from '@rjsf/shadcn'
import validator from '@rjsf/validator-ajv8'
import { useEffect, useMemo, useState } from 'react'

import { KeyValueField } from '@/components/jsonschema/key-value-field'
import { InstanceField } from '@/components/jsonschema/instance-field'
import { FormRow } from '@/components/shared/form-row'
import { Button } from '@/components/ui/button'
import { Combobox } from '@/components/ui/combobox'
import { Input } from '@/components/ui/input'
import { componentService, type Component, type ComponentRootType, type ComponentTypeDescriptor } from '@/services/data.service'

interface ComponentFormValue {
  name?: string
  props?: Record<string, unknown>
  type?: ComponentRootType
  typeName?: string
}

const componentTypes: { label: string; value: ComponentRootType }[] = [
  { label: '触发器(Trigger)', value: 'trigger' },
  { label: '数据源(Source)', value: 'source' },
  { label: '下载器(Downloader)', value: 'downloader' },
  { label: '条目文件解析(ItemFileResolver)', value: 'item-file-resolver' },
  { label: '文件移动器(FileMover)', value: 'file-mover' },
  { label: '变量提供(VariableProvider)', value: 'variable-provider' },
  { label: '处理监听(ProcessListener)', value: 'process-listener' },
  { label: '条目过滤(SourceItemFilter)', value: 'source-item-filter' },
  { label: '源文件过滤(SourceFileFilter)', value: 'source-file-filter' },
  { label: '条目内容过滤(ItemContentFilter)', value: 'item-content-filter' },
  { label: '文件内容过滤(FileContentFilter)', value: 'file-content-filter' },
  { label: '文件标签器(FileTagger)', value: 'file-tagger' },
  { label: '文件替换规则(FileReplacementDecider)', value: 'file-replacement-decider' },
  { label: '文件检测规则(FileExistsDetector)', value: 'file-exists-detector' },
  { label: '变量替换(VariableReplacer)', value: 'variable-replacer' },
  { label: '裁剪器(Trimmer)', value: 'trimmer' },
]

export function ComponentForm({ component, onSaved }: { component?: Component; onSaved?: () => void | Promise<void> }) {
  const [formData, setFormData] = useState<ComponentFormValue>(() =>
    component
      ? { type: component.type, typeName: component.typeName, name: component.name, props: component.props }
      : {},
  )
  const [schema, setSchema] = useState<Record<string, any>>({})
  const [uiSchema, setUiSchema] = useState<Record<string, any>>({})
  const [currentTypeComponentOptions, setCurrentTypeComponentOptions] = useState<ComponentTypeDescriptor[]>([])
  const [submitting, setSubmitting] = useState(false)

  const componentTypeOptions = useMemo(() => componentTypes, [])
  const typeNameOptions = useMemo(
    () => currentTypeComponentOptions.map((item) => ({ label: item.name, value: item.name })),
    [currentTypeComponentOptions],
  )

  useEffect(() => {
    if (!component) {
      return
    }
    void Promise.all([
      componentService.types({ type: component.type }),
      componentService.getComponentPropSchema(component.type, component.typeName),
    ]).then(([types, metadata]) => {
      setCurrentTypeComponentOptions(types)
      setSchema(metadata.propsJsonSchema ?? {})
      setUiSchema(metadata.propsUiSchema ?? {})
    })
  }, [component])

  const handleTypeSelected = async (type?: string) => {
    const rootType = type as ComponentRootType | undefined
    setFormData((current) => ({ ...current, type: rootType, typeName: undefined, props: undefined }))
    setSchema({})
    setUiSchema({})
    if (!rootType) {
      setCurrentTypeComponentOptions([])
      return
    }
    const types = await componentService.types({ type: rootType })
    setCurrentTypeComponentOptions(types)
  }

  const handleTypeNameSelected = async (typeName?: string) => {
    setFormData((current) => ({ ...current, typeName, props: {} }))
    if (!typeName || !formData.type) {
      return
    }
    const metadata = await componentService.getComponentPropSchema(formData.type, typeName)
    if (!metadata.propsJsonSchema) {
      setSchema({})
      setUiSchema({})
      return
    }
    const nextSchema = metadata.propsJsonSchema
    setSchema(nextSchema)

    const resultSet: Record<string, { 'ui:field': string }> = {}
    for (const key in nextSchema.properties ?? {}) {
      const property = nextSchema.properties[key]
      if (property.type === 'object' && property.additionalProperties && property.additionalProperties.type === 'string') {
        resultSet[key] = { 'ui:field': 'keyValueField' }
      }
    }

    const merged = {
      ...resultSet,
      ...Object.keys(metadata.propsUiSchema ?? {}).reduce<Record<string, any>>((acc, key) => {
        acc[key] = { ...resultSet[key], ...metadata.propsUiSchema?.[key] }
        return acc
      }, {}),
    }
    setUiSchema(merged)
  }

  const handleSubmit = async () => {
    if (!formData.type || !formData.typeName) {
      return
    }
    setSubmitting(true)
    try {
      if (component) {
        await componentService.update(component, formData.props ?? {})
      } else {
        await componentService.create({
          type: formData.type,
          typeName: formData.typeName,
          name: formData.name ?? '',
          props: formData.props ?? {},
        })
      }
      await onSaved?.()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">{component ? '编辑组件' : '新建组件'}</h2>
        <p className="text-sm text-muted-foreground">{component ? '修改组件属性并保存。' : '先选择组件类型和类型名称，再按需填写组件属性。'}</p>
      </div>
      <div className="grid gap-4">
        <FormRow label="组件类型" required>
          <Combobox
            options={componentTypeOptions}
            value={formData.type}
            onChange={handleTypeSelected}
            placeholder="选择组件类型"
            disabled={Boolean(component)}
          />
        </FormRow>
        <FormRow label="组件类型名称" required>
          <Combobox
            options={typeNameOptions}
            value={formData.typeName}
            onChange={handleTypeNameSelected}
            placeholder="先选择组件类型"
            disabled={Boolean(component) || !formData.type}
          />
        </FormRow>
        <FormRow label="组件名称">
          <Input disabled={Boolean(component)} value={formData.name ?? ''} onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))} />
        </FormRow>
        <FormRow label="组件属性">
          {Object.keys(schema).length > 0 ? (
            <Form
              schema={schema}
              uiSchema={uiSchema}
              formData={formData.props}
              validator={validator}
              templates={{ ButtonTemplates: { SubmitButton: () => null } }}
              fields={{ keyValueField: KeyValueField, instanceField: InstanceField }}
              onChange={(event) => setFormData((current) => ({ ...current, props: event.formData as Record<string, unknown> }))}
            />
          ) : (
            <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">暂无 schema</div>
          )}
        </FormRow>
      </div>
      <Button type="button" disabled={!formData.type || !formData.typeName || submitting} onClick={handleSubmit}>
        {submitting ? '保存中...' : '确定'}
      </Button>
    </div>
  )
}
