<!--暂时不用数据驱动来渲染, 后续需要有比较多优化交互的体验不知道能不能实现-->
<template>
  <el-form :model="formValue" label-width="auto" style="max-width: 600px">
    <el-tabs tab-position="left" class="demo-tabs">
      <el-tab-pane label="基本">
        <el-form-item label="名称" required>
          <el-input v-model="formValue.name"/>
        </el-form-item>
        <el-form-item label="源" required>
          <ComponentSelector type="source" v-model="formValue.source"/>
        </el-form-item>
        <el-form-item label="触发器">
          <ComponentSelector type="trigger" :multiple="true" v-model="formValue.triggers"/>
        </el-form-item>
        <el-form-item label="文件解析器" required>
          <ComponentSelector type="itemFileResolver" v-model="formValue.itemFileResolver"/>
        </el-form-item>
        <el-form-item label="下载器" required>
          <ComponentSelector type="downloader" v-model="formValue.downloader"/>
        </el-form-item>
        <el-form-item label="移动器" required>
          <ComponentSelector type="fileMover" v-model="formValue.fileMover"/>
        </el-form-item>
        <el-form-item label="保存路径" required>
          <el-input v-model="formValue.savePath"/>
        </el-form-item>
        <el-form-item label="开启" required>
          <el-switch v-model="formValue.enabled"/>
        </el-form-item>
        <el-form-item label="类目">
          <el-input v-model="formValue.category"/>
        </el-form-item>
        <el-form-item label="标签">
          <DynamicTag v-model="formValue.tags"/>
        </el-form-item>
      </el-tab-pane>
      <el-tab-pane label="文件">
        <el-form-item label="目标路径模版">
          <el-input v-model="formValue.options.savePathPattern"/>
        </el-form-item>
        <el-form-item label="目标文件名模版">
          <el-input v-model="formValue.options.filenamePattern"/>
        </el-form-item>
        <el-form-item label="文件标签器">
          <ComponentSelector type="tagger" v-model="formValue.options.fileTaggers"/>
        </el-form-item>
        <el-form-item label="变量提供">
          <ComponentSelector type="variableProvider" :multiple="true" v-model="formValue.options.variableProviders"/>
        </el-form-item>
        <el-form-item label="变量替换">
          <ComponentSelector type="variableReplacer" v-model="formValue.options.variableReplacers"/>
        </el-form-item>
        <!--          TODO 不知道怎么展示-->
        <!--          <el-form-item label="正则替换变量">-->

        <!--          </el-form-item>-->
        <el-form-item label="变量错误策略">
          <el-select
              v-model="formValue.options.variableErrorStrategy"
              clearable
              placeholder="Select"
              style="width: 240px"
          >
            <el-option
                v-for="item in variableErrorStrategyOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="变量冲突策略">
          <el-select
              v-model="formValue.options.variableConflictStrategy"
              clearable
              placeholder="Select"
              style="width: 240px"
          >
            <el-option
                v-for="item in variableConflictStrategyOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="文件存在">
          <ComponentSelector type="fileExistsDetector" v-model="formValue.options.fileExistsDetector"/>
        </el-form-item>
        <el-form-item label="文件替换">
          <ComponentSelector type="fileReplacementDecider" v-model="formValue.options.fileReplacementDecider"/>
        </el-form-item>
        <el-form-item label="Windows路径字符替换">
          <el-switch v-model="formValue.options.supportWindowsPlatformPath"/>
        </el-form-item>
        <!--          TODO 不知道怎么展示-->
        <!--          <el-form-item label="文件分组">-->
        <!--          formValue.options.fileGrouping-->
        <!--          </el-form-item>-->
        <!--          <el-form-item label="条目分组">-->
        <!--          formValue.options.itemGrouping-->
        <!--          </el-form-item>-->
        <!--          <el-form-item label="变量处理">-->
        <!--          formValue.options.variableProcess-->
        <!--          </el-form-item>-->
      </el-tab-pane>
      <el-tab-pane label="过滤">
        <el-form-item label="条目过滤">
          <ComponentSelector type="sourceItemFilter" v-model="formValue.options.sourceItemFilters"/>
        </el-form-item>
        <el-form-item label="文件过滤">
          <ComponentSelector type="fileContentFilter" v-model="formValue.options.fileContentFilters"/>
        </el-form-item>
        <el-form-item label="条目内容过滤">
          <ComponentSelector type="itemContentFilter" v-model="formValue.options.itemContentFilters"/>
        </el-form-item>
        <el-form-item label="条目表达式排除">
          <!--            <el-input v-model="formValue.options.itemExpressionExclusions"/>-->
        </el-form-item>
        <el-form-item label="条目表达式包含">
          <!--            <el-input v-model="formValue.options.itemExpressionInclusions"/>-->
        </el-form-item>
        <el-form-item label="条目内容表达式排除">
          <!--            <el-input v-model="formValue.options.contentExpressionExclusions"/>-->
        </el-form-item>
        <el-form-item label="条目内容表达式包含">
          <!--            <el-input v-model="formValue.options.contentExpressionInclusions"/>-->
        </el-form-item>
        <el-form-item label="文件表达式排除">
          <!--            <el-input v-model="formValue.options.fileExpressionExclusions"/>-->
        </el-form-item>
        <el-form-item label="文件表达式包含">
          <!--            <el-input v-model="formValue.options.fileExpressionInclusions"/>-->
        </el-form-item>
      </el-tab-pane>
      <el-tab-pane label="处理">
        <el-form-item label="监听">
          <ComponentSelector type="process-listener" :multiple="true" v-model="formValue.options.processListeners"/>
        </el-form-item>
        <el-form-item label="重命名间隔">
          <el-input v-model="formValue.options.renameTaskInterval" placeholder="PT5M"/>
        </el-form-item>
        <el-form-item label="重命名次数阈值">
          <el-input-number v-model="formValue.options.renameTimesThreshold" placeholder="3"/>
        </el-form-item>
        <el-form-item label="保存处理内容">
          <el-switch v-model="formValue.options.saveProcessingContent"/>
        </el-form-item>
        <el-form-item label="条目获取数限制">
          <el-input-number v-model="formValue.options.fetchLimit" placeholder="50"/>
        </el-form-item>
        <el-form-item label="指针批量模式">
          <el-switch v-model="formValue.options.pointerBatchMode"/>
        </el-form-item>
        <el-form-item label="条目异常继续">
          <el-switch v-model="formValue.options.itemErrorContinue"/>
        </el-form-item>
        <el-form-item label="更新条目文件夹时间">
          <el-switch v-model="formValue.options.touchItemDirectory"/>
        </el-form-item>
        <el-form-item label="清理条目空文件夹">
          <el-switch v-model="formValue.options.deleteEmptyDirectory"/>
        </el-form-item>
        <el-form-item label="条目重试间隔毫秒">
          <el-input-number v-model="formValue.options.retryBackoffMills" :min="1" placeholder="5000"/>
        </el-form-item>
        <el-form-item label="并行数">
          <el-input-number v-model="formValue.options.parallelism" :min="1" :max="10" placeholder="1"/>
        </el-form-item>
        <el-form-item label="任务分组">
          <el-input v-model="formValue.options.taskGroup"/>
        </el-form-item>
      </el-tab-pane>
      <el-tab-pane label="下载">
        <el-form-item label="类目">
          <el-input v-model="formValue.options.downloadOptions.category"/>
        </el-form-item>
        <el-form-item label="标签">
          <DynamicTag v-model="formValue.options.downloadOptions.tags"/>
        </el-form-item>
        <el-form-item label="请求头">
          <!--            formValue.options.downloadOptions.headers-->
        </el-form-item>
      </el-tab-pane>
      <el-tab-pane label="其他">
        <el-form-item label="表达式类型">
          <el-select
              v-model="formValue.options.expression"
              clearable
              placeholder="CEL"
              style="width: 240px"
          >
            <el-option
                v-for="item in [{label:'CEL'},{label:'SPEL'}]"
                :key="item.label"
                :label="item.label"
                :value="item.label"
            />
          </el-select>
        </el-form-item>
      </el-tab-pane>
    </el-tabs>
  </el-form>
  <el-button type="primary" @click="onSubmit">确定</el-button>
