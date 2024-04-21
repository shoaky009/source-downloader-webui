<template>
  <el-menu class="el-menu-demo" mode="horizontal">
    <el-menu-item index="1">SourceDownloader</el-menu-item>
    <el-tooltip content="黑夜模式">
      <el-menu-item h="full" @click="toggleDark()">
        <button class="border-none w-full bg-transparent cursor-pointer"
                style="height: var(--ep-menu-item-height)">
          <i inline-flex i="dark:ep-moon ep-sunny"/>
        </button>
      </el-menu-item>
    </el-tooltip>
    <el-tooltip content="重载应用">
      <el-menu-item @click="handleReload()">
        <el-icon>
          <refresh/>
        </el-icon>
      </el-menu-item>
    </el-tooltip>
  </el-menu>
</template>

<script lang="ts" setup>
import {toggleDark} from "~/composables";
import {Refresh} from "@element-plus/icons-vue";
import {applicationService} from "~/services/data.service";
import {ElLoading, ElMessage} from "element-plus";

const handleReload = async () => {
  const instance = ElLoading.service({fullscreen: true})
  await applicationService.reload()
      .then(_ => {
        ElMessage({
          message: '重载完成',
          type: 'success',
        })
      })
      .catch(err => {
        console.log(err)

        ElMessage({
          message: err.response?.data?.detail ?? err.message,
          type: 'error',
        })
      })
      .finally(() => {
        instance.close();
      })
};
</script>