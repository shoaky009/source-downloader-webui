<template>
  <el-button :icon="Plus" circle @click="handleCreateForm"/>
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
          <el-button size="small" @click="handleStateClick(scope.row)">
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
        <el-button size="small" @click="handleDryRun(scope.row)">
          演练
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

  <ShowSourceState :processor-name="stateProcessor" v-model="stateJsonViewer"/>
  <ProcessorDryRun :processor-name="dryRunProcessor" :open-form="openDryRunForm" @dialog-close="handleDryRunFormClose"/>
  <ProcessorForm v-model="creationFormOpen"/>
</template>

<script setup lang="ts">
import {ElButton, ElSwitch, ElTag} from "element-plus";
import {Plus,} from "@element-plus/icons-vue";
import {ref} from "vue";
import {Processor, processorService} from "~/services/data.service";

import "vue3-json-viewer/dist/index.css";
import ShowSourceState from "~/views/biz/ShowSourceState.vue";
import ProcessorDryRun from "~/views/biz/ProcessorDryRun.vue";
import ProcessorForm from "~/views/biz/ProcessorForm.vue";

const operationDescription = `
<div>
重载: 重新创建处理器实例<br/>
演练: 模拟处理器执行,不执行下载等实际行为<br/>
触发: 手动触发处理器执行<br/>
移动: 执行可移动的Item<br/>
</div>
`;

const processors = ref<Processor[]>([]);
const loadMore = () => {
  processorService.query().then(response => {
    processors.value = response;
  });
};

const creationFormOpen = ref(false)
const handleCreateForm = () => {
  creationFormOpen.value = true
};

//=========
const handleEnable = (index: number, processor: Processor) => {
  console.log(index, processor);
};

//=========
const handleEdit = (index: number, processor: Processor) => {
  console.log(index, processor);
};
//=========
const handleReload = (processor: Processor) => {
  processorService.reload(processor.name);
};

//=========
const stateJsonViewer = ref(false)
const stateProcessor = ref<string>()
const handleStateClick = (processor: Processor) => {
  stateProcessor.value = processor.name
  stateJsonViewer.value = true;
};

//=========
const openDryRunForm = ref(false)
const dryRunProcessor = ref<string>()

const handleDryRun = (processor: Processor) => {
  openDryRunForm.value = true
  dryRunProcessor.value = processor.name
};

const handleDryRunFormClose = () => {
  openDryRunForm.value = false
};

//=========
const handleTrigger = (processor: Processor) => {
  processorService.trigger(processor.name);
};

//=========
const handleRename = (processor: Processor) => {
  processorService.rename(processor.name);
};

//=========
const handleDelete = (index: number, processor: Processor) => {
  console.log(index, processor);
};

loadMore();
</script>