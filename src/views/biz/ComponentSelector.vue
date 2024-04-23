<template>
  <el-select
      v-model="componentValue"
      filterable
      clearable
      style="width: 240px"
      :multiple="multiple"
      @focus="loadOptions"
      placeholder="选择组件ID"
  >
    <el-option
        v-for="item in options"
        :key="item.value"
        :label="item.label"
        :value="item.value"
    />
  </el-select>
</template>

<script setup lang="ts">
import {ref, toRefs} from "vue";
import {componentService} from "~/services/data.service";

const props = defineProps<{
  type: string,
  multiple?: boolean,
}>()
const {type, multiple} = toRefs(props)
const options = ref()
const componentValue = ref<string | string[]>()

const loadOptions = async () => {
  if (options.value) {
    return
  }
  const components = await componentService.query({'type': type.value})
  options.value = components.map((component) => {
    let componentId = (component.typeName === component.name) ? component.typeName : component.typeName + ':' + component.name
    return {
      label: componentId,
      value: componentId
    }
  })
}

</script>