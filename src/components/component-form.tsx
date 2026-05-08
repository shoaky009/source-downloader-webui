import Form from '@rjsf/core'
import validator from '@rjsf/validator-ajv8'
import { useMemo, useState } from 'react'

import { KeyValueField } from '~/components/jsonschema/key-value-field'
import { FormRow } from '~/components/shared/form-row'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { SingleSelect } from '~/components/shared/multi-select'
import { componentService } from '~/services/data.service'

interface ComponentType {
  type: string
  typeName: string
}

interface ComponentFormValue {
  name?: string
  props?: Record<string, unknown>
  type?: string
  typeName?: string
}

const componentTypes = [
  { label: '触发器(TRIGGER)', value: 'TRIGGER' },
  { label: '数据源(SOURCE)', value: 'SOURCE' },
  { label: '下载器(DOWNLOADER)', value: 'DOWNLOADER' },
  { label: '条目文件解析(ITEM_FILE_RESOLVER)', value: 'ITEM_FILE_RESOLVER' },
  { label: '文件移动器(FILE_MOVER)', value: 'FILE_MOVER' },
  { label: '条目过滤(SOURCE_ITEM_FILTER)', value: 'SOURCE_ITEM_FILTER' },
  { label: '条目内容过滤(ITEM_CONTENT_FILTER)', value: 'ITEM_CONTENT_FILTER' },
  { label: '文件内容过滤(FILE_CONTENT_FILTER)', value: 'FILE_CONTENT_FILTER' },
  { label: '标签器(TAGGER)', value: 'TAGGER' },
  { label: '文件替换规则(FILE_REPLACEMENT_DECIDER)', value: 'FILE_REPLACEMENT_DECIDER' },
  { label: '文件检测规则(FILE_EXISTS_DETECTOR)', value: 'FILE_EXISTS_DETECTOR' },
  { label: '变量提供(VARIABLE_PROVIDER)', value: 'VARIABLE_PROVIDER' },
  { label: '变量替换(VARIABLE_REPLACER)', value: 'VARIABLE_REPLACER' },
  { label: '处理监听(PROCESS_LISTENER)', value: 'PROCESS_LISTENER' },
]

export function ComponentForm() {
  const [formData, setFormData] = useState<ComponentFormValue>({})
  const [schema, setSchema] = useState<Record<string, any>>({})
  const [uiSchema, setUiSchema] = useState<Record<string, any>>({})
  const [currentTypeComponentOptions, setCurrentTypeComponentOptions] = useState<ComponentType[]>([])

  const componentTypeOptions = useMemo(() => componentTypes, [])
  const typeNameOptions = useMemo(
    () => currentTypeComponentOptions.map((item) => ({ label: item.typeName, value: item.typeName })),
    [currentTypeComponentOptions],
  )

  const handleTypeSelected = async (type?: string) => {
    setFormData((current) => ({ ...current, type, typeName: undefined, props: undefined }))
    setSchema({})
    setUiSchema({})
    if (!type) {
      setCurrentTypeComponentOptions([])
      return
    }
    const types = await componentService.types({ type })
    setCurrentTypeComponentOptions(types.data)
  }

  const handleTypeNameSelected = async (typeName?: string) => {
    setFormData((current) => ({ ...current, typeName, props: {} }))
    if (!typeName || !formData.type) {
      return
    }
    const response = await componentService.getComponentPropSchema(formData.type, typeName)
    if (!response.data.propertySchema) {
      setSchema({})
      setUiSchema({})
      return
    }
    const nextSchema = response.data.propertySchema
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
      ...Object.keys(response.data.uiSchema ?? {}).reduce<Record<string, any>>((acc, key) => {
        acc[key] = { ...resultSet[key], ...response.data.uiSchema[key] }
        return acc
      }, {}),
    }
    setUiSchema(merged)
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        <FormRow label="组件类型" required>
          <SingleSelect options={componentTypeOptions} value={formData.type} onChange={handleTypeSelected} placeholder="选择组件类型" />
        </FormRow>
        <FormRow label="组件类型名称" required>
          <SingleSelect options={typeNameOptions} value={formData.typeName} onChange={handleTypeNameSelected} placeholder="先选择组件类型" disabled={!formData.type} />
        </FormRow>
        <FormRow label="组件名称">
          <Input value={formData.name ?? ''} onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))} />
        </FormRow>
        <FormRow label="组件属性">
          {Object.keys(schema).length > 0 ? (
            <Form
              schema={schema}
              uiSchema={uiSchema}
              formData={formData.props}
              validator={validator}
              templates={{ ButtonTemplates: { SubmitButton: () => null } }}
              fields={{ keyValueField: KeyValueField }}
              onChange={(event) => setFormData((current) => ({ ...current, props: event.formData as Record<string, unknown> }))}
            />
          ) : (
            <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">暂无 schema</div>
          )}
        </FormRow>
      </div>
      <Button type="button" onClick={() => console.log('提交数据', formData)}>
        确定
      </Button>
    </div>
  )
}
