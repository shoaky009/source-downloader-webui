import Editor from '@monaco-editor/react'

import { useDarkMode } from '@/hooks'

export function JsonEditor({
  value,
  onChange,
  height = 320,
  readOnly = false,
}: {
  value: string
  onChange: (value: string) => void
  height?: number
  readOnly?: boolean
}) {
  const { isDark } = useDarkMode()

  return (
    <Editor
      height={height}
      defaultLanguage="json"
      value={value}
      onChange={(next) => onChange(next ?? '')}
      theme={isDark ? 'vs-dark' : 'vs-light'}
      options={{
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        fontSize: 13,
        readOnly,
        wordWrap: 'on',
        formatOnPaste: true,
        formatOnType: true,
      }}
    />
  )
}
