import { Badge } from '@/components/ui/badge'
import { Descriptions, DescriptionsItem } from '@/components/shared/descriptions'
import type { FileContent } from '@/services/data.service'
import { fileStatusOf } from '@/services/data.service'

function statusVariant(type: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (type === 'danger') return 'destructive'
  if (type === 'warning') return 'outline'
  if (type === 'info') return 'secondary'
  return 'default'
}

export function FileContentDetail({ file }: { file?: FileContent | null }) {
  const status = fileStatusOf(file?.status)

  return (
    <Descriptions>
      <DescriptionsItem label="下载路径:">{file?.fileDownloadPath}</DescriptionsItem>
      <DescriptionsItem label="目标路径:">{`${file?.targetSavePath ?? ''}/${file?.targetFilename ?? ''}`}</DescriptionsItem>
      {file?.existTargetPath ? <DescriptionsItem label="冲突路径:">{file.existTargetPath}</DescriptionsItem> : null}
      <DescriptionsItem label="状态:">
        <Badge variant={statusVariant(status.type)}>{status.label}</Badge>
      </DescriptionsItem>
      {file?.fileUri ? <DescriptionsItem label="URI:">{file.fileUri}</DescriptionsItem> : null}
      <DescriptionsItem label="模板:">
        <div>路径:{file?.fileSavePathPattern}</div>
        <div>文件名:{file?.filenamePattern}</div>
      </DescriptionsItem>
      {file?.tags?.length ? (
        <DescriptionsItem label="标签:">
          <div className="flex flex-wrap gap-1">
            {file.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </DescriptionsItem>
      ) : null}
      {Object.keys(file?.attrs ?? {}).length > 0 ? (
        <DescriptionsItem label="属性:">
          <div className="flex flex-wrap gap-1">
            {Object.entries(file?.attrs ?? {}).map(([key, attr]) => (
              <Badge key={key} variant="outline">
                {`${key}:${String(attr)}`}
              </Badge>
            ))}
          </div>
        </DescriptionsItem>
      ) : null}
      {Object.keys(file?.patternVariables ?? {}).length > 0 ? (
        <DescriptionsItem label="变量:">
          <div className="flex flex-wrap gap-1">
            {Object.entries(file?.patternVariables ?? {}).map(([key, val]) => (
              <Badge key={key} variant="outline">
                {`${key}:${String(val)}`}
              </Badge>
            ))}
          </div>
        </DescriptionsItem>
      ) : null}
      {Object.keys(file?.processedVariables ?? {}).length > 0 ? (
        <DescriptionsItem label="已处理变量:">
          <div className="flex flex-wrap gap-1">
            {Object.entries(file?.processedVariables ?? {}).map(([key, val]) => (
              <Badge key={key} variant="outline">
                {`${key}:${String(val)}`}
              </Badge>
            ))}
          </div>
        </DescriptionsItem>
      ) : null}
      {file?.errors?.length ? (
        <DescriptionsItem label="错误:">
          <div className="flex flex-wrap gap-1">
            {file.errors.map((error) => (
              <Badge key={error} variant="destructive">
                {error}
              </Badge>
            ))}
          </div>
        </DescriptionsItem>
      ) : null}
    </Descriptions>
  )
}
