<template>
  <el-dialog
      v-model="showDialog"
      width="500"
      destroy-on-close
      center
      @close="handleDialogClose"
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
import {isDark} from "~/composables";
import {ref, toRefs, watch} from "vue";
import JsonEditor from 'vue3-ts-jsoneditor';
import "vue3-json-viewer/dist/index.css";
import {processorService} from "~/services/data.service";

const props = defineProps<{
  processorName?: string,
  showState: boolean
}>()


const {processorName, showState} = toRefs(props)
const data = ref<any>()
const showDialog = ref(false)
watch(showState, async (show) => {
  if (show && processorName.value) {
    const response = await processorService.sourceState(processorName.value)
    data.value = response.data.pointer
    showDialog.value = true
  }
})

const emit = defineEmits(['dialogClose'])
const handleDialogClose = () => {
  showDialog.value = false
  emit('dialogClose', {showState: false})
}

</script>