<template>
  <el-dialog
      v-model="isOpen"
      width="500"
      center
  >
    <DynamicForm
        :options="formOptions"
        :model="formModel"
        @submit="onSubmit"
    />
    <el-button type="primary" @click="onSubmit">确定</el-button>
  </el-dialog>
</template>
<script setup lang="ts">
import {ref, toRefs,} from 'vue'
import {DynamicForm, IDynamicFormOptions} from '@imengyu/vue-dynamic-form';

const props = defineProps<{
  processorName?: string,
}>();
const isOpen = ref(false);

const {processorName} = toRefs(props)
const formModel = ref({});

const formOptions: IDynamicFormOptions = {
  formItems: [
    {type: 'text', label: '名称', name: 'name', additionalProps: {required: true}},
    {type: 'component-selector', label: '源', name: 'source', additionalProps: {type: 'source', multiple: false}},
    {type: 'component-selector', label: '触发器', name: 'triggers', additionalProps: {type: 'trigger', multiple: true}},
    {
      type: 'component-selector',
      label: '文件解析器',
      name: 'itemFileResolver',
      additionalProps: {type: 'itemFileResolver', multiple: false}
    },
    {
      type: 'component-selector',
      label: '下载器',
      name: 'downloader',
      additionalProps: {type: 'downloader', multiple: false}
    },
    {
      type: 'component-selector',
      label: '移动器',
      name: 'fileMover',
      additionalProps: {type: 'fileMover', multiple: false}
    },
    {type: 'text', label: '保存路径', name: 'savePath'},
    {type: 'switch', label: '开启', name: 'enabled'},
    {type: 'text', label: '类目', name: 'category'},
    {type: 'text', label: '标签', name: 'category'},
  ],
  formRules: {
    name: [{required: true, message: '请输入名称'}],
    savePath: [{required: true, message: '请输入名称'}],
  }
};

function onSubmit() {
  console.log('提交数据', formModel.value);
}
</script>