<template>
  <div>
    <h1>Setting</h1>
    <p>Welcome to the Setting page!</p>
  </div>
  <el-descriptions title="Info">
    <el-descriptions-item label="BuildTime">{{ build?.time }}</el-descriptions-item>
    <el-descriptions-item label="Version">{{ build?.version }}</el-descriptions-item>
    <el-descriptions-item label="Branch">{{ git?.branch }}</el-descriptions-item>
    <el-descriptions-item label="CommitId">{{ git?.commit?.id }}</el-descriptions-item>
    <el-descriptions-item label="CommitTime">{{ git?.commit?.time }}</el-descriptions-item>
  </el-descriptions>
</template>

<script lang="ts">
import {defineComponent, ref} from 'vue';
import {actuatorService} from "~/services/data.service";

export default defineComponent({
  name: 'Setting',
  data() {
    return {
      build: ref(),
      git: ref(),
    };
  },
  async created() {
    const response = await actuatorService.info()
    this.build = response.data.build
    this.git = response.data.git
  },
});
</script>