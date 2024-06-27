<template>
  <el-form :model="dryRunFormData" label-width="auto">
    <el-form-item label="过滤已处理的Item">
      <el-switch v-model="dryRunFormData.filterProcessed"/>
    </el-form-item>
    <el-form-item label="Pointer">
      <json-editor
          v-model="dryRunFormData.pointer"
          mode="tree"
          :ask-to-format="false"
          :darkTheme="isDark"/>
    </el-form-item>
    <el-form-item label="流式响应">
      <el-switch v-model="streamable"/>
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="handleDryRunFormSubmit">确认</el-button>
    </el-form-item>
  </el-form>

  <el-dialog v-model="dryRunOpened" @close="() => dryRunResult = []">
    <el-table
        :data="dryRunResult"
        row-key="itemHash"
        style="width: 100%;"
        v-loading="loading"
    >
      <el-table-column prop="itemHash" width="auto">
        <template #default="scope">
          <el-tag size="large" :type="itemStatusOf(scope.row.status).type">
            状态:{{ itemStatusOf(scope.row.status).label }}
          </el-tag>
          <el-tag size="large" type="info">Hash:{{ scope.row.itemHash }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="itemContent.sourceItem.title" label="条目" min-width="300" width="auto">
        <template #default="scope">
          <ItemContentDetail :content="scope.row.itemContent"/>
        </template>
      </el-table-column>
      <el-table-column prop="itemContent.fileContents.length" label="文件">
        <template #default="scope">
          <el-button size="small" @click="handleFileContentOpen(scope.row)">
            查看{{ scope.row.itemContent.fileContents.length }}个文件
          </el-button>
          <el-tag
              v-for="[status, count] in fileStatusGrouping(scope.row.itemContent.fileContents)"
              :key="status.value" :type="status.type"
          >
            {{ status.label }}:{{ count }}
          </el-tag>
        </template>
      </el-table-column>
    </el-table>
  </el-dialog>

  <el-dialog v-model="showFileContentDialog">
    <el-table :data="fileContents" row-key="fileDownloadPath">
      <el-table-column>
        <template #default="scope">
          <FileContentDetail :file="scope.row"/>
        </template>
      </el-table-column>
    </el-table>
  </el-dialog>
</template>

<script setup lang="ts">
import {isDark} from "~/composables";
import JsonEditor from "vue3-ts-jsoneditor";
import {ElButton, ElSwitch} from "element-plus";
import {
  FileContent,
  fileStatusGrouping,
  ItemContent,
  itemStatusOf,
  ProcessingContent,
  processorService
} from "~/services/data.service";
import {reactive, ref, toRefs} from "vue";
import ItemContentDetail from "~/components/ItemContentDetail.vue";

const props = defineProps<{
  processorName?: string,
}>();

const dryRunFormData = reactive({
  filterProcessed: true,
  pointer: null
})
const streamable = ref(true)

const {processorName} = toRefs(props)

const loading = ref(false)
const handleDryRunFormSubmit = async () => {
  if (!processorName.value) {
    return
  }
  dryRunOpened.value = true
  loading.value = true
  if (!streamable.value) {
    const response = await processorService.dryRun(processorName.value, dryRunFormData)
        .finally(() => {
          loading.value = false
        })
    dryRunResult.value = response.data
    return
  }

  const response = await processorService.dryRunStream(processorName.value, dryRunFormData)
  const body = response.body
  if (!body) {
    return
  }

  let firstLineFlag = true
  for await (const line of makeStreamLineIterator(response.body, () => !dryRunOpened.value)) {
    if (firstLineFlag) {
      loading.value = false
      firstLineFlag = false
    }
    updateDryRunTable(line)
  }
  loading.value = false
};

async function* makeStreamLineIterator(
    readerStream: ReadableStream<Uint8Array>,
    terminateSignal: () => boolean
) {
  const reader = readerStream.getReader();
  let {value: chunk, done: readerDone} = await reader.read();
  const utf8Decoder = new TextDecoder('utf-8');
  let partialLine = chunk ? utf8Decoder.decode(chunk, {stream: true}) : '';

  const re = /\r\n|\n|\r/gm;
  let startIndex = 0;
  for (; ;) {
    if (terminateSignal()) {
      await reader.cancel('terminate signal received')
      break
    }

    let result = re.exec(partialLine);
    if (!result) {
      if (readerDone) {
        break;
      }
      let remainder = partialLine.substring(startIndex);
      ({value: chunk, done: readerDone} = await reader.read());
      partialLine = remainder + (chunk ? utf8Decoder.decode(chunk, {stream: true}) : '');
      startIndex = re.lastIndex = 0;
      continue;
    }
    yield partialLine.substring(startIndex, result.index);
    startIndex = re.lastIndex;
  }
  if (startIndex < partialLine.length) {
    yield partialLine.substring(startIndex);
  }
}

const updateDryRunTable = (json: string) => {
  try {
    const content = JSON.parse(json)
    dryRunResult.value.push(content)
  } catch (e) {
    console.warn('Failed to parse line:', json);
  }
}

// result
const dryRunOpened = ref(false)
const dryRunResult = ref<ItemContent[]>([])

const fileContents = ref<FileContent[]>([]);
const showFileContentDialog = ref(false);
const handleFileContentOpen = (content: ProcessingContent) => {
  fileContents.value = content.itemContent.fileContents;
  showFileContentDialog.value = true;
}
</script>