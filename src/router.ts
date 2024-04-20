import {createRouter, createWebHistory, RouteRecordRaw} from 'vue-router'
import Processor from './views/Processor.vue'
import ProcessingContent from './views/ProcessingContent.vue'
import Component from './views/Component.vue'
import Setting from './views/Setting.vue'

const routes: RouteRecordRaw[] = [
    {path: '/processor', name: 'Processor', component: Processor},
    {path: '/component', name: 'Component', component: Component},
    {path: '/processing-content', name: 'ProcessingContent', component: ProcessingContent},
    {path: '/setting', name: 'Setting', component: Setting},
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router