</template>
<script setup lang="ts">
import {reactive, ref, toRefs} from 'vue'
import ComponentSelector from "~/views/biz/ComponentSelector.vue";
import {ElInput} from "element-plus";

const props = defineProps<{
  processorName?: string,
}>();
const {processorName} = toRefs(props)

const formValue = reactive<ProcessorConfig>({
  enabled: true,
  options: {
    supportWindowsPlatformPath: true,
    saveProcessingContent: true,
    pointerBatchMode: true,
    touchItemDirectory: true,
    deleteEmptyDirectory: true,
    downloadOptions: {},
  }
});

const variableErrorStrategyOptions = [
  {label: '保留原有', value: 'ORIGINAL'},
  {label: '模板', value: 'PATTERN'},
  {label: '停留', value: 'STAY'},
  {label: '未解析', value: 'TO_UNRESOLVED'},
]
const variableConflictStrategyOptions = [
  {label: '任意', value: 'ANY'},
  {label: '值相同的数量最多的', value: 'VOTE'},
  {label: 'Provider定义的精度', value: 'ACCURACY'},
  {label: 'VOTE+SMART', value: 'SMART'},
]

interface ProcessorConfig {
  name?: string;
  triggers?: string[];
  source?: string;
  itemFileResolver?: string;
  downloader?: string;
  fileMover?: string;
  savePath?: string;
  options: Options;
  enabled?: boolean;
  category?: string | null;
  tags?: string[];
}

