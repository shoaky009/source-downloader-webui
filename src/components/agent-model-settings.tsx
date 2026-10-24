import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { agentService, type AgentSettings } from '@/services/data.service'

export function AgentModelSettings({ open, onOpenChange, onSaved }: { open: boolean; onOpenChange: (open: boolean) => void; onSaved: (settings: AgentSettings) => void }) {
  const [settings, setSettings] = useState<AgentSettings>({ protocol: 'responses', baseUrl: 'https://api.openai.com/v1', model: '', apiKey: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    if (!open) return
    let active = true
    setError('')
    setBusy(true)
    agentService.settings().then(value => { if (active) setSettings({ ...value, apiKey: '' }) })
      .catch(() => { if (active) setError('无法加载模型设置') })
      .finally(() => { if (active) setBusy(false) })
    return () => { active = false }
  }, [open])
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto">
      <DialogHeader><DialogTitle>模型连接</DialogTitle><DialogDescription>连接支持工具调用的模型服务。API Key 仅保存在后端。</DialogDescription></DialogHeader>
      <form onSubmit={async event => {
        event.preventDefault(); setBusy(true); setError('')
        try { await agentService.saveSettings(settings); onSaved(settings); onOpenChange(false); setSettings(value => ({ ...value, apiKey: '' })) }
        catch (error) { setError(error instanceof Error ? error.message : '保存失败') }
        finally { setBusy(false) }
      }} className="space-y-4">
        <div className="space-y-2"><Label htmlFor="agent-protocol">接口协议</Label>
          <select id="agent-protocol" className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={settings.protocol} onChange={event => setSettings({ ...settings, protocol: event.target.value as AgentSettings['protocol'] })}>
            <option value="responses">OpenAI Responses</option><option value="chat-completions">Chat Completions</option>
          </select></div>
        <div className="space-y-2"><Label htmlFor="agent-base">Base URL</Label><Input id="agent-base" type="url" required value={settings.baseUrl} onChange={event => setSettings({ ...settings, baseUrl: event.target.value })} /><p className="text-xs text-muted-foreground">例如 https://api.openai.com/v1，不包含 /responses 或 /chat/completions。</p></div>
        <div className="space-y-2"><Label htmlFor="agent-model">模型名称</Label><Input id="agent-model" required value={settings.model} onChange={event => setSettings({ ...settings, model: event.target.value })} placeholder="填写服务提供的模型 ID" /></div>
        <div className="space-y-2"><Label htmlFor="agent-key">API Key</Label><Input id="agent-key" type="password" autoComplete="new-password" value={settings.apiKey} onChange={event => setSettings({ ...settings, apiKey: event.target.value })} placeholder={settings.hasApiKey ? '已配置；同一服务地址下留空保留' : '服务需要认证时填写'} /></div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <DialogFooter><Button type="submit" disabled={busy}>{busy ? '保存中…' : '保存连接'}</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
}
