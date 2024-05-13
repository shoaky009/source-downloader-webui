<template>
  <el-row>
    <el-col :span="1">
      <el-button :icon="Plus" circle @click="handleCreateForm"/>
    </el-col>
    <el-col :span="4">
      <el-input v-model="processNameFilter" placeholder="处理器名称" clearable/>
    </el-col>
  </el-row>

  <el-table
      :data="filteredData"
      style="width: 100%"
      v-loading="loading"

  >
    <el-table-column label="名称" width="180" align="center">
      <template #default="scope">
        <span>{{ scope.row.name }}</span>
      </template>
    </el-table-column>
    <el-table-column label="上一次触发时间" width="180" align="center">
      <template #default="scope">
        <span>{{ scope.row.lastTriggerTime }}</span>
      </template>
    </el-table-column>

    <el-table-column width="100%" align="center">
      <template #header>
        <el-tooltip effect="dark" :content="detailDescription" placement="top" raw-content>
          详情
        </el-tooltip>
      </template>
      <template #default="scope">
        <el-button size="small" @click="handleStateClick(scope.row)">
          Pointer
        </el-button>
      </template>
    </el-table-column>
    <el-table-column label="类目" width="100%" align="center">
      <template #default="scope">
        <span>{{ scope.row.category }}</span>
      </template>
    </el-table-column>
    <el-table-column prop="tags" label="标签" width="100%" align="center">
      <template #default="scope">
        <el-tag v-for="item in scope.row.tags">
          {{ item }}
        </el-tag>
      </template>
    </el-table-column>
    <el-table-column label="开启" width="100%" align="center">
      <template #default="scope">
        <el-switch v-model="scope.row.enabled" @change="handleEnable(scope.$index, scope.row)"/>
      </template>
    </el-table-column>
    <el-table-column>
      <template #header>
        <el-tooltip effect="dark" :content="operationDescription" placement="top" raw-content>
          操作
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
  <el-dialog v-model="openDryRunForm" center>
    <ProcessorDryRun :processor-name="dryRunProcessor"/>
  </el-dialog>
  <el-dialog v-model="creationFormOpen">
    <ProcessorForm/>
  </el-dialog>
</template>

<script setup lang="ts">
import {ElButton, ElSwitch, ElTag} from "element-plus";
import {Plus,} from "@element-plus/icons-vue";
import {computed, ref} from "vue";
import {Processor, processorService} from "~/services/data.service";

import "vue3-json-viewer/dist/index.css";
import ShowSourceState from "~/components/ShowSourceState.vue";
import ProcessorDryRun from "~/components/ProcessorDryRun.vue";
import ProcessorForm from "~/components/ProcessorForm.vue";

const operationDescription = `
<div>
重载: 重新创建处理器实例<br/>
演练: 模拟处理器执行,不执行下载等实际行为<br/>
触发: 手动触发处理器执行<br/>
移动: 执行可移动的Item<br/>
</div>
`;
const detailDescription = `
<div>
Pointer: 数据源的处理进度<br/>
</div>
`

const loading = ref(false);
const processors = ref<Processor[]>([]);
const loadMore = () => {
  loading.value = true
  processorService.query().then(response => {
    processors.value = response;
  }).finally(() => {
    loading.value = false
  })
};

const processNameFilter = ref<string>('')
const filteredData = computed(() => {
  if (processNameFilter.value) {
    return processors.value.filter(item => item.name.includes(processNameFilter.value));
  } else {
    return processors.value;
  }
});
//=========
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