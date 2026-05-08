import { useEffect, useState } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Descriptions, DescriptionsItem } from '~/components/shared/descriptions'
import { actuatorService } from '~/services/data.service'

export function SettingPage() {
  const [backendAppInfo, setBackendAppInfo] = useState<unknown>()

  useEffect(() => {
    actuatorService.info().then((response) => setBackendAppInfo(response.data))
  }, [])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Setting</h1>
        <p className="text-muted-foreground">Welcome to the Setting page!</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>BuildInfo</CardTitle>
        </CardHeader>
        <CardContent>
          <Descriptions>
            <DescriptionsItem label="UI:">
              <pre className="overflow-auto text-xs">{JSON.stringify(__APP_INFO__, null, 2)}</pre>
            </DescriptionsItem>
            <DescriptionsItem label="Backend:">
              <pre className="overflow-auto text-xs">{JSON.stringify(backendAppInfo, null, 2)}</pre>
            </DescriptionsItem>
          </Descriptions>
        </CardContent>
      </Card>
    </div>
  )
}
