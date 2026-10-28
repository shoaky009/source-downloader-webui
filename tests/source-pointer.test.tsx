import { describe, expect, test } from 'bun:test'
import { renderToStaticMarkup } from 'react-dom/server'
import { getDefaultFormState, type RJSFSchema } from '@rjsf/utils'
import validator from '@rjsf/validator-ajv8'

import { SourcePointerEditor } from '../src/components/source-pointer-editor'
import { parseSourcePointer, pointerFormDefaults, sourceTypeFromId } from '../src/lib/source-pointer'

const pageSchema: RJSFSchema = {
  type: 'object',
  properties: {
    works: {
      type: 'object', title: '作品订阅',
      additionalProperties: {
        type: 'object', properties: {
          currentId: { type: 'integer', title: '最近处理的作品' },
          latestId: { type: 'integer', title: '增量边界' },
          hasIteratedAll: { type: 'boolean', title: '已完成首次全量', default: false },
          page: { type: 'integer', minimum: 1, default: 1 },
        }, required: ['currentId', 'latestId'],
      },
    },
  },
}

const timeSchema: RJSFSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#', type: 'object',
  properties: {
    latest: {
      type: ['array', 'null'], title: '最新发布时间', minItems: 9, maxItems: 9, additionalItems: false,
      items: ['年', '年内第几天', '时', '分', '秒', '纳秒', '时区时偏移', '时区分偏移', '时区秒偏移']
        .map((title) => ({ type: 'integer', title })),
    },
  },
}

describe('source pointer editing', () => {
  test('resolves metadata types for configured and fully qualified component IDs', () => {
    expect(sourceTypeFromId('asmrone:audio')).toBe('asmrone')
    expect(sourceTypeFromId('rss')).toBe('rss')
    expect(sourceTypeFromId('source:fanbox:creators')).toBe('fanbox')
  })

  test('keeps nested progress, booleans, numbers and unknown fields intact', () => {
    const pointer = { works: { 'circle:test': { currentId: 105, latestId: 100, hasIteratedAll: false, page: 2 } }, extension: { cursor: '00123' } }
    const before = JSON.stringify(pointer)
    expect(parseSourcePointer(before, pageSchema)).toEqual(pointer)
    expect(JSON.stringify(pointer)).toBe(before)
  })

  test('opening a form does not populate optional progress defaults', () => {
    const pointer = { works: { example: { currentId: 105, latestId: 100 } } }
    const formData = getDefaultFormState(validator, pageSchema, pointer, pageSchema, false, pointerFormDefaults)
    expect(JSON.parse(JSON.stringify(formData))).toEqual(pointer)
  })

  test('retains nullable and tuple timestamps without converting to strings or local time', () => {
    const pointer = { latest: [2026, 301, 12, 34, 56, 123456789, 8, 0, 0] }
    expect(parseSourcePointer(JSON.stringify(pointer), timeSchema)).toEqual(pointer)
    expect(parseSourcePointer('{"latest":null}', timeSchema)).toEqual({ latest: null })
    expect(() => parseSourcePointer('{"latest":"2026-10-28T12:34:56+08:00"}', timeSchema)).toThrow()
    expect(() => parseSourcePointer('{"latest":[2026,301]}', timeSchema)).toThrow()
  })

  test('rejects malformed or scalar pointers and invalid typed fields before saving', () => {
    for (const text of ['', '{', 'null', '[]', '123']) expect(() => parseSourcePointer(text)).toThrow()
    expect(() => parseSourcePointer('{"works":{"test":{"currentId":1,"latestId":1,"page":0}}}', pageSchema)).toThrow()
    expect(() => parseSourcePointer('{"works":{"test":{"currentId":"1","latestId":1}}}', pageSchema)).toThrow()
    expect(parseSourcePointer('{"pluginField":false}')).toEqual({ pluginField: false })
  })

  test('renders schema titles and nested map records as fields', () => {
    const html = renderToStaticMarkup(<SourcePointerEditor schema={pageSchema} value='{"works":{"circle:test":{"currentId":105,"latestId":100,"hasIteratedAll":false,"page":2}}}' onChange={() => {}} />)
    expect(html).toContain('作品订阅')
    expect(html).toContain('最近处理的作品')
    expect(html).toContain('增量边界')
    expect(html).not.toContain('名称 / ID')
    expect(html).toContain('circle:test')
  })

  test('renders named timestamp tuple parts and stateless sources', () => {
    const html = renderToStaticMarkup(<SourcePointerEditor schema={timeSchema} value='{"latest":[1970,1,0,0,0,0,0,0,0]}' onChange={() => {}} />)
    expect(html).toContain('年内第几天')
    expect(html).toContain('时区时偏移')
    expect(html).not.toContain('Unsupported')
    const empty = renderToStaticMarkup(<SourcePointerEditor schema={{ type: 'object', title: '无抓取进度', description: '每次扫描目录。', additionalProperties: false }} value='{}' onChange={() => {}} />)
    expect(empty).toContain('每次扫描目录。')
    expect(empty).not.toContain('添加记录')
  })
})
