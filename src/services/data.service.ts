import axios, {AxiosResponse} from 'axios';
import {
    ProcessingContent,
    ScrollResponse,
    Processor,
    Component,
    ApplicationInfo
} from "~/services/processing-content.service";

const isDev = () => import.meta.env.MODE === 'development';
const API_BASE_URL = () => import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

export const instance = axios.create({
    baseURL: isDev() ? API_BASE_URL() : `${location.origin}`,
});

class ProcessingContentService {

    async query(query: Record<string, string>): Promise<ScrollResponse<ProcessingContent>> {
        const params = new URLSearchParams(query)
        const q = params.size == 0 ? '' : '?'+params.toString()
        return instance.get(`/api/processing-content${q}`).then((res: AxiosResponse<ScrollResponse<ProcessingContent>>) => res.data);
    }

    async update(id: number, data: ProcessingContent): Promise<ProcessingContent> {
        return instance.put(`/api/processing-content/${id}`, data).then((res: AxiosResponse<ProcessingContent>) => res.data);
    }

    async delete(id: number) {
        return instance.delete(`/api/processing-content/${id}`);
    }

    async reprocess(id: number) {
        return instance.post(`/api/processing-content/${id}/reprocess`);
    }
}

class ProcessorService {

    async query(): Promise<Processor[]> {
        return instance.get(`/api/processor`).then((res: AxiosResponse<Processor[]>) => res.data);
    }

    async create(data: Processor) {
        return instance.post(`/api/processor`, data)
    }

    async update(name: string, data: Processor): Promise<Processor> {
        return instance.put(`/api/processor/${name}`, data).then((res: AxiosResponse<Processor>) => res.data);
    }

    async delete(name: string) {
        return instance.delete(`/api/processor/${name}`);
    }

    async reload(name: string) {
        return instance.get(`/api/processor/${name}/reload`);
    }

    async trigger(name: string) {
        return instance.get(`/api/processor/${name}/trigger`);
    }

    async rename(name: string) {
        return instance.get(`/api/processor/${name}/rename`);
    }

    async sourceState(name: string) {
        return instance.get(`/api/processor/${name}/state`);
    }

    async updateSourcePointer(name: string, state: object) {
        return instance.put(`/api/processor/${name}/pointer`, state);
    }

    async dryRun(name: string, options: object) {
        return instance.post(`/api/processor/${name}/dry-run`);
    }

    async enable(name: string) {
        return instance.post(`/api/processor/${name}/enable`);
    }

    async disable(name: string) {
        return instance.post(`/api/processor/${name}/disable`);
    }

}

class ComponentService {

    async query(query: Record<string, string>): Promise<Component[]> {
        const params = new URLSearchParams(query)
        const q = params.size == 0 ? '' : '?'+params.toString()
        return instance.get(`/api/component${q}`).then((res: AxiosResponse<Component[]>) => res.data);
    }

    async create(data: Component) {
        return instance.post(`/api/component`, data)
    }

    async delete(name: string) {
        return instance.delete(`/api/component/${name}`);
    }
}

class ApplicationService {

    async info(): Promise<ApplicationInfo> {
        return instance.get(`/api/application/info`).then((res: AxiosResponse<ApplicationInfo>) => res.data);
    }

    async reload() {
        return instance.get(`/api/application/reload`);
    }
}

export const processingContentService = new ProcessingContentService();
export const processorService = new ProcessorService();
export const componentService = new ComponentService();
export const applicationService = new ApplicationService();