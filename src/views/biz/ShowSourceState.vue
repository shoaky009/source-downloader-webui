<template>
  <el-dialog
      v-model="isOpen"
      width="500"
      center
      @open="loadSourceState"
  >
    <json-editor
        :value="data"
        mode="text"
        :darkTheme="isDark"
        :read-only="true"
    />
  </el-dialog>
</template>

<script lang="ts" setup>
// FIXME 第一次打开会报错
import {isDark} from "~/composables";
import {ref} from "vue";
import JsonEditor from 'vue3-ts-jsoneditor';
import "vue3-json-viewer/dist/index.css";
import {processorService} from "~/services/data.service";

const props = defineProps<{
  processorName?: string,
}>()
const isOpen = ref(false)
const data = ref<any>()
const loadSourceState = async () => {
  if (props.processorName) {
    const response = await processorService.sourceState(props.processorName)
    data.value = response.data.pointer
  }
}
</script>