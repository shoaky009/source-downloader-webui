import { ArrowDown, ArrowRight, FolderTree, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { AgentPlan } from '@/services/data.service'

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : []
}

function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value ? value : fallback
}

export function processorPreview(plan: AgentPlan, processor: Record<string, unknown>) {
  const options = record(processor.options)
  const source = plan.components.find(component => component.rootType === 'source' && `${component.typeName}:${component.name}` === processor.source)
  const triggers = strings(processor.triggers)
  const schedule = triggers.map(reference => {
    const trigger = plan.components.find(component => component.rootType === 'trigger' && `${component.typeName}:${component.name}` === reference)
    if (trigger?.typeName === 'fixed') return `${text(trigger.props.interval, '未指定间隔')} 执行一次${trigger.props['on-start-run-tasks'] === true ? ' · 启动时立即执行' : ' · 首次等待间隔结束'}`
    if (trigger?.typeName === 'cron') return `Cron ${text(trigger.props.expression)}（系统本地时区）`
    return `${reference}（沿用组件设置）`
  })
  const filters = [
    ['条目筛选', 'item-filters'], ['源文件筛选', 'source-file-filters'],
    ['文件内容筛选', 'file-content-filters'], ['条目内容筛选', 'item-content-filters'],
    ['条目排除条件', 'item-expression-exclusions'], ['条目保留条件', 'item-expression-inclusions'],
    ['文件排除条件', 'file-content-expression-exclusions'], ['文件保留条件', 'file-content-expression-inclusions'],
    ['条目内容排除条件', 'item-content-expression-exclusions'], ['条目内容保留条件', 'item-content-expression-inclusions'],
  ].flatMap(([label, key]) => strings(options[key]).map(value => ({ label, value })))
  const mover = text(processor['file-mover'])
  const moverType = mover.split(':')[0]
  const movement = moverType === 'hardlink' ? '硬链接 · 保留源文件' : ['general', 'system-file'].includes(moverType) ? '移动源文件' : moverType === 'qbittorrent' ? '由 qBittorrent 整理' : mover
  const directory = text(options['save-path-pattern'], '原目录结构')
  const filename = text(options['filename-pattern'], '原文件名')
  const groups = (Array.isArray(options['file-grouping']) ? options['file-grouping'] : []).map(value => {
    const group = record(value)
    const tags = strings(group.tags)
    return {
      condition: tags.length ? `标签：${tags.join(' + ')}` : text(group['expression-matching'], '未配置匹配条件'),
      directory: group['save-path-pattern'] === undefined ? directory : text(group['save-path-pattern'], '原目录结构'),
      filename: group['filename-pattern'] === undefined ? filename : text(group['filename-pattern'], '原文件名'),
    }
  })
  return {
    name: text(processor.name), source: text(processor.source),
    inputPath: source ? text(source.props.path) : '',
    sourceMode: source?.typeName === 'fanbox' ? (source.props.mode === 'latestOnly' ? '仅查询最新文章' : '可访问历史及后续更新') : source?.typeName === 'mikan' ? (source.props['all-episode'] === true ? 'RSS + 新条目相关番剧历史' : 'RSS 返回的条目') : '',
    downloader: text(processor.downloader), movement, mover,
    destination: text(processor['save-path']), directory, filename, groups, filters,
    schedule: schedule.length ? schedule.join('；') : '手动触发 · 创建后不自动扫描',
    automatic: triggers.length > 0,
    windows: options['support-windows-platform-path'] !== false,
    replacement: text(options['file-replacement-decider'], 'never'),
    listeners: Array.isArray(options['process-listeners']) ? options['process-listeners'].map(value => typeof value === 'string' ? value : text(record(value).id)).filter(Boolean) : [],
  }
}

