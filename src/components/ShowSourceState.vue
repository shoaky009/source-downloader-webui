<template>
  <el-dialog
      v-model="isOpen"
      width="500"
      center
      @open="loadSourceState"
  >
    <json-editor
        v-if="data"
        :value="data"
        mode="text"
        :darkTheme="isDark"
        :read-only="false"
        @change="onDataChange"
    />
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="isOpen = false">取消</el-button>
        <el-popconfirm
            title="确认提交修改后的 pointer 数据吗？"
            confirm-button-text="确定"
            cancel-button-text="取消"
            @confirm="submitPointerData"
        >
          <template #reference>
            <el-button type="primary">提交修改</el-button>
          </template>
        </el-popconfirm>
      </span>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import {isDark} from "~/composables";
import {ref} from "vue";
import JsonEditor, {JSONContent, TextContent} from 'vue3-ts-jsoneditor';
import "vue3-json-viewer/dist/index.css";
import {processorService} from "~/services/data.service";
import {ElMessage} from "element-plus";

const props = defineProps<{
  processorName?: string,
}>()
const isOpen = ref(false)
const data = ref<any>()
const sourceId = ref<string | undefined | null>()

const loadSourceState = async () => {
  if (props.processorName) {
    const response = await processorService.sourceState(props.processorName)
    data.value = response.data.pointer
    sourceId.value = response.data.sourceId
  }
}

const onDataChange = (value: JSONContent | TextContent) => {
  const isTextContent = (v: JSONContent | TextContent): v is TextContent => {
    return 'text' in v
  }

  if (isTextContent(value)) {
    data.value = value.text
  } else {
    data.value = value.json
  }
}

const submitPointerData = async () => {
  if (!props.processorName) {
    ElMessage({message: '缺少 processorName', type: 'error'})
    return
  }

  if (data.value === null || data.value === undefined || data.value === '') {
    ElMessage({message: 'Pointer 数据不能为空', type: 'error'})
    return
  }

  try {
    let pointerPayload = data.value
    if (typeof pointerPayload === 'string') {
      try {
        pointerPayload = JSON.parse(pointerPayload)
      } catch (e) {
        ElMessage({message: 'JSON 格式错误，无法解析', type: 'error'})
        return
      }
    }

    if (pointerPayload === null || typeof pointerPayload !== 'object' || Array.isArray(pointerPayload)) {
      ElMessage({message: 'Pointer 必须是一个 JSON 对象', type: 'error'})
      return
    }

    const payload = {
      sourceId: sourceId.value,
      pointer: pointerPayload
    }

    await processorService.updateSourcePointer(props.processorName, payload)
    isOpen.value = false
  } catch (err: any) {
    ElMessage({message: err?.response?.data?.detail ?? err?.message ?? '提交失败', type: 'error'})
  }
}
</script>