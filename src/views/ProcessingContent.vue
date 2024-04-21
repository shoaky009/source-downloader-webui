<template>
  <el-table :data="items" row-key="id"
            v-infinite-scroll="loadMore"
            infinite-scroll-immediate="false"
            infinite-scroll-delay="1000"
            infinite-scroll-distance="5"
            v-loading.lock="loading"
  >
    <el-table-column type="expand">
      <template #default="props">
        <el-table :data="props.row.itemContent.fileContents">
          <el-table-column label="下载路径" prop="fileDownloadPath"/>
          <el-table-column label="目标路径"
                           :formatter="(row:FileContent) => `${row.targetSavePath}/${row.targetFilename}`"/>
          <el-table-column label="Status" prop="status"/>
          <el-table-column label="Tags" prop="tags"/>
          <el-table-column label="Errors" prop="errors"/>
        </el-table>
      </template>
    </el-table-column>
    <el-table-column prop="id" label="ID" fixed/>
    <el-table-column prop="processorName" label="ProcessorName"/>
    <el-table-column prop="itemContent.sourceItem.title" label="Title"/>
    <el-table-column prop="itemContent.fileContents.length" label="Files"/>
    <el-table-column prop="status" label="Status"/>
    <el-table-column prop="createTime" label="CreateTime"/>
  </el-table>
</template>


<script setup lang="ts">
import {onMounted, ref} from 'vue';
import {FileContent, ProcessingContent} from "~/services/processing-content.service";
import {processingContentService} from "~/services/data.service";

const items = ref<ProcessingContent[]>([]);
let maxId = 0;
const loading = ref(false);
const loadMore = () => {
  loading.value = true
  processingContentService.query({
    'maxId': maxId.toString(),
  }).then(response => {
    const contents = response.contents;
    items.value = items.value.concat(contents);
    const nextMaxId = response.nextMaxId;
    if (nextMaxId) {
      maxId = nextMaxId;
    }
  }).finally(() => {
    loading.value = false;
  })
};

onMounted(() => {
  loadMore();
});
</script>