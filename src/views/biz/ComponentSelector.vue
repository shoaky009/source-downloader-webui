<template>
  <el-select
      v-model="value"
      filterable
      style="width: 240px"
      :multiple="multiple"
      @focus="loadOptions"
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

const props = withDefaults(
    defineProps<{
      type: string,
      multiple: boolean,
    }>(),
    {
      multiple: false,
    }
)
const {type, multiple} = toRefs(props)
const options = ref()
const value = ref<string | string[]>()

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