/*
实现逻辑：
1. 统一封装 H5 管理端访问后端 API 的方法和类型。
2. 前端页面只依赖这里的契约，不直接拼散落的请求。
3. 账号登录、模型配置、账号作品同步、采集预览、素材导入和发布诊断都通过该客户端调用后端。
*/
import axios from 'axios';
export const api = axios.create({
    baseURL: '/api/v1',
    timeout: 10000
});
export async function loadDashboard() {
    const [accounts, rawContents, drafts, publishTasks] = await Promise.all([
        api.get('/accounts'),
        api.get('/raw-contents'),
        api.get('/drafts'),
        api.get('/publish-tasks')
    ]);
    return {
        accounts: accounts.data,
        rawContents: rawContents.data,
        drafts: drafts.data,
        publishTasks: publishTasks.data
    };
}
export async function loadModelConfig() {
    const response = await api.get('/models/config');
    return response.data;
}
export async function saveModelConfig(payload) {
    const response = await api.put('/models/config', payload);
    return response.data;
}
export async function testModel(prompt) {
    const response = await api.post('/models/test', { prompt }, { timeout: 180000 });
    return response.data;
}
export async function createLoginSession(platform) {
    const response = await api.post('/login-sessions', { platform });
    return response.data;
}
export async function confirmLoginSession(sessionId) {
    const response = await api.post(`/login-sessions/${sessionId}/confirm`);
    return response.data;
}
export async function deleteAccount(accountId) {
    await api.delete(`/accounts/${accountId}`);
}
export async function syncAccountWorks(accountId) {
    const response = await api.post(`/accounts/${accountId}/sync-works`, {}, { timeout: 180000 });
    return response.data;
}
export async function loadAccountWorks(accountId) {
    const response = await api.get(`/accounts/${accountId}/works`);
    return response.data;
}
export async function loadCollectorSources() {
    const response = await api.get('/collector/sources');
    return response.data;
}
export async function previewCollectorItems(payload) {
    const response = await api.post('/collector/preview', payload);
    return response.data;
}
export async function importCollectorItem(item) {
    const response = await api.post('/collector/import', {
        source: item.source,
        category: item.category,
        title: item.title,
        url: item.url
    });
    return response.data;
}
export async function deleteRawContent(id) {
    await api.delete(`/raw-contents/${id}`);
}
export async function createDraftFromRawContent(payload) {
    const response = await api.post('/drafts/from-raw-content', payload);
    return response.data;
}
export async function createPublishTask(payload) {
    const response = await api.post('/publish-tasks', payload);
    return response.data;
}
export async function openPublishEditor(taskId) {
    const response = await api.post(`/publish-tasks/${taskId}/open-editor`);
    return response.data;
}
export async function autoPublishTask(taskId) {
    const response = await api.post(`/publish-tasks/${taskId}/auto-publish`);
    return response.data;
}
export async function loadPublishTaskDiagnostics(taskId) {
    const response = await api.get(`/publish-tasks/${taskId}/diagnostics`);
    return response.data;
}
export async function markPublishTaskPublished(taskId) {
    const response = await api.post(`/publish-tasks/${taskId}/mark-published`);
    return response.data;
}
export async function markPublishTaskFailed(taskId, errorMessage = '') {
    const response = await api.post(`/publish-tasks/${taskId}/mark-failed`, {
        error_message: errorMessage
    });
    return response.data;
}
export async function cancelPublishTask(taskId) {
    const response = await api.post(`/publish-tasks/${taskId}/cancel`);
    return response.data;
}
export async function deletePublishTask(taskId) {
    await api.delete(`/publish-tasks/${taskId}`);
}
