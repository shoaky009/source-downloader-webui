<template>
  <el-select
      v-model="selected"
      multiple
      collapse-tags
      collapse-tags-tooltip
      :max-collapse-tags="3"
      placeholder="筛选处理器"
      filterable
      @focus="fetchProcessors"
  >
    <el-option
        v-for="item in processors"
        :key="item"
        :label="item"
        :value="item"
    />
  </el-select>
</template>

<script setup lang="ts">
import {ref, watch} from 'vue'
import {processorService} from "~/services/data.service";

const selected = ref<string[]>([])
const processors = ref<string[]>([])

const fetchProcessors = async () => {
  processorService.query().then(response => {
    processors.value = response.map(item => {
      return item.name
    })
  })
}


const emit = defineEmits(['update:selected'])
watch(selected, (newValue) => {
  emit('update:selected', newValue);
});
</script>