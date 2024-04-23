<template>
  <el-dialog
      v-model="isOpen"
      width="500"
      center
  >
    <el-form :model="processorForm" label-width="auto" style="max-width: 600px">
      <el-form-item label="名称">
        <el-input v-model="processorForm.name" />
      </el-form-item>
      <el-form-item label="源">
        <ComponentSelector type="source" v-model="processorForm.source" />
      </el-form-item>
    </el-form>
    <el-button type="primary" @click="onSubmit">确定</el-button>
  </el-dialog>
</template>
<script setup lang="ts">
import {ref, toRefs, reactive} from 'vue'
import ComponentSelector from "~/views/biz/ComponentSelector.vue";

const props = defineProps<{
  processorName?: string,
}>();
const isOpen = ref(false);

const {processorName} = toRefs(props)

const processorForm = reactive({
  options: {
    downloadOptions: {}
  }
});

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
    // {type: 'text', label: '标签', name: 'tags'},
    {
      type: 'object', label: '选项', name: 'options',
      formProps: {
        center: true
      },
      children: [
        {type: 'text', label: '目标路径模版', name: 'savePathPattern'},
        {type: 'text', label: '文件名模版', name: 'filenamePattern'},
        {
          type: 'component-selector',
          label: '变量提供',
          name: 'variableProviders',
          additionalProps: {type: 'variableProvider', multiple: true}
        },
        // {
        //   type: 'component-selector',
        //   label: '处理监听',
        //   name: 'processListeners',
        //   additionalProps: {type: 'processListener', multiple: true}
        // },
        {
          type: 'component-selector',
          label: 'Item过滤器',
          name: 'sourceItemFilters',
          additionalProps: {type: 'sourceItemFilter', multiple: true}
        },
        {
          type: 'component-selector',
          label: '处理内容过滤器',
          name: 'itemContentFilters',
          additionalProps: {type: 'itemContentFilter', multiple: true}
        },
        {
          type: 'component-selector',
          label: '文件过滤器',
          name: 'fileContentFilters',
          additionalProps: {type: 'fileContentFilter', multiple: true}
        },
        {
          type: 'component-selector',
          label: '文件标签器',
          name: 'fileTaggers',
          additionalProps: {type: 'tagger', multiple: true}
        },
        {
          type: 'component-selector',
          label: '文件存在检测器',
          name: 'fileExistsDetector',
          additionalProps: {type: 'fileExistsDetector', multiple: false}
        },
        {
          type: 'component-selector',
          label: '变量替换',
          name: 'variableReplacers',
          additionalProps: {type: 'variableReplacer', multiple: true}
        },
        {
          type: 'component-selector',
          label: '文件替换策略',
          name: 'fileReplacementDecider',
          additionalProps: {type: 'fileReplacementDecider', multiple: false}
        },
        {type: 'switch', label: '保存处理内容', name: 'saveProcessingContent'},
        //itemGrouping
        //fileGrouping
        {type: 'text', label: '重命名间隔', name: 'renameTaskInterval'},
        {
          type: 'object', label: '下载选项', name: 'downloadOptions',
          formProps: {
            center: false
          },
          children: [
            {type: 'text', label: '类目', name: 'category'},
            // {type: 'text', label: '标签', name: 'tags'},
            // {type: 'text', label: '请求头', name: 'headers'},
          ]
        },
        {
          type: 'base-select',
          label: '变量冲突策略',
          name: 'variableConflictStrategy',
          additionalProps: {
            options: [
              {text: '任意', value: 'ANY'},
              {text: '值相同的数量最多的', value: 'VOTE'},
              {text: '根据Provider定义的精度', value: 'ACCURACY'},
              {text: 'VOTE+SMART', value: 'SMART'},
            ]
          }
        },
        {
          type: 'base-select',
          label: '变量错误策略',
          name: 'variableErrorStrategy',
          additionalProps: {
            options: [
              {text: '保留原有', value: 'ORIGINAL'},
              {text: '模板', value: 'PATTERN'},
              {text: '停留', value: 'STAY'},
              {text: 'to_unresolved', value: 'TO_UNRESOLVED'},
            ]
          }
        },
        {
          type: 'text',
          label: '变量名替换',
          name: 'variableNameReplace',

        },
        {
          type: 'number',
          label: '重命名次数阈值',
          name: 'renameTimesThreshold',
        },
        {
          type: 'number',
          label: '数据源条数限制',
          name: 'fetchLimit',
        },
        {
          type: 'switch',
          label: '数据指针批处理',
          name: 'pointerBatchMode',
        },
        {
          type: 'switch',
          label: 'Item异常继续处理',
          name: 'itemErrorContinue',
        },
        {
          type: 'number',
          label: '异常重试间隔(毫秒)',
          name: 'retryBackoffMills',
        },
        {
          type: 'text',
          label: '任务分组',
          name: 'taskGroup',
        },
        // variableProcessChain
      ]
    }
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