export function AgentPlanPreview({ plan, disabled, onRevise }: { plan: AgentPlan; disabled: boolean; onRevise: (text: string) => void }) {
  return <div className="space-y-7">
    {plan.processors.map((processor, index) => {
      const preview = processorPreview(plan, processor)
      const revise = (part: string) => onRevise(`请调整处理器「${preview.name}」的${part}：`)
      return <article key={`${preview.name}-${index}`} className="min-w-0 space-y-4">
        <h3 className="break-all text-base font-medium">{preview.name}</h3>
        <ol aria-label="处理流程" className="grid min-w-0 gap-2 sm:grid-cols-[1fr_auto_1fr_auto_1fr]">
          {[
            { label: '来源', value: preview.inputPath || preview.source, detail: preview.sourceMode || preview.source },
            { label: '处理', value: preview.movement, detail: `下载器：${preview.downloader}` },
            { label: '保存到', value: preview.destination, detail: '命名结构见下方' },
          ].map((step, stepIndex) => <li key={step.label} className="contents">
            {stepIndex > 0 && <span aria-hidden="true" className="flex items-center justify-center text-muted-foreground"><ArrowRight className="hidden h-4 w-4 sm:block" /><ArrowDown className="h-4 w-4 sm:hidden" /></span>}
            <div className="min-w-0 rounded-lg bg-muted/50 p-3"><p className="text-xs text-muted-foreground">{step.label}</p><p className="mt-2 break-all text-sm font-medium">{step.value}</p><p className="mt-1 break-all text-xs text-muted-foreground">{step.detail}</p></div>
          </li>)}
        </ol>
        <div className="rounded-lg border p-3 sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-2"><h4 className="flex items-center gap-2 text-sm font-medium"><FolderTree className="h-4 w-4" />目录与命名模板</h4><Button size="sm" variant="ghost" disabled={disabled} onClick={() => revise('目录和命名')}><Pencil className="h-3 w-3" />调整</Button></div>
          <div className="mt-3 space-y-2 break-all font-mono text-sm leading-6"><div>{preview.destination}/</div><div className="border-l pl-4">{preview.directory}/<div className="ml-2 border-l pl-4">{preview.filename}</div></div></div>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">模板预览 · 花括号内容在运行时解析，文件扩展名由处理器保留。尚未执行真实文件预览。</p>
          {preview.groups.length > 0 && <div className="mt-4 border-t pt-3"><h5 className="mb-2 text-xs text-muted-foreground">分组例外 · 按顺序匹配</h5><ul className="divide-y">{preview.groups.map((group, i) => <li key={i} className="grid gap-1 py-2 text-xs sm:grid-cols-2"><span className="break-all">{group.condition}</span><span className="break-all font-mono">{group.directory} / {group.filename}</span></li>)}</ul></div>}
        </div>
        <dl className="grid gap-x-4 gap-y-3 text-sm sm:grid-cols-[6rem_1fr]">
          <dt className="text-muted-foreground">执行时间</dt><dd className="break-words">{preview.schedule}</dd>
          <dt className="text-muted-foreground">同名目标</dt><dd className="break-all">{preview.replacement.split(':')[0] === 'never' ? '不自动替换已有文件' : `按 ${preview.replacement} 判断替换`}</dd>
          <dt className="text-muted-foreground">路径兼容</dt><dd>{preview.windows ? '兼容 Windows 文件名' : '不替换 Windows 禁用字符'}</dd>
          {preview.listeners.length > 0 && <><dt className="text-muted-foreground">完成后动作</dt><dd className="break-all">{preview.listeners.join('、')}</dd></>}
        </dl>
        {preview.filters.length > 0 && <details className="border-t pt-3"><summary className="cursor-pointer text-sm">筛选规则 · {preview.filters.length} 项</summary><ul className="mt-3 space-y-2">{preview.filters.map((filter, i) => <li key={i} className="break-all text-xs leading-6"><span className="mr-2 text-muted-foreground">{filter.label}</span><code>{filter.value}</code></li>)}</ul><p className="mt-2 text-xs text-muted-foreground">实际保留或跳过的文件需运行预览后确认。</p></details>}
        <div className="flex flex-wrap gap-2">{['整理方式', '筛选规则', '执行时间'].map(part => <Button key={part} size="sm" variant="outline" disabled={disabled} onClick={() => revise(part)}>调整{part}</Button>)}</div>
      </article>
    })}
  </div>
}