interface Options {
  variableProviders?: string[];
  sourceItemFilters?: string[];
  fileContentFilters?: string[];
  itemContentFilters?: string[];
  savePathPattern?: string;
  filenamePattern?: string;
  processListeners?: ListenerConfig[];
  renameTaskInterval?: number;
  downloadOptions: DownloadOptions;
  variableConflictStrategy?: string;
  renameTimesThreshold?: number;
  saveProcessingContent?: boolean;
  itemExpressionExclusions?: string[];
  itemExpressionInclusions?: string[];
  contentExpressionExclusions?: string[];
  contentExpressionInclusions?: string[];
  fileExpressionExclusions?: string[];
  fileExpressionInclusions?: string[];
  variableErrorStrategy?: string;
  touchItemDirectory?: boolean;
  deleteEmptyDirectory?: boolean;
  variableNameReplace?: { [key: string]: string };
  fileTaggers?: string[];
  regexVariableReplacers?: RegexVariableReplacer[];
  variableReplacers?: VariableReplacerConfig[];
  supportWindowsPlatformPath?: boolean;
  fileReplacementDecider?: string;
  fileExistsDetector?: string;
  fetchLimit?: number;
  pointerBatchMode?: boolean;
  itemErrorContinue?: boolean;
  fileGrouping?: FileGroupingConfig[];
  itemGrouping?: ItemGroupingConfig[];
  channelBufferSize?: number;
  recordMinimized?: boolean;
  parallelism?: number;
  retryBackoffMills?: number;
  taskGroup?: string;
  variableProcess?: { [key: string]: VariableProcessConfig };
  expression?: string;
}

interface FileGroupingConfig {
  tags?: string[];
  expressionMatching?: string | null;
  filenamePattern?: string | null;
  savePathPattern?: string | null;
  fileContentFilters?: string[] | null;
  fileExpressionExclusions?: string[] | null;
  fileExpressionInclusions?: string[] | null;
  fileReplacementDecider?: string | null;
}

interface ItemGroupingConfig {
  tags?: string[];
  expressionMatching?: string | null;
  filenamePattern?: string | null;
  savePathPattern?: string | null;
  variableProviders?: string[] | null;
  sourceItemFilters?: string[] | null;
  itemExpressionExclusions?: string[] | null;
  itemExpressionInclusions?: string[] | null;
}

interface VariableProcessConfig {
  chain?: string[];
  output: string;
}

interface ListenerConfig {
  id: string;
  mode: string;
}

interface VariableReplacerConfig {
  id: string;
  keys: string[]
}

interface RegexVariableReplacer {
  regex: string;
  replacement: string;
}

interface DownloadOptions {
  category?: string;
  tags?: string[];
  headers?: { [key: string]: string };
}

function onSubmit() {
  console.log('提交数据', formValue);
}
</script>
