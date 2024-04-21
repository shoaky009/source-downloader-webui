<template>
  <el-table :data="components" style="width: 100%">
    <el-table-column label="Name" width="180" align="center">
      <template #default="scope">
        <span>{{ scope.row.name }}</span>
      </template>
    </el-table-column>
    <el-table-column label="Type" width="180" align="center">
      <template #default="scope">
        <span>{{ scope.row.type }}</span>
      </template>
    </el-table-column>
    <el-table-column label="TypeName" width="180" align="center">
      <template #default="scope">
        <span>{{ scope.row.typeName }}</span>
      </template>
    </el-table-column>
    <el-table-column prop="refs" label="Refs" align="center">
      <template #default="scope">
        <el-tag v-for="item in scope.row.refs">
          {{ item }}
        </el-tag>
      </template>
    </el-table-column>
    <el-table-column label="Operations">
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

<script lang="ts">
import {ElButton, ElTag,} from "element-plus";
import {defineComponent, ref} from "vue";
import {Component} from "~/services/processing-content.service";
import {componentService} from "~/services/data.service";

export default defineComponent({
  name: 'Component',
  data() {
    return {
      components: ref<Component[]>([]),
    };
  },
  methods: {
    loadMore() {
      componentService.query({}).then(response => {
        this.components = response
      })
    }
  },
  created() {
    this.loadMore();
  },
  setup() {
    const handleEdit = (index: number, component: Component) => {
      console.log(index, component)
    }
    const handleDelete = (index: number, component: Component) => {
      console.log(index, component)
    }
    const handleReload = async (component: Component) => {
      await componentService.reload(component)
    }
    return {handleEdit, handleDelete, handleReload}
  },
});
</script>