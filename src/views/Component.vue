<template>
  <el-table :data="components" style="width: 100%" v-loading="loading">
    <el-table-column label="名称" width="180" align="center">
      <template #default="scope">
        <span>{{ scope.row.name }}</span>
      </template>
    </el-table-column>
    <el-table-column label="类型" width="180" align="center">
      <template #default="scope">
        <span>{{ scope.row.type }}</span>
      </template>
    </el-table-column>
    <el-table-column label="类型名称" width="180" align="center">
      <template #default="scope">
        <span>{{ scope.row.typeName }}</span>
      </template>
    </el-table-column>
    <el-table-column prop="引用" label="Refs" align="center">
      <template #default="scope">
        <el-tag v-for="item in scope.row.refs">
          {{ item }}
        </el-tag>
      </template>
    </el-table-column>
    <el-table-column label="操作">
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
</template>

<script setup lang="ts">
import {ElButton, ElTag,} from "element-plus";
import {ref, onMounted} from "vue";
import {Component, componentService} from "~/services/data.service";

const loading = ref(false)
const components = ref<Component[]>([])

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
</script>