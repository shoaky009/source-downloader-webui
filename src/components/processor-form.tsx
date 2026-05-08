import { useState } from 'react'

import { ComponentSelector } from '~/components/component-selector'
import { DynamicTag } from '~/components/dynamic-tag'
import { FormRow } from '~/components/shared/form-row'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Switch } from '~/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { SingleSelect } from '~/components/shared/multi-select'

interface ProcessorConfig {
  name?: string
  triggers?: string[]
  source?: string
  itemFileResolver?: string
  downloader?: string
  fileMover?: string
  savePath?: string
  options: Options
  enabled?: boolean
  category?: string | null
  tags?: string[]
}

interface Options {
  variableProviders?: string[]
  sourceItemFilters?: string[]
  fileContentFilters?: string[]
  itemContentFilters?: string[]
  savePathPattern?: string
  filenamePattern?: string
  processListeners?: string[]
  renameTaskInterval?: number | string
  downloadOptions: DownloadOptions
  variableConflictStrategy?: string
  renameTimesThreshold?: number | string
  saveProcessingContent?: boolean
  itemExpressionExclusions?: string[]
  itemExpressionInclusions?: string[]
  contentExpressionExclusions?: string[]
  contentExpressionInclusions?: string[]
  fileExpressionExclusions?: string[]
  fileExpressionInclusions?: string[]
  variableErrorStrategy?: string
  touchItemDirectory?: boolean
  deleteEmptyDirectory?: boolean
  fileTaggers?: string[]
  variableReplacers?: string[]
  supportWindowsPlatformPath?: boolean
  fileReplacementDecider?: string
  fileExistsDetector?: string
  fetchLimit?: number | string
  pointerBatchMode?: boolean
  itemErrorContinue?: boolean
  parallelism?: number | string
  retryBackoffMills?: number | string
  taskGroup?: string
  expression?: string
}

interface DownloadOptions {
  category?: string
  tags?: string[]
}

const variableErrorStrategyOptions = [
  { label: '保留原有', value: 'ORIGINAL' },
  { label: '模板', value: 'PATTERN' },
  { label: '停留', value: 'STAY' },
  { label: '未解析', value: 'TO_UNRESOLVED' },
]

const variableConflictStrategyOptions = [
  { label: '任意', value: 'ANY' },
  { label: '值相同的数量最多的', value: 'VOTE' },
  { label: 'Provider定义的精度', value: 'ACCURACY' },
  { label: 'VOTE+SMART', value: 'SMART' },
]

const expressionOptions = [
  { label: 'CEL', value: 'CEL' },
  { label: 'SPEL', value: 'SPEL' },
]

