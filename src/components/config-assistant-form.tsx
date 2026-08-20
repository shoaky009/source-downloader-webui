import { Bot, CheckCircle2, LoaderCircle, Sparkles, User } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  type AssistantQuestion,
  type AssistantNextActionResponse,
  type ConfigAssistantDraftResponse,
  type ConfigAssistantMissingField,
  aiAssistantService,
} from '@/services/data.service'

type ChatMessage =
  | { id: string; role: 'user'; kind: 'text'; content: string }
  | { id: string; role: 'assistant'; kind: 'text'; content: string }
  | { id: string; role: 'assistant'; kind: 'question'; question: AssistantQuestion }
  | { id: string; role: 'user'; kind: 'answer'; key: string; label: string; value: unknown }

interface AssistantPageState {
  sessionId?: string
  messages: ChatMessage[]
  input: string
  answers: Record<string, unknown>
  draft: ConfigAssistantDraftResponse | null
  currentQuestion: AssistantQuestion | null
  loading: boolean
}

function questionPromptOf(question: AssistantQuestion) {
  return question.title ?? question.question ?? question.label ?? question.key
}

function questionDescriptionOf(question: AssistantQuestion) {
  return question.description ?? question.label
}

function stringifyValue(value: unknown) {
  if (typeof value === 'string') {
    return value
  }

  if (typeof value === 'boolean') {
    return value ? '是' : '否'
  }

  if (Array.isArray(value)) {
    return value.join(', ')
  }

  if (value == null) {
    return ''
  }

  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function formatPreview(value: unknown) {
  if (value == null) {
    return '暂无'
  }

  if (typeof value === 'string') {
    return value
  }

  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function missingFieldKeyOf(field: string | ConfigAssistantMissingField) {
  return typeof field === 'string' ? field : field.key
}

function missingFieldLabelOf(field: string | ConfigAssistantMissingField) {
  if (typeof field === 'string') {
    return field
  }

  return field.label?.trim() || field.key
}

function missingFieldDescriptionOf(field: string | ConfigAssistantMissingField) {
  if (typeof field === 'string') {
    return ''
  }

  return field.description ?? ''
}

function sortOptions(question: AssistantQuestion) {
  return [...(question.options ?? [])].sort((left, right) => Number(Boolean(right.recommended)) - Number(Boolean(left.recommended)))
}

function getOptionLabel(question: AssistantQuestion, value: string) {
  const option = question.options?.find((item) => item.value === value)
  if (!option) {
    return value
  }

  return option.recommended ? `${option.label}（推荐）` : option.label
}

function buildMessageId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`
}

function replaceTrailingQuestion(messages: ChatMessage[]) {
  if (messages[messages.length - 1]?.kind === 'question') {
    return messages.slice(0, -1)
  }

  return messages
}

function applyAssistantResponseToMessages(messages: ChatMessage[], response: AssistantNextActionResponse) {
  const nextMessages = replaceTrailingQuestion(messages)

  if (response.content) {
    nextMessages.push({
      id: buildMessageId('assistant-text'),
      role: 'assistant',
      kind: 'text',
      content: response.content,
    })
  }

  if (response.askedQuestion) {
    nextMessages.push({
      id: buildMessageId('assistant-question'),
      role: 'assistant',
      kind: 'question',
      question: response.askedQuestion,
    })
  }

  return nextMessages
}

function answerSummary(question: AssistantQuestion, value: unknown) {
  if (typeof value === 'string') {
    return getOptionLabel(question, value)
  }

  return stringifyValue(value)
}

export function ConfigAssistantForm({
  onCreated,
}: {
  onCreated?: (processorName: string) => void
}) {
  const [state, setState] = useState<AssistantPageState>({
    messages: [],
    input: '',
    answers: {},
    draft: null,
    currentQuestion: null,
    loading: false,
  })
  const [questionInput, setQuestionInput] = useState('')
  const [customMode, setCustomMode] = useState(false)
  const [singleSelectValue, setSingleSelectValue] = useState<string>()
  const [multiSelectValue, setMultiSelectValue] = useState<string[]>([])
  const [booleanValue, setBooleanValue] = useState<boolean>()
  const [applying, setApplying] = useState(false)

  const currentQuestion = state.currentQuestion
  const optionList = currentQuestion ? sortOptions(currentQuestion) : []

  useEffect(() => {
    setQuestionInput('')
    setSingleSelectValue(undefined)
    setMultiSelectValue([])
    setBooleanValue(undefined)
    setCustomMode(false)
  }, [currentQuestion?.key])

  const sendDraftRequest = async ({
    input,
    answers,
    appendMessages,
  }: {
    input: string
    answers: Record<string, unknown>
    appendMessages: ChatMessage[]
  }) => {
    setState((current) => ({ ...current, loading: true }))
    try {
      const response = await aiAssistantService.draft({
        sessionId: state.sessionId,
        input,
        answers,
        draft: state.draft,
      })

      setState((current) => ({
        ...current,
        sessionId: response.sessionId ?? current.sessionId,
        answers,
        draft: response.draft,
        currentQuestion: response.askedQuestion ?? response.draft?.questions?.[0] ?? null,
        loading: false,
        input: '',
        messages: applyAssistantResponseToMessages([...replaceTrailingQuestion(current.messages), ...appendMessages], response),
      }))
    } catch (error) {
      setState((current) => ({ ...current, loading: false }))
      throw error
    }
  }

  const handleStartConversation = async () => {
    const input = state.input.trim()
    if (!input) {
      toast.error('请输入需求描述')
      return
    }

    const userMessage: ChatMessage = {
      id: buildMessageId('user-text'),
      role: 'user',
      kind: 'text',
      content: input,
    }

    await sendDraftRequest({ input, answers: {}, appendMessages: [userMessage] })
  }

  const handleAnswer = async (value: unknown) => {
    if (!currentQuestion) {
      return
    }

    const nextAnswers = { ...state.answers, [currentQuestion.key]: value }
    const answerMessage: ChatMessage = {
      id: buildMessageId('user-answer'),
      role: 'user',
      kind: 'answer',
      key: currentQuestion.key,
      label: questionPromptOf(currentQuestion),
      value,
    }

    await sendDraftRequest({ input: '', answers: nextAnswers, appendMessages: [answerMessage] })
  }

  const handleSubmitCurrentAnswer = async () => {
    if (!currentQuestion) {
      return
    }

    if (currentQuestion.type === 'TEXT') {
      const value = questionInput.trim()
      if (!value) {
        toast.error('请输入内容')
        return
      }
      await handleAnswer(value)
      return
    }

    if (currentQuestion.type === 'SINGLE_SELECT') {
      const value = customMode ? questionInput.trim() : singleSelectValue
      if (!value) {
        toast.error('请选择或输入一个答案')
        return
      }
      await handleAnswer(value)
      return
    }

    if (currentQuestion.type === 'BOOLEAN') {
      if (booleanValue == null) {
        toast.error('请选择是或否')
        return
      }
      await handleAnswer(booleanValue)
      return
    }

    if (currentQuestion.type === 'MULTI_SELECT') {
      if (multiSelectValue.length === 0) {
        toast.error('请至少选择一个选项')
        return
      }
      await handleAnswer(multiSelectValue)
      return
    }

    const value = questionInput.trim()
    if (!value) {
      toast.error('请输入内容')
      return
    }
    await handleAnswer(value)
  }

  const handleApply = async () => {
    if (!state.draft?.canApply) {
      return
    }

    setApplying(true)
    try {
      const result = await aiAssistantService.apply(state.sessionId, state.draft.draft)
      if (result.content) {
        setState((current) => ({
          ...current,
          sessionId: result.sessionId || current.sessionId,
          messages: [
            ...current.messages,
            {
              id: buildMessageId('assistant-text'),
              role: 'assistant',
              kind: 'text',
              content: result.content,
            },
          ],
        }))
      }
      onCreated?.(result.processorName)
    } finally {
      setApplying(false)
    }
  }

  const messageList = useMemo(() => state.messages, [state.messages])

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_360px]">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-primary" />
              AI 配置助手
            </CardTitle>
            <CardDescription>聊天区展示 AI 理解过程，当前问题区只保留本轮需要回答的一题。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              value={state.input}
              onChange={(event) => setState((current) => ({ ...current, input: event.target.value }))}
              placeholder="例如：每天下载一个频道文件到 /downloads"
              disabled={state.loading}
            />
            <div className="flex items-center gap-2">
              <Button type="button" onClick={() => void handleStartConversation()} disabled={state.loading}>
                {state.loading && messageList.length === 0 ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
                发送需求
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">聊天流</CardTitle>
            <CardDescription>展示用户输入、AI 回复、问题卡片和结构化回答。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {messageList.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                发送第一条需求后，AI 会返回理解说明、当前草稿和下一题。
              </div>
            ) : null}

            {messageList.map((message) => (
              <ChatMessageCard key={message.id} message={message} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bot className="h-4 w-4 text-primary" />
              当前问题
            </CardTitle>
            <CardDescription>
              {currentQuestion ? '只展示本轮需要回答的一题，回答后立即重新请求 /api/ai/draft。' : '当前没有待回答的问题。'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentQuestion ? (
              <>
                <div>
                  <div className="font-medium">{questionPromptOf(currentQuestion)}</div>
                  {questionDescriptionOf(currentQuestion) ? (
                    <div className="mt-1 text-sm text-muted-foreground">{questionDescriptionOf(currentQuestion)}</div>
                  ) : null}
                </div>

                {currentQuestion.type === 'TEXT' ? (
                  <Input
                    value={questionInput}
                    onChange={(event) => setQuestionInput(event.target.value)}
                    placeholder={currentQuestion.placeholder ?? '请输入'}
                    disabled={state.loading}
                  />
                ) : null}

                {currentQuestion.type === 'SINGLE_SELECT' ? (
                  <div className="space-y-3">
                    <div className="grid gap-2">
                      {optionList.map((option) => {
                        const selected = !customMode && singleSelectValue === option.value
                        return (
                          <button
                            key={option.value}
                            type="button"
                            className={cn(
                              'rounded-lg border p-3 text-left transition-colors',
                              selected && 'border-primary bg-primary/5',
                              option.disabled && 'cursor-not-allowed opacity-50',
                            )}
                            disabled={option.disabled || state.loading}
                            onClick={() => {
                              setCustomMode(false)
                              setSingleSelectValue(option.value)
                            }}
                          >
                            <div className="flex items-center gap-2 text-sm font-medium">
                              {getOptionLabel(currentQuestion, option.value)}
                              {option.disabled ? <Badge variant="outline">不可用</Badge> : null}
                            </div>
                            {option.description ? <div className="mt-1 text-xs text-muted-foreground">{option.description}</div> : null}
                          </button>
                        )
                      })}
                    </div>

                    {currentQuestion.customAllowed ? (
                      <div className="space-y-2 rounded-lg border border-dashed p-3">
                        <Button
                          type="button"
                          variant={customMode ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCustomMode((current) => !current)}
                          disabled={state.loading}
                        >
                          自定义输入
                        </Button>
                        {customMode ? (
                          <Input
                            value={questionInput}
                            onChange={(event) => setQuestionInput(event.target.value)}
                            placeholder={currentQuestion.placeholder ?? '输入自定义值'}
                            disabled={state.loading}
                          />
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {currentQuestion.type === 'BOOLEAN' ? (
                  <div className="grid grid-cols-2 gap-2">
                    {[true, false].map((value) => {
                      const selected = booleanValue === value
                      return (
                        <Button
                          key={String(value)}
                          type="button"
                          variant={selected ? 'default' : 'outline'}
                          onClick={() => setBooleanValue(value)}
                          disabled={state.loading}
                        >
                          {value ? '是' : '否'}
                        </Button>
                      )
                    })}
                  </div>
                ) : null}

                {currentQuestion.type === 'MULTI_SELECT' ? (
                  <div className="space-y-2">
                    {optionList.map((option) => {
                      const checked = multiSelectValue.includes(option.value)
                      return (
                        <label
                          key={option.value}
                          className={cn(
                            'flex items-start gap-3 rounded-lg border p-3',
                            option.disabled && 'cursor-not-allowed opacity-50',
                          )}
                        >
                          <Checkbox
                            checked={checked}
                            disabled={option.disabled || state.loading}
                            onCheckedChange={(next) => {
                              if (next) {
                                setMultiSelectValue((current) => [...current, option.value])
                              } else {
                                setMultiSelectValue((current) => current.filter((item) => item !== option.value))
                              }
                            }}
                          />
                          <div className="space-y-1">
                            <div className="text-sm font-medium">{getOptionLabel(currentQuestion, option.value)}</div>
                            {option.description ? <div className="text-xs text-muted-foreground">{option.description}</div> : null}
                          </div>
                        </label>
                      )
                    })}
                  </div>
                ) : null}

                {!['TEXT', 'SINGLE_SELECT', 'BOOLEAN', 'MULTI_SELECT'].includes(currentQuestion.type) ? (
                  <Input
                    value={questionInput}
                    onChange={(event) => setQuestionInput(event.target.value)}
                    placeholder={currentQuestion.placeholder ?? '请输入'}
                    disabled={state.loading}
                  />
                ) : null}

                <Button type="button" onClick={() => void handleSubmitCurrentAnswer()} disabled={state.loading}>
                  {state.loading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
                  提交本题答案
                </Button>
              </>
            ) : (
              <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
                {state.draft?.canApply ? '当前草稿已经可创建，可以直接确认。' : '等待你发送需求，或等待服务端继续提问。'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">草稿预览</CardTitle>
            <CardDescription>同时展示结构化草稿，方便确认 AI 当前要创建什么。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <div className="mb-2 font-medium">会话状态</div>
              <div className="flex flex-wrap gap-2">
                {state.sessionId ? <Badge variant="outline">session 已建立</Badge> : <Badge variant="secondary">未开始</Badge>}
                {state.draft?.canApply ? <Badge>可创建</Badge> : <Badge variant="secondary">待补全</Badge>}
                {state.loading ? <Badge variant="outline">推导中</Badge> : null}
              </div>
            </div>

            {state.draft?.missingFields?.length ? (
              <div>
                <div className="mb-2 font-medium">缺失字段</div>
                <div className="space-y-2">
                  {state.draft.missingFields.map((field) => (
                    <div key={missingFieldKeyOf(field)} className="rounded-lg border bg-muted/30 px-3 py-2">
                      <div className="text-sm font-medium">{missingFieldLabelOf(field)}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{missingFieldKeyOf(field)}</div>
                      {missingFieldDescriptionOf(field) ? (
                        <div className="mt-1 text-xs text-muted-foreground">{missingFieldDescriptionOf(field)}</div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <PreviewBlock title="selectedComponentTypes" value={state.draft?.draft.selectedComponentTypes} />
            <PreviewBlock title="componentDrafts" value={state.draft?.draft.componentDrafts} />
            <PreviewBlock title="processorDraft" value={state.draft?.draft.processorDraft} />

            <Button
              type="button"
              className="w-full"
              disabled={!state.draft?.canApply || state.loading || applying}
              onClick={() => void handleApply()}
            >
              {applying ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
              确认创建
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ChatMessageCard({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-xl border p-3',
          isUser ? 'border-primary/20 bg-primary/5' : 'bg-card',
        )}
      >
        <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
          {isUser ? '用户' : 'AI'}
        </div>

        {message.kind === 'text' ? <div className="whitespace-pre-wrap text-sm">{message.content}</div> : null}

        {message.kind === 'question' ? (
          <div className="space-y-2 text-sm">
            <div className="font-medium">{questionPromptOf(message.question)}</div>
            {questionDescriptionOf(message.question) ? (
              <div className="text-muted-foreground">{questionDescriptionOf(message.question)}</div>
            ) : null}
          </div>
        ) : null}

        {message.kind === 'answer' ? (
          <div className="space-y-1 text-sm">
            <div className="font-medium">{message.label}</div>
            <div className="text-muted-foreground">{answerSummary({ key: message.key, type: 'TEXT' }, message.value)}</div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function PreviewBlock({ title, value }: { title: string; value: unknown }) {
  return (
    <div>
      <div className="mb-2 font-medium">{title}</div>
      <pre className="overflow-auto rounded-lg border bg-muted/30 p-3 text-xs leading-5 text-muted-foreground">
        {formatPreview(value)}
      </pre>
    </div>
  )
}
