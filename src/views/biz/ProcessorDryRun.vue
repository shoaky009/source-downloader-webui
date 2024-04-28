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
    <el-form-item>
      <el-button type="primary" @click="handleDryRunFormSubmit">确认</el-button>
    </el-form-item>
  </el-form>

  <el-dialog v-model="dryRunOpen" @close="() => dryRunResult = []">
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

const {processorName} = toRefs(props)

const loading = ref(false)
const handleDryRunFormSubmit = () => {
  if (processorName.value) {
    dryRunOpen.value = true
    loading.value = true
    processorService.dryRun(processorName.value, dryRunFormData)
        .then(response => {
          dryRunResult.value = response.data
        }).finally(() => {
      loading.value = false
    })
  }
};

// result
const dryRunOpen = ref(false)
const dryRunResult = ref<ItemContent[]>([])

const fileContents = ref<FileContent[]>([]);
const showFileContentDialog = ref(false);
const handleFileContentOpen = (content: ProcessingContent) => {
  fileContents.value = content.itemContent.fileContents;
  showFileContentDialog.value = true;
}
</script>