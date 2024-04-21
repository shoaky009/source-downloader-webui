<template>
  <el-table :data="processors" style="width: 100%">
    <el-table-column label="Name" width="180" align="center">
      <template #default="scope">
        <span>{{ scope.row.name }}</span>
      </template>
    </el-table-column>
    <el-table-column label="LastTriggerTime" width="180" align="center">
      <template #default="scope">
        <span>{{ scope.row.lastTriggerTime }}</span>
      </template>
    </el-table-column>
    <el-table-column label="Enabled" width="100%" align="center">
      <template #default="scope">
        <el-switch v-model="scope.row.enabled" @change="handleEnable(scope.$index, scope.row)"/>
      </template>
    </el-table-column>
    <el-table-column label="Details" width="100%" align="center">
      <template #default="scope">
        <el-tooltip content="数据源的处理进度">
          <el-button size="small" @click="showState(scope.row)">
            Pointer
          </el-button>
        </el-tooltip>
      </template>
    </el-table-column>
    <el-table-column label="Category" width="100%" align="center">
      <template #default="scope">
        <span>{{ scope.row.category }}</span>
      </template>
    </el-table-column>
    <el-table-column prop="tags" label="Tags" width="100%" align="center">
      <template #default="scope">
        <el-tag v-for="item in scope.row.tags">
          {{ item }}
        </el-tag>
      </template>
    </el-table-column>
    <el-table-column>
      <template #header>
        <el-tooltip effect="dark" :content="operationDescription" placement="top" raw-content>
          Operations
        </el-tooltip>
      </template>

      <template #default="scope">
        <el-button size="small" @click="handleEdit(scope.$index, scope.row)">
          WIP编辑
        </el-button>
        <el-button size="small" @click="handleReload(scope.row)">
          重载
        </el-button>
        <el-button size="small" @click="handleDryRun(scope.$index, scope.row)">
          WIP演练
        </el-button>
        <el-button size="small" @click="handleTrigger(scope.row)">
          触发
        </el-button>
        <el-button size="small" @click="handleRename(scope.row)">
          移动
        </el-button>
        <el-button
            size="small"
            type="danger"
            @click="handleDelete(scope.$index, scope.row)"
        >
          WIP删除
        </el-button>
      </template>
    </el-table-column>
  </el-table>


  <el-dialog
      v-model="showJsonViewer"
      width="500"
      destroy-on-close
      center
  >
    <JsonViewer :value="jsonData" copyable boxed :theme="isDark ? 'dark' : 'light'"/>
  </el-dialog>
</template>

<script setup lang="ts">
import {ElButton, ElSwitch, ElTag} from "element-plus";
import {ref} from "vue";
import {Processor} from "~/services/processing-content.service";
import {processorService} from "~/services/data.service";

import {JsonViewer} from 'vue3-json-viewer'
import "vue3-json-viewer/dist/index.css";
import {isDark} from "~/composables";

const operationDescription = `
<div>
重载: 重新创建处理器实例<br/>
演练: 模拟处理器执行,不执行下载等实际行为<br/>
触发: 手动触发处理器执行<br/>
移动: 执行可移动的Item<br/>
</div>
`;

const processors = ref<Processor[]>([]);
const showJsonViewer = ref(false)
const jsonData = ref({})

const loadMore = () => {
  processorService.query().then(response => {
    processors.value = response;
  });
};

const handleEdit = (index: number, processor: Processor) => {
  console.log(index, processor);
};

const handleDelete = (index: number, processor: Processor) => {
  console.log(index, processor);
};

const handleTrigger = (processor: Processor) => {
  processorService.trigger(processor.name);
};

const handleDryRun = (index: number, processor: Processor) => {
  console.log(index, processor);
};

const handleEnable = (index: number, processor: Processor) => {
  console.log(index, processor);
};

const handleReload = (processor: Processor) => {
  processorService.reload(processor.name);
};
const handleRename = (processor: Processor) => {
  processorService.rename(processor.name);
};

const showState = async (processor: Processor) => {
  const response = await processorService.sourceState(processor.name);
  jsonData.value = response.data.pointer;
  showJsonViewer.value = true;
};

loadMore();
</script>