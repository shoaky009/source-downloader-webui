<template>
  <vue-form v-model="model" :schema="schema" :ui-schema="uiSchema">
    <div v-for="(item, index) in keyValuePairs" :key="index" class="key-value-pair">
      <el-input v-model="item.key" :placeholder="props.uiSchema['ui:placeholder']?.key || 'Key'"
                class="input-field"></el-input>
      <el-input v-model="item.value" :placeholder="props.uiSchema['ui:placeholder']?.value || 'Value'"
                class="input-field"></el-input>
      <el-button type="danger" @click="removePair(index)" :icon="Minus" circle/>
    </div>
    <el-button type="primary" @click="addPair" :icon="Plus">添加</el-button>
  </vue-form>
</template>

<script setup lang="ts">

import {
  Plus,
  Minus,
} from '@element-plus/icons-vue'
import {watch, ref, defineModel} from 'vue';
import VueForm, {fieldProps, vueUtils} from '@lljj/vue3-form-element';

const model = defineModel()
const schema = ref({})
const uiSchema = ref({})
const props = defineProps({
  ...fieldProps,
});

const keyValuePairs = ref(Object.entries(props.value || {}).map(([key, value]) => ({key, value})));

const addPair = () => {
  keyValuePairs.value.push({key: '', value: ''});
};
const removePair = (index: number) => {
  keyValuePairs.value.splice(index, 1);
};

watch(keyValuePairs, (newPairs) => {
  const result = newPairs.reduce((acc, pair) => {
    if (pair.key) {
      acc[pair.key] = pair.value;
    }
    return acc;
  }, {} as Record<string, string | number>);
  vueUtils.setPathVal(props.rootFormData, props.curNodePath, result);
}, {deep: true});
</script>


<style scoped>
.key-value-pair {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.input-field {
  width: 45%;
  margin-right: 10px;
}
</style>