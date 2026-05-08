import { Badge } from '~/components/ui/badge'
import { Descriptions, DescriptionsItem } from '~/components/shared/descriptions'
import type { ItemContent } from '~/services/data.service'

export function ItemContentDetail({ content }: { content?: ItemContent | null }) {
  const sourceItem = content?.sourceItem

  return (
    <Descriptions>
      <DescriptionsItem label="标题:">
        <div className="truncate" title={sourceItem?.title}>
          {sourceItem?.title}
        </div>
      </DescriptionsItem>
      <DescriptionsItem label="链接:">
        {sourceItem?.link ? (
          <a href={sourceItem.link} target="_blank" rel="noreferrer" className="break-all">
            {sourceItem.link}
          </a>
        ) : null}
      </DescriptionsItem>
      <DescriptionsItem label="时间:">{sourceItem?.datetime}</DescriptionsItem>
      <DescriptionsItem label="类型:">{sourceItem?.contentType}</DescriptionsItem>
      <DescriptionsItem label="下载链接:">
        <div className="truncate text-muted-foreground" title={sourceItem?.downloadUri}>
          {sourceItem?.downloadUri}
        </div>
      </DescriptionsItem>
      {sourceItem?.tags?.length ? (
        <DescriptionsItem label="标签:">
          <div className="flex flex-wrap gap-1">
            {sourceItem.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </DescriptionsItem>
      ) : null}
      {content && Object.keys(sourceItem?.attrs ?? {}).length > 0 ? (
        <DescriptionsItem label="属性:">
          <div className="flex flex-wrap gap-1">
            {Object.entries(sourceItem?.attrs ?? {}).map(([key, attr]) => (
              <Badge key={key} variant="outline">
                {`${key}:${String(attr)}`}
              </Badge>
            ))}
          </div>
        </DescriptionsItem>
      ) : null}
      {content && Object.keys(content.itemVariables ?? {}).length > 0 ? (
        <DescriptionsItem label="变量:">
          <div className="flex flex-wrap gap-1">
            {Object.entries(content.itemVariables ?? {}).map(([key, val]) => (
              <Badge key={key} variant="outline">
                {`${key}:${String(val)}`}
              </Badge>
            ))}
          </div>
        </DescriptionsItem>
      ) : null}
    </Descriptions>
  )
}
