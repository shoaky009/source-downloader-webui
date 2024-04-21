<template>
  <el-dialog
      v-model="openForm"
      width="500"
      center
      @close="handleDialogClose"
  >
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
  </el-dialog>
</template>

<script setup lang="ts">
import {isDark} from "~/composables";
import JsonEditor from "vue3-ts-jsoneditor";
import {ElButton, ElSwitch} from "element-plus";
import {processorService} from "~/services/data.service";
import {reactive, toRefs} from "vue";

const props = defineProps<{
  processorName?: string,
  openForm: boolean,
}>();

const dryRunFormData = reactive({
  filterProcessed: true,
  pointer: null
})

const {processorName, openForm} = toRefs(props)
const emit = defineEmits(['dialogClose'])
const handleDialogClose = () => {
  emit('dialogClose', {open: false})
}

const handleDryRunFormSubmit = () => {
  if (processorName.value) {
    processorService.dryRun(processorName.value, dryRunFormData)
  }
};
</script>