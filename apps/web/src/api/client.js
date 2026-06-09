/*
实现逻辑：
1. 统一封装 H5 管理端访问后端 API 的方法和类型。
2. 前端页面只依赖这里的契约，不直接拼散落的请求。
3. 账号登录、模型配置、Agent 配置、Skill 配置、账号作品同步、账号复盘、采集预览、素材导入和发布诊断都通过该客户端调用后端。
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
export async function loadModelConfigs() {
    const response = await api.get('/models/configs');
    return response.data;
}
export async function createModelConfig(payload) {
    const response = await api.post('/models/configs', payload);
    return response.data;
}
export async function updateModelConfig(id, payload) {
    const response = await api.put(`/models/configs/${id}`, payload);
    return response.data;
}
export async function deleteModelConfig(id) {
    await api.delete(`/models/configs/${id}`);
}
export async function setDefaultModelConfig(id) {
    const response = await api.post(`/models/configs/${id}/set-default`);
    return response.data;
}
export async function testModel(prompt, modelConfigId) {
    const response = await api.post('/models/test', { prompt, model_config_id: modelConfigId }, { timeout: 180000 });
    return response.data;
}
export async function loadAgentConfigs() {
    const response = await api.get('/agents/configs');
    return response.data;
}
export async function createAgentConfig(payload) {
    const response = await api.post('/agents/configs', payload);
    return response.data;
}
export async function updateAgentConfig(id, payload) {
    const response = await api.put(`/agents/configs/${id}`, payload);
    return response.data;
}
export async function deleteAgentConfig(id) {
    await api.delete(`/agents/configs/${id}`);
}
export async function setDefaultAgentConfig(id) {
    const response = await api.post(`/agents/configs/${id}/set-default`);
    return response.data;
}
export async function loadSkillConfigs() {
    const response = await api.get('/skills/configs');
    return response.data;
}
export async function createSkillConfig(payload) {
    const response = await api.post('/skills/configs', payload);
    return response.data;
}
export async function updateSkillConfig(id, payload) {
    const response = await api.put(`/skills/configs/${id}`, payload);
    return response.data;
}
export async function deleteSkillConfig(id) {
    await api.delete(`/skills/configs/${id}`);
}
export async function loadLocalSkills() {
    const response = await api.get('/skills/local');
    return response.data;
}
export async function reloadLocalSkills() {
    const response = await api.post('/skills/local/reload');
    return response.data;
}
export async function generateAccountReview(payload) {
    const response = await api.post('/agents/account-review', payload, { timeout: 180000 });
    return response.data;
}
export async function selectCollectedContent(payload) {
    const response = await api.post('/agents/content-selection', payload, { timeout: 180000 });
    return response.data;
}
export async function generateAccountProfile(payload) {
    const response = await api.post('/agents/account-profile', payload, { timeout: 180000 });
    return response.data;
}
export async function loadAccountProfileReports(accountId) {
    const response = await api.get('/agents/account-profile/reports', {
        params: accountId ? { account_id: accountId } : undefined
    });
    return response.data;
}
export async function deleteAccountProfileReport(profileId) {
    await api.delete(`/agents/account-profile/reports/${profileId}`);
}
export async function loadAccountReviewReports(accountId) {
    const response = await api.get('/agents/account-review/reports', {
        params: accountId ? { account_id: accountId } : undefined
    });
    return response.data;
}
export async function deleteAccountReviewReport(reportId) {
    await api.delete(`/agents/account-review/reports/${reportId}`);
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
