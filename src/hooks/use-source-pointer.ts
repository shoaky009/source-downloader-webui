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
          metadataError = '进度描述加载失败，可以继续使用 JSON 编辑。'
        }
        if (!disposed) setState({ processorName, source, schema, metadataError, loading: false })
      } catch (error) {
        if (!disposed) setState({ processorName, loading: false, error: error instanceof Error ? error.message : '抓取进度加载失败' })
      }
    })()
    return () => { disposed = true }
  }, [enabled, processorName, revision])

  const current = state.processorName === processorName ? state : { loading: enabled && Boolean(processorName) }
  return { ...current, reload: () => setRevision((value) => value + 1) }
}
