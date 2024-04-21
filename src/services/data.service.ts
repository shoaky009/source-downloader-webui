import axios, {AxiosResponse, InternalAxiosRequestConfig} from 'axios';
import {Component, ProcessingContent, Processor, ScrollResponse,} from "~/services/processing-content.service";
import {ElMessage} from "element-plus";

const isDev = () => import.meta.env.MODE === 'development';
const API_BASE_URL = () => import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

// ??不知道哪里声明类型
interface RequestConfig extends InternalAxiosRequestConfig<RequestConfig> {
    alertMessage: string
}

const instance = axios.create({
    baseURL: isDev() ? API_BASE_URL() : `${location.origin}`,
});

instance.interceptors.response.use(response => {
    if (response.config.alertMessage) {
        ElMessage({
            message: response.config.alertMessage,
            type: 'success',
        })
    }
    return response;
}, error => {
    // 对响应错误做点什么
    if (error.config.alertMessage) {
        ElMessage({
            message: error.response?.data?.detail ?? error.message,
            type: 'error',
        })
    }
    return Promise.reject(error);
});

class ProcessingContentService {

    async query(query: Record<string, string>): Promise<ScrollResponse<ProcessingContent>> {
        const params = new URLSearchParams(query)
        const q = params.size == 0 ? '' : '?' + params.toString()
        return instance.get(`/api/processing-content${q}`).then((res: AxiosResponse<ScrollResponse<ProcessingContent>>) => res.data);
    }

    async update(id: number, data: ProcessingContent): Promise<ProcessingContent> {
        return instance.put(`/api/processing-content/${id}`, data).then((res: AxiosResponse<ProcessingContent>) => res.data);
    }

    async delete(id: number) {
        return instance.delete(`/api/processing-content/${id}`, {alertMessage: '删除成功'});
    }

    async reprocess(id: number) {
        return instance.post(`/api/processing-content/${id}/reprocess`, null, {alertMessage: '操作成功'});
    }
}

class ProcessorService {

    async query(): Promise<Processor[]> {
        return instance.get(`/api/processor`).then((res: AxiosResponse<Processor[]>) => res.data);
    }

    async create(data: Processor) {
        return instance.post(`/api/processor`, data, {alertMessage: '创建成功'})
    }

    async update(name: string, data: Processor): Promise<Processor> {
        return instance.put(`/api/processor/${name}`, data, {alertMessage: '更新成功'}).then((res: AxiosResponse<Processor>) => res.data);
    }

    async delete(name: string) {
        return instance.delete(`/api/processor/${name}`, {alertMessage: '删除成功'});
    }

    async reload(name: string) {
        return instance.get(`/api/processor/${name}/reload`, {alertMessage: '重载成功'});
    }

    async trigger(name: string) {
        return instance.get(`/api/processor/${name}/trigger`, {alertMessage: '修操成功'});
    }

    async rename(name: string) {
        return instance.get(`/api/processor/${name}/rename`, {alertMessage: '修操成功'});
    }

    async sourceState(name: string) {
        return instance.get(`/api/processor/${name}/state`);
    }

    async updateSourcePointer(name: string, state: object) {
        return instance.put(`/api/processor/${name}/pointer`, state, {alertMessage: '修改成功'});
    }

    async dryRun(name: string, options: object) {
        return instance.post(`/api/processor/${name}/dry-run`);
    }

    async enable(name: string) {
        return instance.post(`/api/processor/${name}/enable`, null, {alertMessage: '开启成功'});
    }

    async disable(name: string) {
        return instance.post(`/api/processor/${name}/disable`, null, {alertMessage: '关闭成功'});
    }

}

class ComponentService {

    async query(query: Record<string, string>): Promise<Component[]> {
        const params = new URLSearchParams(query)
        const q = params.size == 0 ? '' : '?' + params.toString()
        return instance.get(`/api/component${q}`,).then((res: AxiosResponse<Component[]>) => res.data);
    }

    async create(data: Component) {
        return instance.post(`/api/component`, data, {alertMessage: '创建成功'})
    }

    async delete(name: string) {
        return instance.delete(`/api/component/${name}`, {alertMessage: '删除成功'});
    }

    async reload(component: Component) {
        return instance.get(`/api/component/${component.type}/${component.typeName}/${component.name}/reload`, {alertMessage: '重载成功'});
    }
}

class ApplicationService {

    async reload() {
        return instance.get(`/api/application/reload`, {alertMessage: '重载成功'});
    }
}

class ActuatorService {

    async info() {
        return instance.get(`/actuator/info`);
    }
}

export const processingContentService = new ProcessingContentService();
export const processorService = new ProcessorService();
export const componentService = new ComponentService();
export const applicationService = new ApplicationService();
export const actuatorService = new ActuatorService();