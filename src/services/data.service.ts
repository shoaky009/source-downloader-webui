import axios, {AxiosResponse} from 'axios';
import {ProcessingContent, ScrollResponse} from "~/services/processing-content.service";

const isDev = () => import.meta.env.MODE === 'development';
const API_BASE_URL = () => import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

export const instance = axios.create({
    baseURL: isDev() ? API_BASE_URL() : `${location.origin}`,
});

class ProcessingContentService {

    private PATH: string = '/api/processing-content';

    // pass query
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

export const processingContentService = new ProcessingContentService();