import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ArrowUp, Check, ChevronDown, CircleAlert, LoaderCircle, MessageSquare, Plus, Settings2, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AgentModelSettings } from '@/components/agent-model-settings'
import { agentService, type AgentEvent, type AgentSession, type AgentSettings } from '@/services/data.service'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { cn } from '@/lib/utils'

function MarkdownText({ text }: { text: string }) {
  return <div className="min-w-0 break-words text-sm leading-7 [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:pl-4 [&_code]:break-all [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_h1]:mb-3 [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:mb-2 [&_h2]:font-semibold [&_h3]:font-medium [&_li]:ml-5 [&_ol]:list-decimal [&_p]:mb-3 [&_p:last-child]:mb-0 [&_pre]:my-3 [&_pre]:overflow-auto [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-3 [&_table]:block [&_table]:overflow-x-auto [&_td]:border [&_td]:p-2 [&_th]:border [&_th]:p-2 [&_ul]:list-disc"><Markdown remarkPlugins={[remarkGfm]}>{text}</Markdown></div>
}

function ConfigDetail({ title, value }: { title: string; value: unknown }) {
  return <details className="group min-w-0 border-t py-3">
    <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"><span className="break-all">{title}</span><ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" /></summary>
    <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-all rounded-md bg-muted/60 p-3 text-xs leading-6">{JSON.stringify(value, null, 2)}</pre>
  </details>
}

