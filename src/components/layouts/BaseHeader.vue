<script lang="ts" setup>
import {toggleDark} from "~/composables";
import {Refresh} from "@element-plus/icons-vue";
import {applicationService} from "~/services/data.service";
</script>

<template>
  <el-menu class="el-menu-demo" mode="horizontal">
    <el-menu-item index="1">SourceDownloader</el-menu-item>
    <el-menu-item h="full" @click="toggleDark()">
      <button class="border-none w-full bg-transparent cursor-pointer"
              style="height: var(--ep-menu-item-height)">
        <i inline-flex i="dark:ep-moon ep-sunny"/>
      </button>
    </el-menu-item>
    <el-menu-item @click="applicationService.reload()">
      <el-icon>
        <refresh/>
      </el-icon>
    </el-menu-item>
  </el-menu>
</template>