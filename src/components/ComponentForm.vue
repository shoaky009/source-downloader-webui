<template>
  <el-form :model="formData" label-width="auto" style="max-width: 600px">
    <el-form-item label="组件类型" required>
      <el-select v-model="formData.type" placeholder="选择组件类型" @change="handleTypeSelected" filterable>
        <el-option
            v-for="item in componentTypes"
            :label="item.label + '(' + item.value + ')'"
            :value="item.value"
        />
      </el-select>
    </el-form-item>
    <el-form-item label="组件类型名称" required>
      <el-select v-model="formData.typeName" @change="handleTypeNameSelected" placeholder="先选择组件类型" filterable>
        <el-option
            v-for="item in currentTypeComponentOptions"
            :key="item.typeName"
            :label="item.typeName"
            :value="item.typeName"
        />
      </el-select>
    </el-form-item>
    <el-form-item label="组件名称">
      <el-input v-model="formData.name"/>
    </el-form-item>
    <el-form-item label="组件属性">
      <vue-form
          v-model="formData.props"
          :ui-schema="uiSchema"
          :schema="schema"
          :formFooter="{show:false}"
          :formProps="formProps"
      />
    </el-form-item>
  </el-form>
  <el-button type="primary" @click="onSubmit">确定</el-button>
</template>

<script setup lang="ts">
import VueForm from '@lljj/vue3-form-element';
import {reactive, ref} from 'vue';
import {ElInput} from "element-plus";
import {componentService} from "~/services/data.service";
import PairFormItem from "~/components/jsonschema/PairFormItem.vue";

const formData = reactive<ComponentForm>({});

const schema = ref({})
const uiSchema = ref({})
const currentTypeComponentOptions = ref<ComponentType[]>([])
const formProps = {
  inline: false,
  labelPosition: 'top',
  inlineFooter: false,
  layoutColumn: 1,
  labelWidth: 'auto'
}
const componentTypes = [
  {
    label: '触发器',
    value: 'TRIGGER'
  },
  {
    label: '数据源',
    value: 'SOURCE'
  },
  {
    label: '下载器',
    value: 'DOWNLOADER'
  },
  {
    label: '条目文件解析',
    value: 'ITEM_FILE_RESOLVER'
  },
  {
    label: '文件移动器',
    value: 'FILE_MOVER'
  },
  {
    label: '条目过滤',
    value: 'SOURCE_ITEM_FILTER'
  },
  {
    label: '条目内容过滤',
    value: 'ITEM_CONTENT_FILTER'
  },
  {
    label: '文件内容过滤',
    value: 'FILE_CONTENT_FILTER'
  },
  {
    label: '标签器',
    value: 'TAGGER',
  },
  {
    label: '文件替换规则',
    value: 'FILE_REPLACEMENT_DECIDER'
  },
  {
    label: '文件检测规则',
    value: 'FILE_EXISTS_DETECTOR',
  },
  {
    label: '变量提供',
    value: 'VARIABLE_PROVIDER'
  },
  {
    label: '变量替换',
    value: 'VARIABLE_REPLACER'
  },
  {
    label: '处理监听',
    value: 'PROCESS_LISTENER'
  }
]

function onSubmit() {
  console.log('提交数据', formData);
}

interface ComponentType {
  type: string;
  typeName: string;
}

const handleTypeSelected = async () => {
  if (formData.type) {
    const types = await componentService.types({'type': formData.type})
    currentTypeComponentOptions.value = types.data
  } else {
    currentTypeComponentOptions.value = []
  }
}

const handleTypeNameSelected = async () => {
  const typeName = formData.typeName
  const type = formData.type
  if (!typeName || !type) {
    return
  }
  const response = await componentService.getComponentPropSchema(type, typeName)
  if (response.data.propertySchema) {
    schema.value = response.data.propertySchema

    // 框架不支持直接渲染map类型的schema，需要特殊处理
    // 遍历schema如果type是object并且有additionalProperties type是string的话，就是一个map
    // 需要在uiSchema中设置ui:field为MapForm
    const resultSet: { [key: string]: { "ui:field": object } } = {};
    for (const key in schema.value.properties) {
      const property = schema.value.properties[key];
      if (property.type === 'object' && property.additionalProperties && property.additionalProperties.type === 'string') {
        resultSet[key] = {"ui:field": PairFormItem}
      }
    }
    console.log(resultSet)
    const merged = {
      ...resultSet,
      ...Object.keys(response.data.uiSchema).reduce((acc, key) => {
        acc[key] = { ...resultSet[key], ...response.data.uiSchema[key] };
        return acc;
      }, {} as Record<string, any>)
    };
    console.log(merged)
    uiSchema.value = merged;
  } else {
    schema.value = {}
  }
}


interface ComponentForm {
  name?: string;
  props?: any;
  type?: string;
  typeName?: string;
}
</script>