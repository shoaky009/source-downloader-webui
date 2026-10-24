import { describe, expect, test } from 'bun:test'
import { processorPreview } from '../src/components/agent-plan-preview'
import type { AgentPlan } from '@/services/data.service'

const plan: AgentPlan = {
  summary: '', instances: [],
  components: [{ rootType: 'source', typeName: 'system-file', name: 'local', props: { path: '/input' } }],
  processors: [],
}

describe('processor preview', () => {
  test('shows manual local movement and default naming without invented examples', () => {
    const preview = processorPreview(plan, { source: 'system-file:local', 'file-mover': 'general', 'save-path': '/anime' })
    expect(preview.inputPath).toBe('/input')
    expect(preview.movement).toBe('移动源文件')
    expect(preview.filename).toBe('原文件名')
    expect(preview.automatic).toBe(false)
    expect(preview.windows).toBe(true)
  })

  test('preserves empty group templates and false options', () => {
    const preview = processorPreview(plan, { options: {
      'filename-pattern': '{sequence}', 'save-path-pattern': '{item.title}',
      'support-windows-platform-path': false,
      'file-grouping': [{ 'expression-matching': "file.attrs.type == 'file'", 'filename-pattern': '' }, { tags: ['subtitle'] }],
    } })
    expect(preview.groups[0].filename).toBe('原文件名')
    expect(preview.groups[1].filename).toBe('{sequence}')
    expect(preview.groups[1].directory).toBe('{item.title}')
    expect(preview.windows).toBe(false)
  })

  test('does not guess settings for reused triggers', () => {
    const preview = processorPreview(plan, { triggers: ['cron:existing'] })
    expect(preview.schedule).toBe('cron:existing（沿用组件设置）')
    expect(preview.automatic).toBe(true)
  })
})