export function ProcessorForm() {
  const [formValue, setFormValue] = useState<ProcessorConfig>({
    enabled: true,
    options: {
      supportWindowsPlatformPath: true,
      saveProcessingContent: true,
      pointerBatchMode: true,
      touchItemDirectory: true,
      deleteEmptyDirectory: true,
      downloadOptions: {},
    },
  })

  const updateRoot = <K extends keyof ProcessorConfig>(key: K, value: ProcessorConfig[K]) => {
    setFormValue((current) => ({ ...current, [key]: value }))
  }

  const updateOptions = <K extends keyof Options>(key: K, value: Options[K]) => {
    setFormValue((current) => ({ ...current, options: { ...current.options, [key]: value } }))
  }

  const updateDownloadOptions = <K extends keyof DownloadOptions>(key: K, value: DownloadOptions[K]) => {
    setFormValue((current) => ({ ...current, options: { ...current.options, downloadOptions: { ...current.options.downloadOptions, [key]: value } } }))
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-3 gap-1 md:grid-cols-6">
          <TabsTrigger value="basic">基本</TabsTrigger>
          <TabsTrigger value="file">文件</TabsTrigger>
          <TabsTrigger value="filter">过滤</TabsTrigger>
          <TabsTrigger value="process">处理</TabsTrigger>
          <TabsTrigger value="download">下载</TabsTrigger>
          <TabsTrigger value="other">其他</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="grid gap-4">
          <FormRow label="名称" required>
            <Input value={formValue.name ?? ''} onChange={(event) => updateRoot('name', event.target.value)} />
          </FormRow>
          <FormRow label="源" required>
            <ComponentSelector type="source" value={formValue.source} onChange={(next) => updateRoot('source', typeof next === 'string' ? next : undefined)} />
          </FormRow>
          <FormRow label="触发器">
            <ComponentSelector type="trigger" multiple value={formValue.triggers ?? []} onChange={(next) => updateRoot('triggers', Array.isArray(next) ? next : [])} />
          </FormRow>
          <FormRow label="文件解析器" required>
            <ComponentSelector type="itemFileResolver" value={formValue.itemFileResolver} onChange={(next) => updateRoot('itemFileResolver', typeof next === 'string' ? next : undefined)} />
          </FormRow>
          <FormRow label="下载器" required>
            <ComponentSelector type="downloader" value={formValue.downloader} onChange={(next) => updateRoot('downloader', typeof next === 'string' ? next : undefined)} />
          </FormRow>
          <FormRow label="移动器" required>
            <ComponentSelector type="fileMover" value={formValue.fileMover} onChange={(next) => updateRoot('fileMover', typeof next === 'string' ? next : undefined)} />
          </FormRow>
          <FormRow label="保存路径" required>
            <Input value={formValue.savePath ?? ''} onChange={(event) => updateRoot('savePath', event.target.value)} />
          </FormRow>
          <FormRow label="开启" required>
            <Switch checked={Boolean(formValue.enabled)} onCheckedChange={(checked) => updateRoot('enabled', checked)} />
          </FormRow>
          <FormRow label="类目">
            <Input value={formValue.category ?? ''} onChange={(event) => updateRoot('category', event.target.value)} />
          </FormRow>
          <FormRow label="标签">
            <DynamicTag value={formValue.tags ?? []} onChange={(next) => updateRoot('tags', next)} />
          </FormRow>
        </TabsContent>

        <TabsContent value="file" className="grid gap-4">
          <FormRow label="目标路径模版">
            <Input value={String(formValue.options.savePathPattern ?? '')} onChange={(event) => updateOptions('savePathPattern', event.target.value)} />
          </FormRow>
          <FormRow label="目标文件名模版">
            <Input value={String(formValue.options.filenamePattern ?? '')} onChange={(event) => updateOptions('filenamePattern', event.target.value)} />
          </FormRow>
          <FormRow label="文件标签器">
            <ComponentSelector type="tagger" multiple value={formValue.options.fileTaggers ?? []} onChange={(next) => updateOptions('fileTaggers', Array.isArray(next) ? next : [])} />
          </FormRow>
          <FormRow label="变量提供">
            <ComponentSelector type="variableProvider" multiple value={formValue.options.variableProviders ?? []} onChange={(next) => updateOptions('variableProviders', Array.isArray(next) ? next : [])} />
          </FormRow>
          <FormRow label="变量替换">
            <ComponentSelector type="variableReplacer" multiple value={formValue.options.variableReplacers ?? []} onChange={(next) => updateOptions('variableReplacers', Array.isArray(next) ? next : [])} />
          </FormRow>
          <FormRow label="变量错误策略">
            <SingleSelect options={variableErrorStrategyOptions} value={formValue.options.variableErrorStrategy} onChange={(next) => updateOptions('variableErrorStrategy', next)} placeholder="Select" />
          </FormRow>
          <FormRow label="变量冲突策略">
            <SingleSelect options={variableConflictStrategyOptions} value={formValue.options.variableConflictStrategy} onChange={(next) => updateOptions('variableConflictStrategy', next)} placeholder="Select" />
          </FormRow>
          <FormRow label="文件存在">
            <ComponentSelector type="fileExistsDetector" value={formValue.options.fileExistsDetector} onChange={(next) => updateOptions('fileExistsDetector', typeof next === 'string' ? next : undefined)} />
          </FormRow>
          <FormRow label="文件替换">
            <ComponentSelector type="fileReplacementDecider" value={formValue.options.fileReplacementDecider} onChange={(next) => updateOptions('fileReplacementDecider', typeof next === 'string' ? next : undefined)} />
          </FormRow>
          <FormRow label="Windows路径字符替换">
            <Switch checked={Boolean(formValue.options.supportWindowsPlatformPath)} onCheckedChange={(checked) => updateOptions('supportWindowsPlatformPath', checked)} />
          </FormRow>
        </TabsContent>

        <TabsContent value="filter" className="grid gap-4">
          <FormRow label="条目过滤">
            <ComponentSelector type="sourceItemFilter" multiple value={formValue.options.sourceItemFilters ?? []} onChange={(next) => updateOptions('sourceItemFilters', Array.isArray(next) ? next : [])} />
          </FormRow>
          <FormRow label="文件过滤">
            <ComponentSelector type="fileContentFilter" multiple value={formValue.options.fileContentFilters ?? []} onChange={(next) => updateOptions('fileContentFilters', Array.isArray(next) ? next : [])} />
          </FormRow>
          <FormRow label="条目内容过滤">
            <ComponentSelector type="itemContentFilter" multiple value={formValue.options.itemContentFilters ?? []} onChange={(next) => updateOptions('itemContentFilters', Array.isArray(next) ? next : [])} />
          </FormRow>
          <FormRow label="条目表达式排除" />
          <FormRow label="条目表达式包含" />
          <FormRow label="条目内容表达式排除" />
          <FormRow label="条目内容表达式包含" />
          <FormRow label="文件表达式排除" />
          <FormRow label="文件表达式包含" />
        </TabsContent>

        <TabsContent value="process" className="grid gap-4">
          <FormRow label="监听">
            <ComponentSelector type="process-listener" multiple value={formValue.options.processListeners ?? []} onChange={(next) => updateOptions('processListeners', Array.isArray(next) ? next : [])} />
          </FormRow>
          <FormRow label="重命名间隔">
            <Input value={String(formValue.options.renameTaskInterval ?? '')} onChange={(event) => updateOptions('renameTaskInterval', event.target.value)} placeholder="PT5M" />
          </FormRow>
          <FormRow label="重命名次数阈值">
            <Input type="number" value={String(formValue.options.renameTimesThreshold ?? '')} onChange={(event) => updateOptions('renameTimesThreshold', event.target.value)} placeholder="3" />
          </FormRow>
          <FormRow label="保存处理内容">
            <Switch checked={Boolean(formValue.options.saveProcessingContent)} onCheckedChange={(checked) => updateOptions('saveProcessingContent', checked)} />
          </FormRow>
          <FormRow label="条目获取数限制">
            <Input type="number" value={String(formValue.options.fetchLimit ?? '')} onChange={(event) => updateOptions('fetchLimit', event.target.value)} placeholder="50" />
          </FormRow>
          <FormRow label="指针批量模式">
            <Switch checked={Boolean(formValue.options.pointerBatchMode)} onCheckedChange={(checked) => updateOptions('pointerBatchMode', checked)} />
          </FormRow>
          <FormRow label="条目异常继续">
            <Switch checked={Boolean(formValue.options.itemErrorContinue)} onCheckedChange={(checked) => updateOptions('itemErrorContinue', checked)} />
          </FormRow>
          <FormRow label="更新条目文件夹时间">
            <Switch checked={Boolean(formValue.options.touchItemDirectory)} onCheckedChange={(checked) => updateOptions('touchItemDirectory', checked)} />
          </FormRow>
          <FormRow label="清理条目空文件夹">
            <Switch checked={Boolean(formValue.options.deleteEmptyDirectory)} onCheckedChange={(checked) => updateOptions('deleteEmptyDirectory', checked)} />
          </FormRow>
          <FormRow label="条目重试间隔毫秒">
            <Input type="number" min={1} value={String(formValue.options.retryBackoffMills ?? '')} onChange={(event) => updateOptions('retryBackoffMills', event.target.value)} placeholder="5000" />
          </FormRow>
          <FormRow label="并行数">
            <Input type="number" min={1} max={10} value={String(formValue.options.parallelism ?? '')} onChange={(event) => updateOptions('parallelism', event.target.value)} placeholder="1" />
          </FormRow>
          <FormRow label="任务分组">
            <Input value={String(formValue.options.taskGroup ?? '')} onChange={(event) => updateOptions('taskGroup', event.target.value)} />
          </FormRow>
        </TabsContent>

        <TabsContent value="download" className="grid gap-4">
          <FormRow label="类目">
            <Input value={String(formValue.options.downloadOptions.category ?? '')} onChange={(event) => updateDownloadOptions('category', event.target.value)} />
          </FormRow>
          <FormRow label="标签">
            <DynamicTag value={formValue.options.downloadOptions.tags ?? []} onChange={(next) => updateDownloadOptions('tags', next)} />
          </FormRow>
          <FormRow label="请求头" />
        </TabsContent>

        <TabsContent value="other" className="grid gap-4">
          <FormRow label="表达式类型">
            <SingleSelect options={expressionOptions} value={formValue.options.expression} onChange={(next) => updateOptions('expression', next)} placeholder="CEL" />
          </FormRow>
        </TabsContent>
      </Tabs>

      <Button type="button" onClick={() => console.log('提交数据', formValue)}>
        确定
      </Button>
    </div>
  )
}
