<template>
  <el-descriptions :column="1">
    <el-descriptions-item label="标题:">
      <el-tooltip :content="sourceItem?.title">
        <el-text class="w-400px ellipsis-text">{{ sourceItem?.title }}</el-text>
      </el-tooltip>
    </el-descriptions-item>
    <el-descriptions-item label="链接:">
      <el-link type="primary" :href="sourceItem?.link" target="_blank" :underline="false">
        {{ sourceItem?.link }}
      </el-link>
    </el-descriptions-item>
    <el-descriptions-item label="时间:">{{ sourceItem?.datetime }}</el-descriptions-item>
    <el-descriptions-item label="类型:">{{ sourceItem?.contentType }}</el-descriptions-item>
    <el-descriptions-item label="下载链接:">
      <el-tooltip :content="sourceItem?.downloadUri">
        <el-text type="info" class="w-400px ellipsis-text" >{{ sourceItem?.downloadUri }}</el-text>
      </el-tooltip>
    </el-descriptions-item>
    <el-descriptions-item label="标签:" v-if="sourceItem?.tags?.length && sourceItem?.tags?.length > 0">
      <el-tag v-for="(tag, index) in sourceItem?.tags" :key="index">{{ tag }}</el-tag>
    </el-descriptions-item>
    <el-descriptions-item label="属性:" v-if="Object.keys(sourceItem?.attrs??{}).length > 0">
      <el-tag v-for="(attr, index) in sourceItem?.attrs" :key="index">
        {{ index + ':' + attr }}
      </el-tag>
    </el-descriptions-item>
    <el-descriptions-item label="变量:" v-if="Object.keys(content?.itemVariables??{}).length > 0">
      <el-tag v-for="(v, index) in content?.itemVariables" :key="index">
        {{ index + ':' + v }}
      </el-tag>
    </el-descriptions-item>
  </el-descriptions>
</template>

<script setup lang="ts">
import {ItemContent} from "~/services/data.service";

const props = defineProps<{ content?: ItemContent | null }>();
const sourceItem = props.content?.sourceItem
</script>

<style>
.ellipsis-text {
  display: inline-block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: middle;
}
</style>