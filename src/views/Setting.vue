<template>
  <div>
    <h1>Setting</h1>
    <p>Welcome to the Setting page!</p>
  </div>
  <el-descriptions title="Application">
    <el-descriptions-item label="BuildTime">{{ info?.time }}</el-descriptions-item>
    <el-descriptions-item label="Version">{{ info?.version }}</el-descriptions-item>
    <el-descriptions-item label="Artifact">{{ info?.artifact }}</el-descriptions-item>
  </el-descriptions>
</template>

<script lang="ts">
import {defineComponent, ref} from 'vue';
import {applicationService} from "~/services/data.service";
import {ApplicationInfo} from "~/services/processing-content.service";

export default defineComponent({
  name: 'Setting',
  data() {
    return {
      info: ref<ApplicationInfo>(),
    };
  },
  created() {
    applicationService.info().then(response => {
      this.info = response
    })
  },
});
</script>