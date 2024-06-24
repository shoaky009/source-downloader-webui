<template>
  <el-affix :offset="80">
    <el-row>
      <el-col :span="4">
        <ProcessorSelector @update:selected="handleSelectedProcessors"/>
      </el-col>
      <el-col :span="4">
        <el-select
            v-model="status"
            multiple
            placeholder="状态"
            collapse-tags
            :max-collapse-tags="2"
            @blur="handleStatusSelected"
        >
          <el-option
              v-for="item in processingContentStatuses"
              :key="item.value"
              :label="item.label"
              :value="item.value"
          />
        </el-select>
      </el-col>
      <el-col :span="4">
        <el-input v-model="itemHash" placeholder="条目哈希" clearable @blur="handleItemHashBlur"/>
      </el-col>
    </el-row>
    <el-row>
      <el-col :span="4">
        <el-input v-model="itemTitle" placeholder="条目标题" clearable @input="handleItemTitleChange"/>
      </el-col>
      <el-col :span="4">
        <el-date-picker
            v-model="createTimeRange"
            type="datetimerange"
            :shortcuts="shortcuts"
            range-separator="To"
            start-placeholder="Start date"
            end-placeholder="End date"
            value-format="YYYY-MM-DDTHH:mm:ss"
            @change="handleDateChange"
        />
      </el-col>
    </el-row>
  </el-affix>

  <el-table
      :data="itemContents" row-key="id"
      v-infinite-scroll="loadMore"
      infinite-scroll-immediate="false"
      infinite-scroll-delay="1000"
      infinite-scroll-distance="5"
      v-loading.lock="loading"
      style="width: 100%"
      ref="tableRef"
  >
    <el-table-column prop="id" width="200px">
      <template #default="scope">
        <el-tag size="large" type="info" class="column-layout">ID:{{ scope.row.id }}</el-tag>
        <el-tag size="large" type="info" class="column-layout">处理器:{{ scope.row.processorName }}</el-tag>
        <el-tag size="large" :type="itemStatusOf(scope.row.status).type" class="column-layout">
          状态:{{ itemStatusOf(scope.row.status).label }}
        </el-tag>
      </template>
    </el-table-column>
    <el-table-column prop="itemContent.sourceItem.title" label="条目" min-width="300" width="auto">
      <template #default="scope">
        <ItemContentDetail :content="scope.row.itemContent"/>
      </template>
    </el-table-column>
    <el-table-column prop="itemContent.fileContents.length" label="文件" align="center" width="100px">
      <template #default="scope">
        <div class="column-layout">
          <el-button size="small" @click="handleFileContentOpen(scope.row)">
            查看{{ scope.row.itemContent.fileContents.length }}个文件
          </el-button>
          <el-tag type="info">
            命名次数:{{ scope.row.renameTimes }}
          </el-tag>
          <el-tag v-for="[status, count] in fileStatusGrouping(scope.row.itemContent.fileContents)"
                  :key="status.value" :type="status.type">
            {{ status.label }}:{{ count }}
          </el-tag>
        </div>
      </template>
    </el-table-column>
    <el-table-column label="操作" align="center" width="100px">
      <template #default="scope">
        <div class="column-layout">
        <el-popconfirm title="确定重新处理?" @confirm="handleReprocess(scope.row)">
          <template #reference>
            <el-button size="small" type="warning">重新处理</el-button>
          </template>
        </el-popconfirm>
        <el-popconfirm title="确定删除?" @confirm="handleDelete(scope.row)">
          <template #reference>
            <el-button size="small" type="danger">删除</el-button>
          </template>
        </el-popconfirm>
        </div>
      </template>
    </el-table-column>
    <el-table-column label="其他" align="center" width="350px">
      <template #default="scope">
        <el-descriptions :column="1">
          <el-descriptions-item label="Hash:">{{ scope.row.itemHash }}</el-descriptions-item>
          <template v-if="scope.row.failureReason">
            <el-descriptions-item label="错误信息:">{{ scope.row.failureReason }}</el-descriptions-item>
          </template>
          <el-descriptions-item label="创建时间:">{{ scope.row.createTime }}</el-descriptions-item>
        </el-descriptions>
      </template>
    </el-table-column>
  </el-table>

  <el-dialog v-model="showFileContentDialog">
    <el-table :data="fileContents" row-key="fileDownloadPath">
      <el-table-column>
        <template #default="scope">
          <FileContentDetail :file="scope.row"/>
        </template>
      </el-table-column>
    </el-table>
  </el-dialog>
</template>

<script setup lang="ts">
import {onMounted, ref} from 'vue';
import {
  FileContent,
  fileStatusGrouping,
  itemStatusOf,
  ProcessingContent,
  processingContentService,
  processingContentStatuses
} from "~/services/data.service";
import {debounce} from "lodash";
import ItemContentDetail from "~/components/ItemContentDetail.vue";

// main list
const itemContents = ref<ProcessingContent[]>([]);
let maxId = 0;
const loading = ref(false);
const tableRef = ref();
const loadMore = (clear: boolean = false) => {
  if (clear) {
    maxId = 0
  }
  loading.value = true
  processingContentService.query({
    'maxId': maxId.toString(),
    'processorName': selectedProcessors.value.join(','),
    'status': status.value.join(','),
    'itemHash': itemHash.value,
    'item.title': itemTitle.value,
    'createTime.begin': createTimeRange?.value?.at(0),
    'createTime.end': createTimeRange?.value?.at(1),
  }).then(response => {
    const contents = response.contents;
    if (clear) {
      itemContents.value = contents
      //不知道怎么回到顶部
      // tableRef.value.setScrollTop(-999)
    } else {
      itemContents.value = itemContents.value.concat(contents);
    }
    const nextMaxId = response.nextMaxId;
    if (nextMaxId) {
      maxId = nextMaxId;
    }
  }).finally(() => {
    loading.value = false;
  })
};

onMounted(() => {
  loadMore(true);
});

// file content dialog
const fileContents = ref<FileContent[]>([]);
const showFileContentDialog = ref(false);
const handleFileContentOpen = (content: ProcessingContent) => {
  fileContents.value = content.itemContent.fileContents;
  showFileContentDialog.value = true;
}

// query condition
const selectedProcessors = ref<string[]>([]);
const handleSelectedProcessors = (selected: string[]) => {
  selectedProcessors.value = selected;
  // 不允许在没有选择处理器的情况下查询状态
  if (selected.length === 0) {
    status.value = []
  }
  loadMore(true)
}

const status = ref<string[]>([]);
const handleStatusSelected = () => {
  if (selectedProcessors.value.length > 0) {
    loadMore(true)
  }
}

const itemHash = ref<string>();
const handleItemHashBlur = () => {
  if (itemHash.value) {
    maxId = 0
  }
  loadMore(true)
}

const itemTitle = ref<string>();
const handleItemTitleChange = debounce((text) => {
  itemTitle.value = text
  loadMore(true)
}, 200)


const createTimeRange = ref<[Date, Date]>();
const handleDateChange = (_: [Date, Date]) => {
  loadMore(true)
}
const shortcuts = [
  {
    text: 'Today',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setHours(0, 0, 0, 0)
      return [start, end]
    },
  },
  {
    text: 'Last week',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 7)
      return [start, end]
    },
  }
]

// operation
const handleReprocess = (row: ProcessingContent) => {
  processingContentService.reprocess(row.id).then(() => {
    loadMore(true)
  })
}
const handleDelete = (row: ProcessingContent) => {
  processingContentService.delete(row.id).then(() => {
    loadMore(true)
  })
}
</script>

<style>
.column-layout {
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>