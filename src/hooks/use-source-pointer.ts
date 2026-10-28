import { useEffect, useState } from 'react'
import type { RJSFSchema } from '@rjsf/utils'

import { sourceTypeFromId } from '~/lib/source-pointer'
import { componentService, processorService, type ProcessorSourceState } from '~/services/data.service'

interface PointerState {
  processorName?: string
  source?: ProcessorSourceState
  schema?: RJSFSchema | null
  loading: boolean
  error?: string
  metadataError?: string
}

export function useSourcePointer(processorName?: string, enabled = true) {
  const [state, setState] = useState<PointerState>({ loading: true })
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    let disposed = false
    if (!enabled || !processorName) {
      setState({ loading: false })
      return
    }
    setState({ processorName, loading: true })
    void (async () => {
      try {
        const { data: source } = await processorService.sourceState(processorName)
        let schema: RJSFSchema | null = null
        let metadataError: string | undefined
        try {
          const metadata = await componentService.getComponentPropSchema('source', sourceTypeFromId(source.sourceId))
          schema = metadata?.sourcePointerJsonSchema ?? null
        } catch {
          metadataError = '游标字段描述加载失败，使用 JSON 编辑。'
        }
        if (!disposed) setState({ processorName, source, schema, metadataError, loading: false })
      } catch (error) {
        if (!disposed) setState({ processorName, loading: false, error: error instanceof Error ? error.message : '数据源游标加载失败' })
      }
    })()
    return () => { disposed = true }
  }, [enabled, processorName, revision])

  const current = state.processorName === processorName ? state : { loading: enabled && Boolean(processorName) }
  return { ...current, reload: () => setRevision((value) => value + 1) }
}