function Review({ session, busy, onApprove, onRevise }: { session: AgentSession; busy: boolean; onApprove: () => void; onRevise: () => void }) {
  const plan = session.plan
  if (!plan) return null
  const canApprove = session.status === 'review' || session.status === 'failed'
  return <section aria-label="配置方案 Review" className="min-w-0 rounded-xl border bg-background p-4 sm:p-6">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold">{session.status === 'complete' ? '配置已创建' : '检查完整方案'}</h2><span className="text-xs text-muted-foreground">方案 v{session.revision}</span></div>
    <MarkdownText text={plan.summary} />
    <div className="my-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground"><span>新增 {plan.instances.length} 个实例</span><span>新增 {plan.components.length} 个组件</span><span>新增 {plan.processors.length} 个处理器</span></div>
    {plan.instances.map(value => <ConfigDetail key={`i-${value.name}`} title={`实例 · ${value.name}`} value={value} />)}
    {plan.components.map(value => <ConfigDetail key={`c-${value.rootType}-${value.name}`} title={`组件 · ${value.rootType} / ${value.typeName}:${value.name}`} value={value} />)}
    {plan.processors.map((value, index) => <div key={`p-${index}`}>
      <ConfigDetail title={`处理器 · ${String(value.name)} · 默认启用`} value={value} />
      <dl className="mb-3 grid gap-2 text-xs sm:grid-cols-[5rem_1fr]">
        <dt className="text-muted-foreground">来源</dt><dd className="break-all">{String(value.source)}</dd>
        <dt className="text-muted-foreground">保存目录</dt><dd className="break-all">{String(value['save-path'])}</dd>
        <dt className="text-muted-foreground">下载 / 整理</dt><dd className="break-all">{String(value.downloader)} / {String(value['file-mover'])}</dd>
        <dt className="text-muted-foreground">触发器</dt><dd className="break-all">{Array.isArray(value.triggers) && value.triggers.length ? value.triggers.join('、') : '手动触发'}</dd>
      </dl>
    </div>)}
    {session.steps.length > 0 && <ol aria-label="创建进度" className="my-4 space-y-3 border-t pt-4">
      {session.steps.map(step => <li key={step.name} className="flex items-start gap-2 text-sm">
        {step.status === 'done' ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" /> : step.status === 'running' ? <LoaderCircle className="mt-0.5 h-4 w-4 shrink-0 animate-spin" /> : step.status === 'failed' ? <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" /> : <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-muted-foreground/40" />}
        <div className="min-w-0"><span className="break-all">{step.name}</span><span className="ml-2 text-xs text-muted-foreground">{{ pending: '等待创建', running: '创建中', done: '已完成', failed: '失败' }[step.status]}</span>{step.error && <p className="mt-1 break-words text-xs text-destructive">{step.error}</p>}</div>
      </li>)}
    </ol>}
    {canApprove && <div className="mt-4 border-t pt-4">
      <p className="mb-4 text-xs leading-5 text-muted-foreground">确认后依次创建实例、组件和处理器。处理器默认启用，触发器可能开始下载或整理文件。凭据引用由后端填入；远程连接和文件权限将在实际创建或运行时检查。</p>
      <div className="flex flex-wrap gap-2"><Button disabled={busy} onClick={onApprove}>{session.status === 'failed' ? '重试未完成的创建' : '确认方案并创建'}</Button><Button variant="outline" disabled={busy} onClick={onRevise}>继续修改</Button></div>
    </div>}
    {session.status === 'complete' && <div className="mt-4 flex flex-wrap gap-4 border-t pt-4 text-sm"><Link className="underline underline-offset-4" to="/processor">查看处理器</Link><Link className="underline underline-offset-4" to="/component">查看组件</Link></div>}
  </section>
}

export function AgentPage() {
  useDocumentTitle('配置助手')
  const [session, setSession] = useState<AgentSession | null>(null)
  const [settings, setSettings] = useState<AgentSettings | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [executing, setExecuting] = useState(false)
  const [delta, setDelta] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const controller = useRef<AbortController | null>(null)
  const sessionId = useRef<string | null>(null)
  const bottom = useRef<HTMLDivElement>(null)
  const composer = useRef<HTMLTextAreaElement>(null)
  const scrollArea = useRef<HTMLDivElement>(null)
  const follow = useRef(true)
  const mounted = useRef(false)

  useEffect(() => {
    mounted.current = true
    let active = true
    let ownId: string | null = null
    agentService.createSession().then(value => {
      if (!active) { void agentService.closeSession(value.id).catch(() => {}); return }
      ownId = value.id; sessionId.current = value.id; setSession(value)
    }).catch(() => { if (active) setError('无法连接配置助手，请检查后端服务') })
    agentService.settings().then(value => { if (active) { setSettings(value); if (!value.model) setSettingsOpen(true) } }).catch(() => {})
    return () => {
      active = false; mounted.current = false; controller.current?.abort()
      if (ownId) void agentService.closeSession(ownId).catch(() => {})
      if (sessionId.current && sessionId.current !== ownId) void agentService.closeSession(sessionId.current).catch(() => {})
    }
  }, [])

  useEffect(() => {
    if (follow.current) bottom.current?.scrollIntoView({ behavior: 'instant', block: 'end' })
  }, [session, delta, status, error])

  const receive = useCallback((event: AgentEvent) => {
    if (!mounted.current) return
    if (event.type === 'delta') setDelta(value => value + event.text)
    if (event.type === 'status') setStatus(event.text)
    if (event.type === 'session') { setSession(event.session); setDelta(''); setAnswers({}) }
    if (event.type === 'error') setError(event.message)
  }, [])

  async function run(approve = false, text = input, answerValues = answers) {
    if (!session || busy || session.status === 'executing') return
    if (!approve && !settings?.model) { setSettingsOpen(true); return }
    if (!approve && !text.trim() && !Object.keys(answerValues).length) return
    const requestSession = session
    const abort = new AbortController()
    controller.current = abort
    setBusy(true); setExecuting(approve); setError(''); setDelta(''); setStatus(approve ? '正在创建配置' : '正在理解需求'); follow.current = true
    try {
      if (approve) await agentService.approve(requestSession.id, requestSession.revision, abort.signal, receive)
      else { setInput(''); await agentService.chat(requestSession.id, text, answerValues, abort.signal, receive) }
    } catch (error) {
      if (!mounted.current) return
      if (error instanceof DOMException && error.name === 'AbortError') { setStatus('已停止生成') }
      else { setError(error instanceof Error ? error.message : '请求失败'); if (!approve) setInput(text) }
      // The server finishes cancellation or creation independently; refresh on demand.
    } finally {
      if (mounted.current) { setBusy(false); setExecuting(false); setDelta(''); setStatus('') }
      controller.current = null
    }
  }

  async function newChat() {
    if (busy || session?.status === 'executing') return
    setError('')
    try {
      const previous = sessionId.current
      const next = await agentService.createSession()
      sessionId.current = next.id; setSession(next); setInput(''); setAnswers({}); setDelta('')
      if (previous) await agentService.closeSession(previous)
    } catch { setError('无法开始新对话') }
  }

  const examples = ['从 Mikan 订阅下载新番，按季度整理到媒体库', '整理本地动画，保留字幕并区分 SP 和 OVA', '下载 Fanbox 内容，按作者和帖子分类']
  return <div className="flex h-full min-h-[24rem] min-w-0 flex-col">
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b pb-3">
      <div><h1 className="text-base font-semibold">配置助手</h1><p className="mt-1 text-xs text-muted-foreground">一次性对话 · 离开或刷新后不保留</p></div>
      <div className="flex items-center gap-1"><Button variant="ghost" size="sm" onClick={() => setSettingsOpen(true)} disabled={busy}><Settings2 className="h-4 w-4" /><span className="hidden sm:inline">{settings?.model || '模型连接'}</span><span className="sm:hidden">模型</span></Button><Button variant="outline" size="sm" onClick={newChat} disabled={busy || session?.status === 'executing'}><Plus className="h-4 w-4" />新对话</Button></div>
    </div>
    <div ref={scrollArea} className="min-h-0 flex-1 overflow-y-auto overscroll-contain" onScroll={() => {
      const area = scrollArea.current
      if (area) follow.current = area.scrollHeight - area.scrollTop - area.clientHeight < 120
    }}>
      <div className="mx-auto w-full max-w-3xl space-y-6 px-1 py-6 sm:px-4">
        {session?.messages.length === 0 && <div className="py-8 sm:py-16">
          <MessageSquare className="mb-5 h-7 w-7 text-muted-foreground" />
          <h2 className="text-2xl font-medium tracking-tight">你想怎样下载或整理文件？</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">描述目标，补充必要信息。检查完整方案后，再创建组件和处理器。</p>
          <div className="mt-8 divide-y border-y">{examples.map(text => <button key={text} disabled={busy} onClick={() => { setInput(text); composer.current?.focus() }} className="flex w-full items-center justify-between gap-3 py-4 text-left text-sm transition-colors hover:text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"><span>{text}</span><ArrowUp className="h-4 w-4 shrink-0 rotate-45" /></button>)}</div>
        </div>}
        {!session && !error && <p className="py-12 text-center text-sm text-muted-foreground">正在连接…</p>}
        {session?.messages.map((message, index) => <div key={index} className={cn('min-w-0', message.role === 'user' && 'ml-auto max-w-[90%] rounded-2xl bg-muted px-4 py-3', message.role === 'tool' && 'flex items-start gap-2 text-xs text-muted-foreground', message.role === 'error' && 'text-destructive')}>
          {message.role === 'tool' ? <><Check className="mt-0.5 h-3 w-3 shrink-0" /><span className="break-words">{message.text}</span></> : message.role === 'user' ? <p className="whitespace-pre-wrap break-words text-sm leading-7">{message.text.replace(/\$secret:[\w-]+/g, '［已安全填写］')}</p> : <MarkdownText text={message.text} />}
        </div>)}
        {delta && <MarkdownText text={delta} />}
        {busy && <div role="status" className="flex items-center gap-2 text-xs text-muted-foreground"><LoaderCircle className="h-3.5 w-3.5 animate-spin" />{status || '正在处理…'}</div>}
        {session && session.questions.length > 0 && !busy && <form className="space-y-5 rounded-xl border p-4 sm:p-6" onSubmit={event => { event.preventDefault(); void run(false, '', answers) }}>
          <h2 className="font-medium">补充这些信息后继续</h2>
          {session.questions.map(question => <fieldset key={question.id} className="min-w-0 space-y-3"><legend className="mb-2 text-sm leading-6">{question.title}</legend>
            {question.options.length > 0 && <div className="flex flex-wrap gap-2">{question.options.map(option => <button key={option} type="button" aria-pressed={answers[question.id] === option} onClick={() => setAnswers(value => ({ ...value, [question.id]: option }))} className={cn('max-w-full whitespace-normal rounded-md border px-3 py-2 text-left text-sm hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring', answers[question.id] === option && 'border-primary bg-accent')}>{option}</button>)}</div>}
            <Input aria-label={question.title} required type={question.secret ? 'password' : 'text'} autoComplete={question.secret ? 'new-password' : 'off'} value={answers[question.id] ?? ''} onChange={event => setAnswers(value => ({ ...value, [question.id]: event.target.value }))} placeholder={question.secret ? '凭据只交给后端，模型使用引用' : question.options.length ? '也可以填写其他选择或说明' : '输入你的说明'} />
          </fieldset>)}
          <Button type="submit">提交并继续</Button>
        </form>}
        {session?.plan && <Review session={session} busy={busy} onApprove={() => void run(true)} onRevise={() => { setInput('我想调整方案：'); composer.current?.focus() }} />}
        {error && <div role="alert" className="rounded-md border border-destructive/30 p-3 text-sm"><p className="break-words text-destructive">{error}</p>{session && <Button variant="link" className="mt-1 h-auto px-0 py-1" disabled={busy} onClick={async () => { try { setSession(await agentService.session(session.id)); setError('') } catch { /* API interceptor shows the current error. */ } }}>刷新当前状态</Button>}</div>}
        <div ref={bottom} />
      </div>
    </div>
    <form className="mx-auto w-full max-w-3xl shrink-0 pt-3 sm:px-4" onSubmit={event => { event.preventDefault(); void run(false, input, {}) }}>
      <div className="rounded-xl border bg-background p-2 focus-within:ring-1 focus-within:ring-ring">
        <textarea ref={composer} rows={2} aria-label="描述你的配置需求" value={input} onChange={event => setInput(event.target.value)} disabled={busy || !session || session.status === 'executing'} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void run(false, input, {}) } }} placeholder="描述需求，或告诉我方案哪里需要调整…" className="max-h-40 min-h-16 w-full resize-y bg-transparent px-2 py-1 text-sm leading-6 outline-none placeholder:text-muted-foreground disabled:opacity-50" />
        <div className="flex items-center justify-between gap-3"><span className="pl-2 text-xs text-muted-foreground">{executing ? '正在执行已确认方案' : 'Enter 发送 · Shift + Enter 换行'}</span>{busy && !executing ? <Button type="button" size="icon" variant="outline" aria-label="停止生成" onClick={() => controller.current?.abort()}><Square className="h-4 w-4" /></Button> : <Button type="submit" size="icon" aria-label="发送消息" disabled={busy || !session || session.status === 'executing' || !input.trim()}><ArrowUp className="h-4 w-4" /></Button>}</div>
      </div>
    </form>
    <AgentModelSettings open={settingsOpen} onOpenChange={setSettingsOpen} onSaved={value => setSettings({ ...value, apiKey: undefined, hasApiKey: !!value.apiKey || value.hasApiKey })} />
  </div>
}
