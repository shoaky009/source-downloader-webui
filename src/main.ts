import {createApp} from "vue";
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

const app = createApp(App)
    .use(router)
    .use(scroll);
app.mount("#app")