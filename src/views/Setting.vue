<template>
  <div>
    <h1>Setting</h1>
    <p>Welcome to the Setting page!</p>
  </div>
  <el-descriptions title="BuildInfo" :column="1">
    <el-descriptions-item label="UI:">{{ uiAppInfo }}</el-descriptions-item>
    <el-descriptions-item label="Backend:">{{ backendAppInfo }}</el-descriptions-item>
  </el-descriptions>
</template>

<script lang="ts" setup>
import {ref, onMounted} from 'vue';
import {actuatorService} from '~/services/data.service';

const uiAppInfo = ref(__APP_INFO__);
const backendAppInfo = ref();

onMounted(async () => {
  const response = await actuatorService.info();
  backendAppInfo.value = response.data
});
</script>