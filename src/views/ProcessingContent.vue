<template>
  <el-table :data="items" row-key="id"
            v-infinite-scroll="loadMore"
            infinite-scroll-immediate="false"
            infinite-scroll-delay="1000"
            infinite-scroll-distance="5"
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


<script lang="ts">
import {defineComponent, ref} from 'vue';
import {FileContent, ProcessingContent, ScrollResponse} from "~/services/processing-content.service";
import {processingContentService} from "~/services/data.service";

export default defineComponent({
  name: 'ProcessingContent',
  data() {
    return {
      items: ref<ProcessingContent[]>([]),
      maxId: 0,
    };
  },
  methods: {
    loadMore() {
      processingContentService.query({
        'maxId': this.maxId.toString(),
      }).then(response => {
        const contents = response.contents
        this.items = this.items.concat(contents);
        const nextMaxId = response.nextMaxId
        if (nextMaxId) {
          this.maxId = nextMaxId
        }
      })
    }
  },
  created() {
    this.loadMore();
  }
});
</script>