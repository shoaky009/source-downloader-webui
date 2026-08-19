import axios, { AxiosError, AxiosResponse } from 'axios'
import { toast } from 'sonner'

const isDev = () => import.meta.env.MODE === 'development'
const API_BASE_URL = () => (isDev() ? import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080' : `${location.origin}`)

const instance = axios.create({
  baseURL: API_BASE_URL(),
})

declare module 'axios' {
  export interface AxiosRequestConfig {
    alertMessage?: string
  }
}

instance.interceptors.response.use(
  (response) => {
    if (response.config.alertMessage) {
      toast.success(response.config.alertMessage)
    }
    return response
  },
  (error: AxiosError<{ detail?: string }>) => {
    toast.error(error.response?.data?.detail ?? error.message)
    return Promise.reject(error)
  },
)

export interface ScrollResponse<T> {
  contents: T[]
  nextMaxId: number
}

export interface ProcessingContent {
  id: number
  processorName: string
  itemHash: string
  itemIdentity: string | null
  itemContent: ItemContent
  status: string
  renameTimes: number
  failureReason: string | null
  createdAt: string
  updatedAt: string | null
}
export interface ProcessingContentSummary extends Omit<ProcessingContent, 'itemContent'> {
  itemContent: ItemContentSummary
}


export interface SourceItem {
  title: string
  link: string
  datetime: string
  contentType: string
  downloadUri: string
  attrs: Record<string, unknown>
  tags: string[]
  identity: string | null
}

export interface DryRunError {
  message: string
  kind: 'retryable' | 'nonRetryable'
  skippable: boolean
}

export interface DryRunSummary {
  succeeded: number
  failed: number
  stopped: boolean
}

export type DryRunEvent =
  | { type: 'item'; content: ProcessingContent }
  | {
      type: 'itemError'
      itemHash: string
      item: SourceItem
      error: DryRunError
      action: 'continue' | 'stop'
    }
  | { type: 'complete'; summary: DryRunSummary }
  | { type: 'runError'; error: DryRunError }

function normalizeStatus(status: string): string {
  return status.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase()
}

export function normalizeProcessingContent(content: ProcessingContent): ProcessingContent {
  return {
    ...content,
    status: normalizeStatus(content.status),
    itemContent: {
      ...content.itemContent,
      fileContents: content.itemContent.fileContents.map((file) => ({
        ...file,
        status: normalizeStatus(file.status),
      })),
    },
  }
}

export function normalizeDryRunEvent(event: DryRunEvent): DryRunEvent {
  if (event.type !== 'item') {
    return event
  }

  return { ...event, content: normalizeProcessingContent(event.content) }
}

export interface ItemContentSummary {
  sourceItem: SourceItem
  itemVariables: Record<string, unknown>
}

export interface ItemContent extends ItemContentSummary {
  fileContents: FileContent[]
}

export interface FileContent {
  downloadPath: string
  fileDownloadPath: string
  sourceSavePath: string
  targetSavePath: string
  targetFilename: string
  fileSavePathPattern: string
  filenamePattern: string
  patternVariables: Record<string, unknown>
  processedVariables: Record<string, unknown> | null
  attrs: Record<string, unknown>
  tags: string[]
  errors: string[]
  status: string
  fileUri: string | null
  existTargetPath: string | null
}

export interface Processor {
  name: string
  category: string | null
  tags: string[]
  enabled: boolean
  runtime: ProcessorRuntime | null
  errorMessage: string | null
}

export interface ProcessorRuntime {
  createdAt: string
  lastStartProcessTime: string | null
  lastEndProcessTime: string | null
  lastProcessFailedMessage: string | null
}

export type ProcessorRunKind =
  | 'automatic'
  | 'scheduledFull'
  | 'manualFull'
  | 'items'
  | 'rename'
  | 'reprocess'
  | 'dryRunCollected'
  | 'dryRunStreamed'

export type ProcessorRunStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled'

export type ProcessorRunStage = 'initializing' | 'fetchingItems' | 'scanningItems' | 'processingItems' | 'finalizing'

export type ProcessorItemStage =
  | 'filteringItem'
  | 'resolvingVariables'
  | 'resolvingFiles'
  | 'buildingTargets'
  | 'filteringContent'
  | 'checkingFiles'
  | 'decidingReplacements'
  | 'submittingDownload'
  | 'movingFiles'
  | 'replacingFiles'
  | 'awaitingSettlement'
  | 'persisting'
  | 'notifying'

export interface ActiveProcessorItem {
  title: string
  stage: ProcessorItemStage
  startedAt: string
}

export interface ProcessorRunProgress {
  totalItems?: number
  completedItems: number
  activeItems: Record<string, ActiveProcessorItem>
}

export interface ProcessorRun {
  id: number
  processorName: string
  kind: ProcessorRunKind
  status: ProcessorRunStatus
  stage?: ProcessorRunStage
  progress: ProcessorRunProgress
  createdAt: string
  startedAt?: string
  finishedAt?: string
  failure?: string
}

export type ProcessorRunEvent =
  | { type: 'resync'; runs: ProcessorRun[] }
  | { type: 'created'; run: ProcessorRun }
  | { type: 'started'; runId: number; startedAt: string }
  | { type: 'runStageChanged'; runId: number; stage: ProcessorRunStage }
  | { type: 'totalItemsChanged'; runId: number; totalItems: number }
  | { type: 'itemStarted'; runId: number; itemId: number; item: ActiveProcessorItem }
  | { type: 'itemStageChanged'; runId: number; itemId: number; stage: ProcessorItemStage }
  | { type: 'itemCompleted'; runId: number; itemId: number; completedItems: number }
  | { type: 'finished'; runId: number; status: ProcessorRunStatus; finishedAt: string; failure?: string }

export interface Component {
  type: string
  name: string
  typeName: string
  props: Record<string, unknown>
  stateDetail: unknown
  primary: boolean
  errorMessage: string
  refs?: string[]
}

export interface ConfigAssistantQuestionOption {
  label: string
  value: string
  description?: string
  recommended?: boolean
  disabled?: boolean
}

export interface AssistantQuestion {
  key: string
  type: 'TEXT' | 'SINGLE_SELECT' | 'BOOLEAN' | 'MULTI_SELECT' | string
  title?: string
  question?: string
  label?: string
  description?: string
  placeholder?: string
  customAllowed?: boolean
  options?: ConfigAssistantQuestionOption[]
}

export interface ConfigAssistantMissingField {
  key: string
  label?: string
  description?: string
}

export interface ConfigAssistantDraft {
  summary?: unknown
  selectedComponentTypes?: Record<string, string> | string[]
  componentDrafts?: unknown[]
  processorDraft?: unknown
  [key: string]: unknown
}

export interface ConfigAssistantDraftResponse {
  draft: ConfigAssistantDraft
  canApply: boolean
  missingFields: Array<string | ConfigAssistantMissingField>
  questions: AssistantQuestion[]
}

export interface AssistantNextActionResponse {
  sessionId?: string
  content: string
  draft: ConfigAssistantDraftResponse | null
  askedQuestion?: AssistantQuestion | null
  nextAction?: 'ASK_QUESTION' | 'APPLY' | 'ask' | 'confirm' | 'apply-ready' | string
}

export interface AiDraftRequest {
  sessionId?: string
  input: string
  answers: Record<string, unknown>
  draft?: ConfigAssistantDraftResponse | null
}

export interface AiApplyRequest {
  sessionId?: string
  draft: ConfigAssistantDraft
}

export interface AiApplyResponse {
  sessionId: string
  processorName: string
  content: string
}

class ProcessingContentService {
  async query(query: Record<string, string>): Promise<ScrollResponse<ProcessingContentSummary>> {
    const filteredQuery = Object.entries(query).reduce<Record<string, string>>((acc, [key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        acc[key] = value
      }
      return acc
    }, {})
    const params = new URLSearchParams(filteredQuery)
    const q = params.size === 0 ? '' : `?${params.toString()}`
    return instance
      .get(`/api/processing-content${q}`)
      .then((res: AxiosResponse<ScrollResponse<ProcessingContentSummary>>) => ({
        ...res.data,
        contents: res.data.contents.map((content) => ({ ...content, status: normalizeStatus(content.status) })),
      }))
  }
  async get(id: number): Promise<ProcessingContent> {
    return instance
      .get(`/api/processing-content/${id}`)
      .then((res: AxiosResponse<ProcessingContent>) => normalizeProcessingContent(res.data))
  }

  async update(id: number, data: ProcessingContent): Promise<ProcessingContent> {
    return instance.put(`/api/processing-content/${id}`, data).then((res: AxiosResponse<ProcessingContent>) => res.data)
  }

  async delete(id: number) {
    return instance.delete(`/api/processing-content/${id}`, { alertMessage: '删除成功' })
  }

  async reprocess(id: number) {
    return instance.post(`/api/processing-content/${id}/reprocess`, null, { alertMessage: '操作成功' })
  }
}

class ProcessorService {
  async query(): Promise<Processor[]> {
    return instance.get(`/api/processor`).then((res: AxiosResponse<Processor[]>) => res.data)
  }

  async create(data: unknown) {
    return instance.post(`/api/processor`, data, { alertMessage: '创建成功' })
  }

  async update(name: string, data: unknown): Promise<Processor> {
    return instance.put(`/api/processor/${name}`, data, { alertMessage: '更新成功' }).then((res: AxiosResponse<Processor>) => res.data)
  }

  async delete(name: string) {
    return instance.delete(`/api/processor/${name}`, { alertMessage: '删除成功' })
  }

  async reload(name: string) {
    return instance.post(`/api/processor/${name}/reload`, null, { alertMessage: '重载成功' })
  }

  async trigger(name: string) {
    return instance.get(`/api/processor/${name}/trigger`, { alertMessage: '修操成功' })
  }

  async rename(name: string) {
    return instance.get(`/api/processor/${name}/rename`, { alertMessage: '修操成功' })
  }

  async runs(processorName?: string): Promise<ProcessorRun[]> {
    return instance.get(`/api/processor/runs`).then((response: AxiosResponse<ProcessorRun[]>) => {
      const runs = response.data
      return processorName ? runs.filter((run) => run.processorName === processorName) : runs
    })
  }

  async run(id: number): Promise<ProcessorRun> {
    return instance.get(`/api/processor/runs/${id}`).then((response: AxiosResponse<ProcessorRun>) => response.data)
  }

  async cancelRun(id: number) {
    return instance.delete(`/api/processor/runs/${id}`, { alertMessage: '已请求取消运行' })
  }

  runStream(onEvent: (event: ProcessorRunEvent) => void) {
    const eventSource = new EventSource(`${API_BASE_URL()}/api/processor/runs/events`)
    eventSource.addEventListener('processor-run', ((event: MessageEvent<string>) => {
      onEvent(JSON.parse(event.data) as ProcessorRunEvent)
    }) as EventListener)
    return eventSource
  }

  async sourceState(name: string) {
    return instance.get(`/api/processor/${name}/state`)
  }

  async updateSourcePointer(name: string, state: object) {
    return instance.put(`/api/processor/${name}/pointer`, state, { alertMessage: '修改成功' })
  }

  async dryRun(name: string, options: object): Promise<DryRunEvent[]> {
    return instance
      .post(`/api/processor/${name}/dry-run`, options)
      .then((response: AxiosResponse<DryRunEvent[]>) => response.data.map(normalizeDryRunEvent))
  }

  async dryRunStream(name: string, options: object): Promise<Response> {
    const response = await fetch(
      `${API_BASE_URL()}/api/processor/${name}/dry-run-stream`,
      {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      },
    )
    if (!response.ok) {
      throw new Error('Failed to fetch dry run data')
    }
    return response
  }

  async enable(name: string) {
    return instance.post(`/api/processor/${name}/enable`, null, { alertMessage: '开启成功' })
  }

  async disable(name: string) {
    return instance.post(`/api/processor/${name}/disable`, null, { alertMessage: '关闭成功' })
  }

}

class ComponentService {
  async query(query: Record<string, string>): Promise<Component[]> {
    const params = new URLSearchParams(query)
    const q = params.size === 0 ? '' : `?${params.toString()}`
    return instance.get(`/api/component${q}`).then((res: AxiosResponse<Component[]>) => res.data)
  }

  async create(data: Component) {
    return instance.post(`/api/component`, data, { alertMessage: '创建成功' })
  }

  async delete(name: string) {
    return instance.delete(`/api/component/${name}`, { alertMessage: '删除成功' })
  }

  async reload(component: Component) {
    return instance.post(`/api/component/${component.type}/${component.typeName}/${component.name}/reload`, null, { alertMessage: '重载成功' })
  }

  async types(query: Record<string, string>) {
    const params = new URLSearchParams(query)
    const q = params.size === 0 ? '' : `?${params.toString()}`
    return instance.get(`/api/component/types${q}`)
  }

  async getComponentPropSchema(type: string, typeName: string) {
    return instance.get(`/api/component/${type}/${typeName}/metadata`)
  }

  stateStream(ids: string[], onEvent: (event: MessageEvent<string>) => void) {
    const eventSource = new EventSource(`${API_BASE_URL()}/api/component/state-stream?id=${ids.join(',')}`)
    eventSource.addEventListener('component-state', onEvent as EventListener)
    return eventSource
  }
}

class AiAssistantService {
  async draft(payload: AiDraftRequest): Promise<AssistantNextActionResponse> {
    return instance
      .post(`/api/ai/draft`, payload)
      .then((res: AxiosResponse<AssistantNextActionResponse>) => res.data)
  }

  async apply(sessionId: string | undefined, draft: ConfigAssistantDraft): Promise<AiApplyResponse> {
    return instance
      .post(`/api/ai/apply`, { sessionId, draft } satisfies AiApplyRequest, { alertMessage: '创建成功' })
      .then((res: AxiosResponse<AiApplyResponse>) => res.data)
  }
}

class ApplicationService {
  async reload() {
    return instance.post(`/api/application/reload`, null, { alertMessage: '重载成功' })
  }
}

class ActuatorService {
  async info() {
    return instance.get(`/actuator/info`)
  }
}

export interface TaggableStatus {
  label: string
  value: string
  type: 'primary' | 'success' | 'info' | 'warning' | 'danger'
}

export const fileContentStatuses: TaggableStatus[] = [
  { label: '正常', value: 'NORMAL', type: 'success' },
  { label: '未检测', value: 'UNDETECTED', type: 'info' },
  { label: '已下载', value: 'DOWNLOADED', type: 'info' },
  { label: '变量错误', value: 'VARIABLE_ERROR', type: 'danger' },
  { label: '已存在', value: 'TARGET_EXISTS', type: 'warning' },
  { label: '文件冲突', value: 'FILE_CONFLICT', type: 'danger' },
  { label: '准备替换', value: 'READY_REPLACE', type: 'info' },
  { label: '被替换', value: 'REPLACED', type: 'info' },
  { label: '已替换', value: 'REPLACE', type: 'info' },
]

const fileStatusMapping = fileContentStatuses.reduce<Record<string, TaggableStatus>>((acc, cur) => {
  acc[cur.value] = cur
  return acc
}, {})

export function fileStatusOf(status: string | undefined): TaggableStatus {
  return (status ? fileStatusMapping[status] : undefined) ?? {
    label: status ?? '未知',
    value: status ?? 'UNKNOWN',
    type: 'warning',
  }
}

export const processingContentStatuses: TaggableStatus[] = [
  { label: '等待命名', value: 'WAITING_TO_RENAME', type: 'primary' },
  { label: '已命名', value: 'RENAMED', type: 'success' },
  { label: '已过滤', value: 'FILTERED', type: 'info' },
  { label: '无文件', value: 'NO_FILES', type: 'info' },
  { label: '已取消', value: 'CANCELLED', type: 'info' },
  { label: '已存在', value: 'TARGET_ALREADY_EXISTS', type: 'warning' },
  { label: '下载失败', value: 'DOWNLOAD_FAILED', type: 'danger' },
  { label: '处理异常', value: 'FAILURE', type: 'danger' },
  { label: '初始', value: 'INIT', type: 'info' },
]

const itemStatusMapping = processingContentStatuses.reduce<Record<string, TaggableStatus>>((acc, cur) => {
  acc[cur.value] = cur
  return acc
}, {})

export function itemStatusOf(status: string | undefined): TaggableStatus {
  return (status ? itemStatusMapping[status] : undefined) ?? {
    label: status ?? '未知',
    value: status ?? 'UNKNOWN',
    type: 'warning',
  }
}

export function fileStatusGrouping(fileContents: FileContent[]): Map<TaggableStatus, number> {
  const grouping = new Map<string, number>()
  for (const { status } of fileContents) {
    grouping.set(status, (grouping.get(status) || 0) + 1)
  }

  const result = new Map<TaggableStatus, number>()
  for (const [key, value] of grouping) {
    result.set(fileStatusOf(key), value)
  }
  return result
}

export const processingContentService = new ProcessingContentService()
export const processorService = new ProcessorService()
export const componentService = new ComponentService()
export const aiAssistantService = new AiAssistantService()
export const applicationService = new ApplicationService()
export const actuatorService = new ActuatorService()
