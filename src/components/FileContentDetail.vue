<template>
  <el-descriptions :column="1">
    <el-descriptions-item label="下载路径:">{{ file?.fileDownloadPath }}</el-descriptions-item>
    <el-descriptions-item label="目标路径:">{{ `${file?.targetSavePath}/${file?.targetFilename}` }}
    </el-descriptions-item>
    <el-descriptions-item label="状态:">
      <el-tag size="large" :type="fileStatusOf(file?.status).type">
        {{ fileStatusOf(file?.status).label }}
      </el-tag>
    </el-descriptions-item>
    <el-descriptions-item label="URI:" v-if="file?.fileUri">
      <el-link type="info" :underline="false">{{ file?.fileUri }}</el-link>
    </el-descriptions-item>
    <el-descriptions-item label="模板:">
      <div>路径:{{ file?.fileSavePathPattern }}</div>
      <div>文件名:{{ file?.filenamePattern }}</div>
    </el-descriptions-item>
    <el-descriptions-item label="标签:" v-if="file?.tags?.length && file?.tags?.length > 0">
      <el-tag v-for="(tag, index) in file?.tags" :key="index">{{ tag }}</el-tag>
    </el-descriptions-item>
    <el-descriptions-item label="属性:" v-if="Object.keys(file?.attrs??{}).length > 0">
      <el-tag
          v-for="(attr, index) in file?.attrs" :key="index"
      >{{ index + ':' + attr }}
      </el-tag>
    </el-descriptions-item>
    <el-descriptions-item label="变量:" v-if="Object.keys(file?.patternVariables??{}).length > 0">
      <el-tag
          v-for="(v, index) in file?.patternVariables" :key="index"
      >{{ index + ':' + v }}
      </el-tag>
    </el-descriptions-item>
    <el-descriptions-item label="已处理变量:" v-if="Object.keys(file?.processedVariables??{}).length > 0">
      <el-tag
          v-for="(v, index) in file?.processedVariables" :key="index"
      >{{ index + ':' + v }}
      </el-tag>
    </el-descriptions-item>
  </el-descriptions>
</template>

<script setup lang="ts">
import {defineProps} from 'vue';
import {FileContent, fileStatusOf} from "~/services/data.service";

const props = defineProps<{ file?: FileContent | null }>();

</script>
