<template>
  <el-row>
    <el-col :span="1">
      <el-button :icon="Plus" circle @click="handleCreateForm"/>
    </el-col>
  </el-row>
  <el-table :data="components"
            style="width: 100%"
            v-loading="loading"
            :row-key="(row) => `${row.type}:${row.typeName}:${row.name}`"
            :row-class-name="rowClassName"
            @expand-change="recordExpanded"
  >
    <el-table-column type="expand">
      <template #default="props">
        <el-row>
          <el-col :span="24">
            <div>状态信息:</div>
            <pre>{{ props.row.stateDetail }}</pre>
          </el-col>
        </el-row>
      </template>
    </el-table-column>
    <el-table-column label="类型" width="180" align="center" prop="type"/>
    <el-table-column label="类型名称" width="180" align="center" prop="typeName"/>
    <el-table-column label="名称" width="180" align="center" prop="name"/>
    <el-table-column label="引用" align="center">
      <template #default="scope">
        <el-tag v-for="item in scope.row.refs">
          {{ item }}
        </el-tag>
      </template>
    </el-table-column>
    <el-table-column label="操作" align="center">
      <template #default="scope">
        <el-button size="small" @click="handleEdit(scope.$index, scope.row)">
          WIP编辑
        </el-button>
        <el-button size="small" @click="handleReload(scope.row)">
          重载
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
  <el-dialog v-model="creationFormOpen">
    <ComponentForm/>
  </el-dialog>
</template>

<script setup lang="ts">
import {ElButton, ElTag} from "element-plus";
import {onMounted, ref} from "vue";
import {Component, componentService} from "~/services/data.service";
import {Plus} from "@element-plus/icons-vue";
import ComponentForm from "~/components/ComponentForm.vue";

const loading = ref(false)
const components = ref<Component[]>([])
const rowClassName = ({row}: { row: Component }) => {
  if (row.stateDetail == null) {
    return 'row-expand-cover'
  }
}

const loadMore = async () => {
  loading.value = true
  try {
    components.value = await componentService.query({})
  } finally {
    loading.value = false
  }
}

onMounted(loadMore)

const handleEdit = (index: number, component: Component) => {
  console.log(index, component)
}

const handleDelete = (index: number, component: Component) => {
  console.log(index, component)
}

const handleReload = async (component: Component) => {
  await componentService.reload(component)
}

// state stream
const handleStateUpdate = (event: MessageEvent) => {
  const [type, typeName, name] = event.lastEventId.split(":")
  components.value.filter((component) => {
    return component.type === type && component.typeName === typeName && component.name === name
  }).forEach((component) => {
    component.stateDetail = JSON.parse(event.data)
  })
}

let eventSource: EventSource | null = null
const recordExpanded = (_: Component, expandedRows: Component[]) => {
  if (eventSource) {
    eventSource.close()
  }

  const id = expandedRows.map(row => {
    return `${row.type}:${row.typeName}:${row.name}`
  })
  if (id.length == 0) {
    return
  }
  eventSource = componentService.stateStream(id)
  if (eventSource) {
    eventSource.addEventListener('component-state', handleStateUpdate);
  }
}

// form
const creationFormOpen = ref(false)
const handleCreateForm = () => {
  creationFormOpen.value = true
};

</script>

<style>
.row-expand-cover .ep-table__expand-icon {
  visibility: hidden;
}
</style>