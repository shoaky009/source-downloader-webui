import {createApp, markRaw} from "vue";
import {configDefaultDynamicFormOptions, DynamicFormItemRegistry} from "@imengyu/vue-dynamic-form";
import App from "./App.vue";

// import "~/styles/element/index.scss";
// import ElementPlus from "element-plus";
// import all element css, uncommented next line
// import "element-plus/dist/index.css";
// or use cdn, uncomment cdn link in `index.html`
import "~/styles/index.scss";
import "uno.css";

// If you want to use ElMessage, import it.
import "element-plus/theme-chalk/src/message.scss";
import router from '~/router';
import scroll from 'el-table-infinite-scroll'
import {
    ElCheckbox,
    ElDatePicker,
    ElForm,
    ElFormItem,
    ElInput,
    ElInputNumber,
    ElSwitch,
    ElText,
    ElSelect,
    ElTabs,
    ElButton
} from "element-plus";
import ComponentSelector from "~/views/biz/ComponentSelector.vue";

const app = createApp(App)
    .use(router)
    .use(scroll);
app.mount("#app")