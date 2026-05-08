import { useEffect, useState } from 'react'

import { MultiSelect } from '~/components/shared/multi-select'
import { processorService } from '~/services/data.service'

export function ProcessorSelector({ value, onChange }: { value: string[]; onChange: (next: string[]) => void }) {
  const [options, setOptions] = useState<{ label: string; value: string }[]>([])

  const fetchProcessors = async () => {
    if (options.length > 0) {
      return
    }
    const processors = await processorService.query()
    setOptions(processors.map((item) => ({ label: item.name, value: item.name })))
  }

  useEffect(() => {
    void fetchProcessors()
  }, [])

  return (
    <MultiSelect options={options} value={value} onChange={onChange} placeholder="筛选处理器" />
  )
}
