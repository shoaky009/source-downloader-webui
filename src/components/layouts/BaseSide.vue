<template>
  <el-menu
      default-active="2"
      class="el-menu-vertical-demo"
      :collapse="isCollapse"
      @open="handleOpen"
      @close="handleClose"
      router
      mode="vertical"
  >
    <el-menu-item index="/processor">
      <el-icon>
        <processor/>
      </el-icon>
      <template #title>处理器</template>
    </el-menu-item>
    <el-menu-item index="/component">
      <icon-menu/>
      <template #title>组件</template>
    </el-menu-item>
    <el-menu-item index="/processing-content">
      <el-icon>
        <document/>
      </el-icon>
      <template #title>记录</template>
    </el-menu-item>
    <el-menu-item index="/setting">
      <el-icon>
        <setting/>
      </el-icon>
      <template #title>设置</template>
    </el-menu-item>
  </el-menu>
</template>

<script lang="ts" setup>
import {ref} from "vue";
import {
  Document,
  Menu as IconMenu,
  Setting,
} from "@element-plus/icons-vue";
import Processor from "~/components/Processor.vue";

const isCollapse = ref(true);
const handleOpen = (key: string, keyPath: string[]) => {
  console.log(key, keyPath);
};
const handleClose = (key: string, keyPath: string[]) => {
  console.log(key, keyPath);
};
</script>
