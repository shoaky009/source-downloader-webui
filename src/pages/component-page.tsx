import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'

import { ComponentForm } from '~/components/component-form'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { Dialog, DialogContent } from '~/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import type { Component } from '~/services/data.service'
import { componentService } from '~/services/data.service'

export function ComponentPage() {
  const [loading, setLoading] = useState(false)
  const [components, setComponents] = useState<Component[]>([])
  const [creationFormOpen, setCreationFormOpen] = useState(false)
  const [expandedRows, setExpandedRows] = useState<string[]>([])

  const fetchComponents = async () => {
    setLoading(true)
    try {
      setComponents(await componentService.query({}))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchComponents()
  }, [])

  useEffect(() => {
    if (expandedRows.length === 0) {
      return
    }
    const eventSource = componentService.stateStream(expandedRows, (event) => {
      const [type, typeName, name] = event.lastEventId.split(':')
      setComponents((current) =>
        current.map((component) =>
          component.type === type && component.typeName === typeName && component.name === name
            ? { ...component, stateDetail: JSON.parse(event.data) }
            : component,
        ),
      )
    })
    return () => eventSource.close()
  }, [expandedRows])

  return (
    <div className="space-y-4">
      <Button size="icon" onClick={() => setCreationFormOpen(true)}>
        <Plus className="h-4 w-4" />
      </Button>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>展开</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>类型名称</TableHead>
                <TableHead>名称</TableHead>
                <TableHead>消息</TableHead>
                <TableHead>引用</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {components.map((component) => {
                const rowKey = `${component.type}:${component.typeName}:${component.name}`
                const expanded = expandedRows.includes(rowKey)
                return (
                  <>
                    <TableRow key={rowKey} className={component.errorMessage ? 'text-red-600' : undefined}>
                      <TableCell>
                        {component.stateDetail != null ? (
                          <Button size="sm" variant="outline" onClick={() => setExpandedRows((current) => (expanded ? current.filter((item) => item !== rowKey) : [...current, rowKey]))}>
                            {expanded ? '收起' : '展开'}
                          </Button>
                        ) : null}
                      </TableCell>
                      <TableCell>{component.type}</TableCell>
                      <TableCell>{component.typeName}</TableCell>
                      <TableCell>{component.name}</TableCell>
                      <TableCell>{component.errorMessage}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {component.refs?.map((ref) => (
                            <Badge key={ref} variant="secondary">
                              {ref}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" onClick={() => console.log('WIP编辑', component)}>
                            WIP编辑
                          </Button>
                          <Button size="sm" variant="outline" onClick={async () => {
                            await componentService.reload(component)
                            await fetchComponents()
                          }}>
                            重载
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => console.log('WIP删除', component)}>
                            WIP删除
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {expanded ? (
                      <TableRow key={`${rowKey}-details`}>
                        <TableCell colSpan={7}>
                          <div className="rounded-md bg-muted/40 p-4">
                            <div>状态信息:</div>
                            <pre className="overflow-auto text-xs">{JSON.stringify(component.stateDetail, null, 2)}</pre>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </>
                )
              })}
            </TableBody>
          </Table>
          {loading ? <div className="p-4 text-sm text-muted-foreground">加载中...</div> : null}
        </CardContent>
      </Card>

      <Dialog open={creationFormOpen} onOpenChange={setCreationFormOpen}>
        <DialogContent className="max-w-5xl">
          <ComponentForm />
        </DialogContent>
      </Dialog>
    </div>
  )
}
