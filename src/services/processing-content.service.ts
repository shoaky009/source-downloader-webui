export interface ScrollResponse<T> {
    contents: T[],
    nextMaxId: number
}

export interface ProcessingContent {
    id: string,
    processorName: string,
    itemHash: string,
    itemContent: ItemContent,
    fileContents: FileContent[],
    status: string,
    renameTimes: number,
    modifyTime: string,
    createTime: string
}

export interface SourceItem {
    title: string,
    link: string,
    datetime: string,
    contentType: string,
    downloadUri: string,
    attrs: object,
    tags: string[]
}

export interface ItemContent {
    sourceItem: SourceItem
    itemVariables: object
}

export interface FileContent {
    fileDownloadPath: string,
    patternVariables: object,
    targetSavePath: string,
    targetFilename: string,
    attrs: object,
    tags: string[],
    errors: string[],
    status: string,
}

export interface Processor {
    name: string,
    category: string,
    tags: string[],
    enabled: boolean,
    lastTriggerTime: string,
}

export interface Component {
    type: string
    name: string,
    typeName: string,
    props: object,
    stateDetail: any,
    primary: boolean
}