/// <reference types="../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { computed, onMounted, reactive, ref } from 'vue';
import { autoPublishTask, cancelPublishTask, createDraftFromRawContent, createPublishTask, deleteRawContent, deleteAccount, deletePublishTask, importCollectorItem, confirmLoginSession, createLoginSession, loadAccountWorks, loadCollectorSources, loadDashboard, loadModelConfig, loadPublishTaskDiagnostics, markPublishTaskFailed, markPublishTaskPublished, openPublishEditor, previewCollectorItems, saveModelConfig, testModel, syncAccountWorks } from './api/client';
const navItems = [
    { key: 'dashboard', label: '仪表盘', description: '采集、Agent、审核、发布和复盘的轻量闭环。' },
    { key: 'accounts', label: '账号', description: '管理平台账号、登录态和每日发布限制。' },
    { key: 'models', label: '模型', description: '配置 DeepSeek 或其他兼容模型，供 Agent 统一调用。' },
    { key: 'collector', label: '采集', description: '查看热点采集结果和原始内容。' },
    { key: 'drafts', label: '草稿', description: '查看 Agent 生成草稿并进行人工审核。' },
    { key: 'publisher', label: '发布', description: '管理待发布、发布中和失败任务。' },
    { key: 'analytics', label: '复盘', description: '分析作品表现和账号定位。' }
];
const dashboard = reactive({
    accounts: [],
    rawContents: [],
    drafts: [],
    publishTasks: []
});
const statusText = ref('等待加载');
const activePage = ref('dashboard');
const currentNav = computed(() => navItems.find((item) => item.key === activePage.value) ?? navItems[0]);
const loginBusy = ref(false);
const loginPlatform = ref('toutiao');
const loginSessionId = ref('');
const selectedAccountIds = ref([]);
const selectedWorkAccount = ref(null);
const accountWorks = ref([]);
const selectedAccountWork = ref(null);
const collectorBusy = ref(false);
const importingUrl = ref('');
const collectorSources = ref([]);
const collectorItems = ref([]);
const selectedRawContent = ref(null);
const collectorSourceKey = ref('ithome');
const collectorCategoryKey = ref('home');
const publisherBusy = ref(false);
const selectedDiagnostics = ref(null);
const modelBusy = ref(false);
const modelStatusText = ref('等待加载');
const modelTestPrompt = ref('');
const modelTestResult = ref('');
const modelForm = reactive({
    provider: 'deepseek',
    deepseek_api_key: '',
    deepseek_base_url: 'https://api.deepseek.com',
    deepseek_model: 'deepseek-chat',
    other_api_key: '',
    other_base_url: '',
    other_model: '',
    temperature: 0.7,
    timeout_seconds: 60
});
const modelKeyPlaceholders = reactive({
    deepseek: '未配置',
    other: '未配置'
});
const publishForm = reactive({
    raw_content_id: 0,
    account_id: 0,
    title: '',
    content: ''
});
const collectorCategories = computed(() => {
    const source = collectorSources.value.find((item) => item.key === collectorSourceKey.value);
    return source?.categories ?? [];
});
const allAccountsSelected = computed({
    get() {
        return dashboard.accounts.length > 0 && selectedAccountIds.value.length === dashboard.accounts.length;
    },
    set(checked) {
        selectedAccountIds.value = checked ? dashboard.accounts.map((account) => account.id) : [];
    }
});
async function refresh() {
    statusText.value = '加载中';
    try {
        const data = await loadDashboard();
        dashboard.accounts = data.accounts;
        dashboard.rawContents = data.rawContents;
        dashboard.drafts = data.drafts;
        dashboard.publishTasks = data.publishTasks;
        const accountIds = new Set(data.accounts.map((account) => account.id));
        selectedAccountIds.value = selectedAccountIds.value.filter((accountId) => accountIds.has(accountId));
        statusText.value = '已同步';
    }
    catch (error) {
        console.error(error);
        statusText.value = 'API 未连接';
    }
}
function applyModelConfig(config) {
    modelForm.provider = config.provider;
    modelForm.deepseek_api_key = '';
    modelForm.deepseek_base_url = config.deepseek_base_url;
    modelForm.deepseek_model = config.deepseek_model;
    modelForm.other_api_key = '';
    modelForm.other_base_url = config.other_base_url;
    modelForm.other_model = config.other_model;
    modelForm.temperature = config.temperature;
    modelForm.timeout_seconds = config.timeout_seconds;
    modelKeyPlaceholders.deepseek = config.deepseek_api_key_configured ? '已配置，留空则不修改' : '未配置';
    modelKeyPlaceholders.other = config.other_api_key_configured ? '已配置，留空则不修改' : '未配置';
}
async function loadModels() {
    modelStatusText.value = '加载中';
    try {
        applyModelConfig(await loadModelConfig());
        modelStatusText.value = '模型配置已加载';
    }
    catch (error) {
        console.error(error);
        modelStatusText.value = '模型配置加载失败';
    }
}
async function saveModels() {
    modelBusy.value = true;
    modelStatusText.value = '正在保存模型配置';
    try {
        const config = await saveModelConfig({ ...modelForm });
        applyModelConfig(config);
        modelStatusText.value = '模型配置已保存';
    }
    catch (error) {
        console.error(error);
        modelStatusText.value = '模型配置保存失败';
    }
    finally {
        modelBusy.value = false;
    }
}
async function runModelTest() {
    if (!modelTestPrompt.value.trim()) {
        modelStatusText.value = '请输入测试提示词';
        return;
    }
    modelBusy.value = true;
    modelStatusText.value = '正在测试模型';
    modelTestResult.value = '';
    try {
        const result = await testModel(modelTestPrompt.value);
        modelTestResult.value = `${result.provider} / ${result.model}\n\n${result.content}`;
        modelStatusText.value = '模型测试成功';
    }
    catch (error) {
        console.error(error);
        modelStatusText.value = '模型测试失败';
    }
    finally {
        modelBusy.value = false;
    }
}
async function openLoginSession() {
    loginBusy.value = true;
    statusText.value = '正在打开登录页';
    try {
        const session = await createLoginSession(loginPlatform.value);
        loginSessionId.value = session.id;
        statusText.value = '请在弹出的浏览器中完成登录';
    }
    catch (error) {
        console.error(error);
        statusText.value = '打开登录页失败';
    }
    finally {
        loginBusy.value = false;
    }
}
async function confirmLogin() {
    if (!loginSessionId.value) {
        statusText.value = '请先打开登录页';
        return;
    }
    loginBusy.value = true;
    statusText.value = '正在保存登录态';
    try {
        const session = await confirmLoginSession(loginSessionId.value);
        if (session.status === 'completed') {
            loginSessionId.value = '';
            await refresh();
            statusText.value = '登录态已保存，账号已同步';
        }
        else {
            statusText.value = session.error_message || '登录确认失败';
        }
    }
    catch (error) {
        console.error(error);
        statusText.value = '登录确认失败';
    }
    finally {
        loginBusy.value = false;
    }
}
async function removeAccount(account) {
    if (!window.confirm(`确认删除「${account.nickname || account.uid || account.platform}」吗？`)) {
        return;
    }
    loginBusy.value = true;
    statusText.value = '正在删除账号';
    try {
        await deleteAccount(account.id);
        selectedAccountIds.value = selectedAccountIds.value.filter((accountId) => accountId !== account.id);
        if (selectedWorkAccount.value?.id === account.id) {
            clearAccountWorks();
        }
        if (publishForm.account_id === account.id) {
            publishForm.account_id = 0;
        }
        await refresh();
        statusText.value = '账号已删除';
    }
    catch (error) {
        console.error(error);
        statusText.value = '账号删除失败';
    }
    finally {
        loginBusy.value = false;
    }
}
async function removeSelectedAccounts() {
    const accountIds = [...selectedAccountIds.value];
    if (accountIds.length === 0) {
        return;
    }
    if (!window.confirm(`确认删除已选中的 ${accountIds.length} 个账号吗？`)) {
        return;
    }
    loginBusy.value = true;
    statusText.value = '正在批量删除账号';
    try {
        await Promise.all(accountIds.map((accountId) => deleteAccount(accountId)));
        if (accountIds.includes(publishForm.account_id)) {
            publishForm.account_id = 0;
        }
        if (selectedWorkAccount.value && accountIds.includes(selectedWorkAccount.value.id)) {
            clearAccountWorks();
        }
        selectedAccountIds.value = [];
        await refresh();
        statusText.value = `已删除 ${accountIds.length} 个账号`;
    }
    catch (error) {
        console.error(error);
        statusText.value = '批量删除账号失败';
    }
    finally {
        loginBusy.value = false;
    }
}
async function syncWorks(account) {
    loginBusy.value = true;
    statusText.value = '正在同步作品';
    try {
        const result = await syncAccountWorks(account.id);
        selectedWorkAccount.value = account;
        accountWorks.value = await loadAccountWorks(account.id);
        selectedAccountWork.value = null;
        statusText.value = result.message || `已同步 ${result.synced_count} 条作品`;
    }
    catch (error) {
        console.error(error);
        statusText.value = '同步作品失败';
    }
    finally {
        loginBusy.value = false;
    }
}
async function showAccountWorks(account) {
    loginBusy.value = true;
    statusText.value = '正在加载作品';
    try {
        selectedWorkAccount.value = account;
        accountWorks.value = await loadAccountWorks(account.id);
        selectedAccountWork.value = null;
        statusText.value = '作品已加载';
    }
    catch (error) {
        console.error(error);
        statusText.value = '作品加载失败';
    }
    finally {
        loginBusy.value = false;
    }
}
function clearAccountWorks() {
    selectedWorkAccount.value = null;
    accountWorks.value = [];
    selectedAccountWork.value = null;
}
function selectAccountWork(work) {
    selectedAccountWork.value = work;
}
async function loadCollectors() {
    try {
        collectorSources.value = await loadCollectorSources();
        if (!collectorSources.value.some((source) => source.key === collectorSourceKey.value)) {
            collectorSourceKey.value = collectorSources.value[0]?.key ?? '';
        }
        syncCollectorCategory();
    }
    catch (error) {
        console.error(error);
        statusText.value = '采集源加载失败';
    }
}
function syncCollectorCategory() {
    const firstCategory = collectorCategories.value[0];
    if (!collectorCategories.value.some((category) => category.key === collectorCategoryKey.value)) {
        collectorCategoryKey.value = firstCategory?.key ?? '';
    }
}
async function previewCollector() {
    if (!collectorSourceKey.value || !collectorCategoryKey.value) {
        statusText.value = '请选择采集源';
        return;
    }
    collectorBusy.value = true;
    statusText.value = '正在刷新热点';
    try {
        collectorItems.value = await previewCollectorItems({
            source: collectorSourceKey.value,
            category: collectorCategoryKey.value,
            limit: 20,
            with_detail: false
        });
        statusText.value = collectorItems.value.length ? '热点已刷新' : '未获取到热点';
    }
    catch (error) {
        console.error(error);
        statusText.value = '热点刷新失败';
    }
    finally {
        collectorBusy.value = false;
    }
}
async function importCollector(item) {
    const existing = dashboard.rawContents.find((content) => content.source_url === item.url);
    if (existing) {
        selectedRawContent.value = existing;
        statusText.value = '素材已存在';
        return;
    }
    importingUrl.value = item.url;
    statusText.value = '正在导入素材';
    try {
        await importCollectorItem(item);
        await refresh();
        statusText.value = '素材已导入';
    }
    catch (error) {
        console.error(error);
        statusText.value = '素材导入失败';
    }
    finally {
        importingUrl.value = '';
    }
}
async function removeRawContent(content) {
    if (!window.confirm(`确认删除「${content.title}」吗？`)) {
        return;
    }
    statusText.value = '正在删除素材';
    try {
        await deleteRawContent(content.id);
        if (selectedRawContent.value?.id === content.id) {
            selectedRawContent.value = null;
        }
        await refresh();
        statusText.value = '素材已删除';
    }
    catch (error) {
        console.error(error);
        statusText.value = '素材删除失败';
    }
}
function formatDate(value) {
    return value ? new Date(value).toLocaleString('zh-CN', { hour12: false }) : '-';
}
function metricText(metrics, key) {
    const value = metrics[key];
    if (value === undefined || value === null || value === '') {
        return '-';
    }
    return String(value);
}
function syncPublishDraftForm() {
    const rawContent = dashboard.rawContents.find((content) => content.id === publishForm.raw_content_id);
    if (!rawContent) {
        publishForm.title = '';
        publishForm.content = '';
        return;
    }
    publishForm.title = rawContent.title;
    publishForm.content = rawContent.content;
}
async function createPublisherTask() {
    if (!publishForm.raw_content_id || !publishForm.account_id) {
        statusText.value = '请选择素材和账号';
        return;
    }
    if (!publishForm.title || !publishForm.content) {
        statusText.value = '请补全标题和正文';
        return;
    }
    publisherBusy.value = true;
    statusText.value = '正在创建发布任务';
    try {
        const draft = await createDraftFromRawContent({
            raw_content_id: publishForm.raw_content_id,
            account_id: publishForm.account_id,
            title: publishForm.title,
            content: publishForm.content
        });
        await createPublishTask({
            draft_id: draft.id,
            platform: accountPlatform(publishForm.account_id)
        });
        await refresh();
        statusText.value = '发布任务已创建';
    }
    catch (error) {
        console.error(error);
        statusText.value = '发布任务创建失败';
    }
    finally {
        publisherBusy.value = false;
    }
}
async function openEditor(task) {
    publisherBusy.value = true;
    statusText.value = '正在打开发布编辑页';
    try {
        await openPublishEditor(task.id);
        await refresh();
        statusText.value = '编辑页已打开，请人工确认后发布';
    }
    catch (error) {
        console.error(error);
        statusText.value = '打开编辑页失败';
    }
    finally {
        publisherBusy.value = false;
    }
}
async function autoPublish(task) {
    const platformName = platformLabel(task.platform);
    const confirmed = window.confirm(`确认要自动发布「${draftTitle(task.draft_id)}」到${platformName}吗？\n\n系统会自动点击发布按钮，请确认标题、正文和图片已经检查无误。`);
    if (!confirmed) {
        return;
    }
    publisherBusy.value = true;
    statusText.value = '正在自动发布';
    try {
        await autoPublishTask(task.id);
        await refresh();
        statusText.value = '自动发布已完成';
    }
    catch (error) {
        console.error(error);
        statusText.value = '自动发布失败';
    }
    finally {
        publisherBusy.value = false;
    }
}
async function markPublished(taskId) {
    statusText.value = '正在标记发布成功';
    try {
        await markPublishTaskPublished(taskId);
        await refresh();
        statusText.value = '任务已标记发布';
    }
    catch (error) {
        console.error(error);
        statusText.value = '状态更新失败';
    }
}
async function markFailed(taskId) {
    const reason = window.prompt('失败原因', '人工标记失败') ?? '';
    statusText.value = '正在标记失败';
    try {
        await markPublishTaskFailed(taskId, reason);
        await refresh();
        statusText.value = '任务已标记失败';
    }
    catch (error) {
        console.error(error);
        statusText.value = '状态更新失败';
    }
}
async function cancelTask(taskId) {
    statusText.value = '正在取消任务';
    try {
        await cancelPublishTask(taskId);
        await refresh();
        statusText.value = '任务已取消';
    }
    catch (error) {
        console.error(error);
        statusText.value = '取消任务失败';
    }
}
async function showTaskDiagnostics(taskId) {
    publisherBusy.value = true;
    statusText.value = '正在加载任务详情';
    try {
        selectedDiagnostics.value = await loadPublishTaskDiagnostics(taskId);
        statusText.value = '任务详情已加载';
    }
    catch (error) {
        console.error(error);
        statusText.value = '任务详情加载失败';
    }
    finally {
        publisherBusy.value = false;
    }
}
function clearDiagnostics() {
    selectedDiagnostics.value = null;
}
async function removeTask(taskId) {
    if (!window.confirm('确认删除这个发布任务吗？')) {
        return;
    }
    statusText.value = '正在删除任务';
    try {
        await deletePublishTask(taskId);
        await refresh();
        statusText.value = '任务已删除';
    }
    catch (error) {
        console.error(error);
        statusText.value = '删除任务失败';
    }
}
function accountPlatform(accountId) {
    return dashboard.accounts.find((account) => account.id === accountId)?.platform ?? 'toutiao';
}
function canAutoPublish(platform) {
    return ['toutiao', 'xiaohongshu'].includes(platform);
}
function platformLabel(platform) {
    const labels = {
        toutiao: '头条号',
        xiaohongshu: '小红书'
    };
    return labels[platform] ?? platform;
}
function draftTitle(draftId) {
    return dashboard.drafts.find((draft) => draft.id === draftId)?.title ?? `草稿 #${draftId}`;
}
function normalizeStatus(status) {
    return status.toLowerCase();
}
function taskStatusLabel(status) {
    const labels = {
        pending: '待发布',
        publishing: '编辑中',
        published: '已发布',
        failed: '失败',
        canceled: '已取消'
    };
    return labels[normalizeStatus(status)] ?? status;
}
function taskStatusClass(status) {
    return `status-${normalizeStatus(status)}`;
}
function isPublishedTask(status) {
    return normalizeStatus(status) === 'published';
}
function canShowOpenEditor(status) {
    return ['pending'].includes(normalizeStatus(status));
}
function canShowAutoPublish(task) {
    const status = normalizeStatus(task.status);
    return ['pending', 'failed'].includes(status) && canAutoPublish(task.platform);
}
function canShowPublishingActions(status) {
    return normalizeStatus(status) === 'publishing';
}
function isTerminalTask(status) {
    return ['published', 'failed', 'canceled'].includes(normalizeStatus(status));
}
onMounted(async () => {
    await Promise.all([refresh(), loadCollectors(), loadModels()]);
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.main, __VLS_intrinsicElements.main)({
    ...{ class: "shell" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.aside, __VLS_intrinsicElements.aside)({
    ...{ class: "sidebar" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "brand" },
});
for (const [item] of __VLS_getVForSourceType((__VLS_ctx.navItems))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.activePage = item.key;
            } },
        key: (item.key),
        ...{ class: "nav" },
        ...{ class: ({ active: __VLS_ctx.activePage === item.key }) },
    });
    (item.label);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "content" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.header, __VLS_intrinsicElements.header)({
    ...{ class: "topbar" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
(__VLS_ctx.currentNav.label);
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
(__VLS_ctx.currentNav.description);
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.refresh) },
    ...{ class: "primary" },
});
if (__VLS_ctx.activePage === 'dashboard') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "metrics" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
        ...{ class: "metric" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
    (__VLS_ctx.dashboard.accounts.length);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
        ...{ class: "metric" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
    (__VLS_ctx.dashboard.rawContents.length);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
        ...{ class: "metric" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
    (__VLS_ctx.dashboard.drafts.length);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
        ...{ class: "metric" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
    (__VLS_ctx.dashboard.publishTasks.length);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "panel" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "panel-title" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.statusText);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flow" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
}
else if (__VLS_ctx.activePage === 'accounts') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "panel" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "panel-title" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.statusText);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "login-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "login-actions" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
        value: (__VLS_ctx.loginPlatform),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "toutiao",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "baijiahao",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "weixin",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "qiehao",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "xiaohongshu",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.openLoginSession) },
        ...{ class: "secondary" },
        disabled: (__VLS_ctx.loginBusy),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.confirmLogin) },
        ...{ class: "primary" },
        disabled: (__VLS_ctx.loginBusy || !__VLS_ctx.loginSessionId),
    });
    if (__VLS_ctx.dashboard.accounts.length === 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "empty" },
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "table" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "bulk-actions" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (__VLS_ctx.selectedAccountIds.length);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.removeSelectedAccounts) },
            ...{ class: "text-button danger" },
            disabled: (__VLS_ctx.loginBusy || __VLS_ctx.selectedAccountIds.length === 0),
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "table-row table-head account-table-row" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
            ...{ class: "checkbox-cell" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            type: "checkbox",
            disabled: (__VLS_ctx.loginBusy || __VLS_ctx.dashboard.accounts.length === 0),
        });
        (__VLS_ctx.allAccountsSelected);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        for (const [account] of __VLS_getVForSourceType((__VLS_ctx.dashboard.accounts))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                key: (account.id),
                ...{ class: "table-row account-table-row" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                ...{ class: "checkbox-cell" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                type: "checkbox",
                value: (account.id),
                disabled: (__VLS_ctx.loginBusy),
            });
            (__VLS_ctx.selectedAccountIds);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (account.platform);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (account.nickname || '-');
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (account.uid || '-');
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (account.status);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (account.daily_publish_limit);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "row-actions" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.activePage === 'dashboard'))
                            return;
                        if (!(__VLS_ctx.activePage === 'accounts'))
                            return;
                        if (!!(__VLS_ctx.dashboard.accounts.length === 0))
                            return;
                        __VLS_ctx.syncWorks(account);
                    } },
                ...{ class: "text-button" },
                disabled: (__VLS_ctx.loginBusy || account.platform !== 'toutiao'),
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.activePage === 'dashboard'))
                            return;
                        if (!(__VLS_ctx.activePage === 'accounts'))
                            return;
                        if (!!(__VLS_ctx.dashboard.accounts.length === 0))
                            return;
                        __VLS_ctx.showAccountWorks(account);
                    } },
                ...{ class: "text-button" },
                disabled: (__VLS_ctx.loginBusy),
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.activePage === 'dashboard'))
                            return;
                        if (!(__VLS_ctx.activePage === 'accounts'))
                            return;
                        if (!!(__VLS_ctx.dashboard.accounts.length === 0))
                            return;
                        __VLS_ctx.removeAccount(account);
                    } },
                ...{ class: "text-button danger" },
                disabled: (__VLS_ctx.loginBusy),
            });
        }
    }
    if (__VLS_ctx.selectedWorkAccount) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
            ...{ class: "account-works-panel" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "account-works-header" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
        (__VLS_ctx.selectedWorkAccount.nickname || __VLS_ctx.selectedWorkAccount.uid || __VLS_ctx.selectedWorkAccount.platform);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.clearAccountWorks) },
            ...{ class: "text-button" },
        });
        if (__VLS_ctx.accountWorks.length === 0) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "empty compact-empty" },
            });
        }
        else {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "table" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "table-row account-work-row table-head" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            for (const [work] of __VLS_getVForSourceType((__VLS_ctx.accountWorks))) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    key: (work.id),
                    ...{ class: "table-row account-work-row" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                if (work.url) {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
                        href: (work.url),
                        target: "_blank",
                        rel: "noreferrer",
                    });
                    (work.title);
                }
                else {
                    (work.title);
                }
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                (work.status || '-');
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                (__VLS_ctx.metricText(work.metrics, 'views'));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                (__VLS_ctx.metricText(work.metrics, 'likes'));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                (__VLS_ctx.metricText(work.metrics, 'comments'));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                (__VLS_ctx.formatDate(work.synced_at));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: "row-actions" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!!(__VLS_ctx.activePage === 'dashboard'))
                                return;
                            if (!(__VLS_ctx.activePage === 'accounts'))
                                return;
                            if (!(__VLS_ctx.selectedWorkAccount))
                                return;
                            if (!!(__VLS_ctx.accountWorks.length === 0))
                                return;
                            __VLS_ctx.selectAccountWork(work);
                        } },
                    ...{ class: "text-button" },
                });
            }
        }
    }
}
else if (__VLS_ctx.activePage === 'collector') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "panel" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "panel-title" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.statusText);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "collector-toolbar" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
        ...{ onChange: (__VLS_ctx.syncCollectorCategory) },
        value: (__VLS_ctx.collectorSourceKey),
    });
    for (const [source] of __VLS_getVForSourceType((__VLS_ctx.collectorSources))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
            key: (source.key),
            value: (source.key),
        });
        (source.name);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
        value: (__VLS_ctx.collectorCategoryKey),
    });
    for (const [category] of __VLS_getVForSourceType((__VLS_ctx.collectorCategories))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
            key: (category.key),
            value: (category.key),
        });
        (category.name);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.previewCollector) },
        ...{ class: "primary" },
        disabled: (__VLS_ctx.collectorBusy),
    });
    (__VLS_ctx.collectorBusy ? '刷新中' : '刷新热点');
    if (__VLS_ctx.collectorItems.length === 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "empty" },
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "collector-list" },
        });
        for (const [item] of __VLS_getVForSourceType((__VLS_ctx.collectorItems))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
                key: (item.url),
                ...{ class: "collector-item" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
            __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
            (item.title);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
            (item.summary || item.url);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.activePage === 'dashboard'))
                            return;
                        if (!!(__VLS_ctx.activePage === 'accounts'))
                            return;
                        if (!(__VLS_ctx.activePage === 'collector'))
                            return;
                        if (!!(__VLS_ctx.collectorItems.length === 0))
                            return;
                        __VLS_ctx.importCollector(item);
                    } },
                ...{ class: "secondary" },
                disabled: (__VLS_ctx.importingUrl === item.url),
            });
            (__VLS_ctx.importingUrl === item.url ? '导入中' : '导入素材库');
        }
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "panel-title compact-title" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.dashboard.rawContents.length);
    if (__VLS_ctx.dashboard.rawContents.length === 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "empty" },
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "table" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "table-row collector-table-head" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        for (const [content] of __VLS_getVForSourceType((__VLS_ctx.dashboard.rawContents))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                key: (content.id),
                ...{ class: "table-row collector-table-row" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (content.source);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (content.title);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (content.status);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (__VLS_ctx.formatDate(content.created_at));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "row-actions" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.activePage === 'dashboard'))
                            return;
                        if (!!(__VLS_ctx.activePage === 'accounts'))
                            return;
                        if (!(__VLS_ctx.activePage === 'collector'))
                            return;
                        if (!!(__VLS_ctx.dashboard.rawContents.length === 0))
                            return;
                        __VLS_ctx.selectedRawContent = content;
                    } },
                ...{ class: "text-button" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.activePage === 'dashboard'))
                            return;
                        if (!!(__VLS_ctx.activePage === 'accounts'))
                            return;
                        if (!(__VLS_ctx.activePage === 'collector'))
                            return;
                        if (!!(__VLS_ctx.dashboard.rawContents.length === 0))
                            return;
                        __VLS_ctx.removeRawContent(content);
                    } },
                ...{ class: "text-button danger" },
            });
        }
    }
    if (__VLS_ctx.selectedRawContent) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "detail-drawer" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "detail-header" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
        (__VLS_ctx.selectedRawContent.title);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        (__VLS_ctx.selectedRawContent.source);
        (__VLS_ctx.selectedRawContent.category || '-');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.activePage === 'dashboard'))
                        return;
                    if (!!(__VLS_ctx.activePage === 'accounts'))
                        return;
                    if (!(__VLS_ctx.activePage === 'collector'))
                        return;
                    if (!(__VLS_ctx.selectedRawContent))
                        return;
                    __VLS_ctx.selectedRawContent = null;
                } },
            ...{ class: "secondary" },
        });
        if (__VLS_ctx.selectedRawContent.source_url) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
                ...{ class: "source-link" },
                href: (__VLS_ctx.selectedRawContent.source_url),
                target: "_blank",
                rel: "noreferrer",
            });
            (__VLS_ctx.selectedRawContent.source_url);
        }
        if (__VLS_ctx.selectedRawContent.images.length) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "image-grid" },
            });
            for (const [image] of __VLS_getVForSourceType((__VLS_ctx.selectedRawContent.images))) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
                    key: (image),
                    href: (image),
                    target: "_blank",
                    rel: "noreferrer",
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
                    src: (image),
                    alt: (__VLS_ctx.selectedRawContent.title),
                });
            }
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "content-preview" },
        });
        (__VLS_ctx.selectedRawContent.content || '暂无正文内容');
    }
}
else if (__VLS_ctx.activePage === 'publisher') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "panel" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "panel-title" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.statusText);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "publisher-grid" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "publisher-builder" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "form-grid" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
        ...{ onChange: (__VLS_ctx.syncPublishDraftForm) },
        value: (__VLS_ctx.publishForm.raw_content_id),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: (0),
    });
    for (const [content] of __VLS_getVForSourceType((__VLS_ctx.dashboard.rawContents))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
            key: (content.id),
            value: (content.id),
        });
        (content.title);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
        value: (__VLS_ctx.publishForm.account_id),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: (0),
    });
    for (const [account] of __VLS_getVForSourceType((__VLS_ctx.dashboard.accounts))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
            key: (account.id),
            value: (account.id),
        });
        (account.nickname);
        (account.platform);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "stacked-field" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        placeholder: "发布标题",
    });
    (__VLS_ctx.publishForm.title);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "stacked-field" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
        value: (__VLS_ctx.publishForm.content),
        rows: "12",
        placeholder: "发布正文",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "row-actions end-actions" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.syncPublishDraftForm) },
        ...{ class: "secondary" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.createPublisherTask) },
        ...{ class: "primary" },
        disabled: (__VLS_ctx.publisherBusy),
    });
    (__VLS_ctx.publisherBusy ? '创建中' : '创建发布任务');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "publisher-preview" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
    (__VLS_ctx.publishForm.title || '未选择素材');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    (__VLS_ctx.publishForm.content || '暂无正文');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "panel-title compact-title" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.dashboard.publishTasks.length);
    if (__VLS_ctx.dashboard.publishTasks.length === 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "empty" },
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "table" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "table-row publish-table-head" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        for (const [task] of __VLS_getVForSourceType((__VLS_ctx.dashboard.publishTasks))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                key: (task.id),
                ...{ class: "table-row publish-table-row" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (task.platform);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (__VLS_ctx.draftTitle(task.draft_id));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "status-badge" },
                ...{ class: (__VLS_ctx.taskStatusClass(task.status)) },
            });
            (__VLS_ctx.taskStatusLabel(task.status));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (__VLS_ctx.formatDate(task.created_at));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "row-actions task-actions" },
            });
            if (__VLS_ctx.canShowOpenEditor(task.status)) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!!(__VLS_ctx.activePage === 'dashboard'))
                                return;
                            if (!!(__VLS_ctx.activePage === 'accounts'))
                                return;
                            if (!!(__VLS_ctx.activePage === 'collector'))
                                return;
                            if (!(__VLS_ctx.activePage === 'publisher'))
                                return;
                            if (!!(__VLS_ctx.dashboard.publishTasks.length === 0))
                                return;
                            if (!(__VLS_ctx.canShowOpenEditor(task.status)))
                                return;
                            __VLS_ctx.openEditor(task);
                        } },
                    ...{ class: "text-button" },
                    disabled: (__VLS_ctx.publisherBusy),
                });
            }
            if (__VLS_ctx.canShowAutoPublish(task)) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!!(__VLS_ctx.activePage === 'dashboard'))
                                return;
                            if (!!(__VLS_ctx.activePage === 'accounts'))
                                return;
                            if (!!(__VLS_ctx.activePage === 'collector'))
                                return;
                            if (!(__VLS_ctx.activePage === 'publisher'))
                                return;
                            if (!!(__VLS_ctx.dashboard.publishTasks.length === 0))
                                return;
                            if (!(__VLS_ctx.canShowAutoPublish(task)))
                                return;
                            __VLS_ctx.autoPublish(task);
                        } },
                    ...{ class: "text-button danger" },
                    disabled: (__VLS_ctx.publisherBusy),
                });
            }
            if (__VLS_ctx.canShowPublishingActions(task.status)) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!!(__VLS_ctx.activePage === 'dashboard'))
                                return;
                            if (!!(__VLS_ctx.activePage === 'accounts'))
                                return;
                            if (!!(__VLS_ctx.activePage === 'collector'))
                                return;
                            if (!(__VLS_ctx.activePage === 'publisher'))
                                return;
                            if (!!(__VLS_ctx.dashboard.publishTasks.length === 0))
                                return;
                            if (!(__VLS_ctx.canShowPublishingActions(task.status)))
                                return;
                            __VLS_ctx.markPublished(task.id);
                        } },
                    ...{ class: "text-button" },
                });
            }
            if (__VLS_ctx.canShowPublishingActions(task.status)) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!!(__VLS_ctx.activePage === 'dashboard'))
                                return;
                            if (!!(__VLS_ctx.activePage === 'accounts'))
                                return;
                            if (!!(__VLS_ctx.activePage === 'collector'))
                                return;
                            if (!(__VLS_ctx.activePage === 'publisher'))
                                return;
                            if (!!(__VLS_ctx.dashboard.publishTasks.length === 0))
                                return;
                            if (!(__VLS_ctx.canShowPublishingActions(task.status)))
                                return;
                            __VLS_ctx.markFailed(task.id);
                        } },
                    ...{ class: "text-button" },
                });
            }
            if (__VLS_ctx.canShowPublishingActions(task.status)) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!!(__VLS_ctx.activePage === 'dashboard'))
                                return;
                            if (!!(__VLS_ctx.activePage === 'accounts'))
                                return;
                            if (!!(__VLS_ctx.activePage === 'collector'))
                                return;
                            if (!(__VLS_ctx.activePage === 'publisher'))
                                return;
                            if (!!(__VLS_ctx.dashboard.publishTasks.length === 0))
                                return;
                            if (!(__VLS_ctx.canShowPublishingActions(task.status)))
                                return;
                            __VLS_ctx.cancelTask(task.id);
                        } },
                    ...{ class: "text-button" },
                });
            }
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.activePage === 'dashboard'))
                            return;
                        if (!!(__VLS_ctx.activePage === 'accounts'))
                            return;
                        if (!!(__VLS_ctx.activePage === 'collector'))
                            return;
                        if (!(__VLS_ctx.activePage === 'publisher'))
                            return;
                        if (!!(__VLS_ctx.dashboard.publishTasks.length === 0))
                            return;
                        __VLS_ctx.showTaskDiagnostics(task.id);
                    } },
                ...{ class: "text-button" },
                disabled: (__VLS_ctx.publisherBusy),
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.activePage === 'dashboard'))
                            return;
                        if (!!(__VLS_ctx.activePage === 'accounts'))
                            return;
                        if (!!(__VLS_ctx.activePage === 'collector'))
                            return;
                        if (!(__VLS_ctx.activePage === 'publisher'))
                            return;
                        if (!!(__VLS_ctx.dashboard.publishTasks.length === 0))
                            return;
                        __VLS_ctx.removeTask(task.id);
                    } },
                ...{ class: "text-button danger" },
            });
        }
    }
    if (__VLS_ctx.selectedDiagnostics) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
            ...{ class: "diagnostics-panel" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "diagnostics-header" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
        (__VLS_ctx.selectedDiagnostics.task_id);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.clearDiagnostics) },
            ...{ class: "text-button" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "diagnostics-grid" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (__VLS_ctx.taskStatusLabel(__VLS_ctx.selectedDiagnostics.status));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (__VLS_ctx.selectedDiagnostics.run_dir);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (__VLS_ctx.selectedDiagnostics.result?.platform_url || '-');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (__VLS_ctx.selectedDiagnostics.result?.error_message || '-');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "diagnostics-block" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)({});
        if (__VLS_ctx.selectedDiagnostics.screenshots.length) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "screenshot-list" },
            });
            for (const [name] of __VLS_getVForSourceType((__VLS_ctx.selectedDiagnostics.screenshots))) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    key: (name),
                });
                (name);
            }
        }
        else {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "diagnostics-empty" },
            });
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "diagnostics-block" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.pre, __VLS_intrinsicElements.pre)({});
        (__VLS_ctx.selectedDiagnostics.logs || '暂无日志');
    }
}
else if (__VLS_ctx.activePage === 'models') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "panel" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "panel-title" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.modelStatusText);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "model-config-grid" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "model-config-block" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
        value: (__VLS_ctx.modelForm.provider),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "deepseek",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "other",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        type: "number",
        min: "0",
        max: "2",
        step: "0.1",
    });
    (__VLS_ctx.modelForm.temperature);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        type: "number",
        min: "5",
        max: "300",
    });
    (__VLS_ctx.modelForm.timeout_seconds);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "model-config-block" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        type: "password",
        placeholder: (__VLS_ctx.modelKeyPlaceholders.deepseek),
    });
    (__VLS_ctx.modelForm.deepseek_api_key);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({});
    (__VLS_ctx.modelForm.deepseek_base_url);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({});
    (__VLS_ctx.modelForm.deepseek_model);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "model-config-block" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        type: "password",
        placeholder: (__VLS_ctx.modelKeyPlaceholders.other),
    });
    (__VLS_ctx.modelForm.other_api_key);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        placeholder: "https://example.com/v1",
    });
    (__VLS_ctx.modelForm.other_base_url);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({});
    (__VLS_ctx.modelForm.other_model);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "model-test-panel" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
        value: (__VLS_ctx.modelTestPrompt),
        rows: "4",
        placeholder: "输入测试提示词",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "model-actions" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.saveModels) },
        ...{ class: "primary" },
        disabled: (__VLS_ctx.modelBusy),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.runModelTest) },
        ...{ class: "secondary" },
        disabled: (__VLS_ctx.modelBusy),
    });
    if (__VLS_ctx.modelTestResult) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.pre, __VLS_intrinsicElements.pre)({});
        (__VLS_ctx.modelTestResult);
    }
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "panel" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "panel-title" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
    (__VLS_ctx.currentNav.label);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "empty" },
    });
}
if (__VLS_ctx.selectedAccountWork) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.selectedAccountWork))
                    return;
                __VLS_ctx.selectedAccountWork = null;
            } },
        ...{ class: "modal-backdrop" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "work-content-modal" },
        role: "dialog",
        'aria-modal': "true",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "work-content-header" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)({});
    (__VLS_ctx.selectedAccountWork.title);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.selectedAccountWork))
                    return;
                __VLS_ctx.selectedAccountWork = null;
            } },
        ...{ class: "text-button" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.pre, __VLS_intrinsicElements.pre)({});
    (__VLS_ctx.selectedAccountWork.content || '暂无正文，下次同步会继续尝试补全。');
}
/** @type {__VLS_StyleScopedClasses['shell']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar']} */ ;
/** @type {__VLS_StyleScopedClasses['brand']} */ ;
/** @type {__VLS_StyleScopedClasses['nav']} */ ;
/** @type {__VLS_StyleScopedClasses['content']} */ ;
/** @type {__VLS_StyleScopedClasses['topbar']} */ ;
/** @type {__VLS_StyleScopedClasses['primary']} */ ;
/** @type {__VLS_StyleScopedClasses['metrics']} */ ;
/** @type {__VLS_StyleScopedClasses['metric']} */ ;
/** @type {__VLS_StyleScopedClasses['metric']} */ ;
/** @type {__VLS_StyleScopedClasses['metric']} */ ;
/** @type {__VLS_StyleScopedClasses['metric']} */ ;
/** @type {__VLS_StyleScopedClasses['panel']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-title']} */ ;
/** @type {__VLS_StyleScopedClasses['flow']} */ ;
/** @type {__VLS_StyleScopedClasses['panel']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-title']} */ ;
/** @type {__VLS_StyleScopedClasses['login-card']} */ ;
/** @type {__VLS_StyleScopedClasses['login-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['primary']} */ ;
/** @type {__VLS_StyleScopedClasses['empty']} */ ;
/** @type {__VLS_StyleScopedClasses['table']} */ ;
/** @type {__VLS_StyleScopedClasses['bulk-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['text-button']} */ ;
/** @type {__VLS_StyleScopedClasses['danger']} */ ;
/** @type {__VLS_StyleScopedClasses['table-row']} */ ;
/** @type {__VLS_StyleScopedClasses['table-head']} */ ;
/** @type {__VLS_StyleScopedClasses['account-table-row']} */ ;
/** @type {__VLS_StyleScopedClasses['checkbox-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['table-row']} */ ;
/** @type {__VLS_StyleScopedClasses['account-table-row']} */ ;
/** @type {__VLS_StyleScopedClasses['checkbox-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['row-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['text-button']} */ ;
/** @type {__VLS_StyleScopedClasses['text-button']} */ ;
/** @type {__VLS_StyleScopedClasses['text-button']} */ ;
/** @type {__VLS_StyleScopedClasses['danger']} */ ;
/** @type {__VLS_StyleScopedClasses['account-works-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['account-works-header']} */ ;
/** @type {__VLS_StyleScopedClasses['text-button']} */ ;
/** @type {__VLS_StyleScopedClasses['empty']} */ ;
/** @type {__VLS_StyleScopedClasses['compact-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['table']} */ ;
/** @type {__VLS_StyleScopedClasses['table-row']} */ ;
/** @type {__VLS_StyleScopedClasses['account-work-row']} */ ;
/** @type {__VLS_StyleScopedClasses['table-head']} */ ;
/** @type {__VLS_StyleScopedClasses['table-row']} */ ;
/** @type {__VLS_StyleScopedClasses['account-work-row']} */ ;
/** @type {__VLS_StyleScopedClasses['row-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['text-button']} */ ;
/** @type {__VLS_StyleScopedClasses['panel']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-title']} */ ;
/** @type {__VLS_StyleScopedClasses['collector-toolbar']} */ ;
/** @type {__VLS_StyleScopedClasses['primary']} */ ;
/** @type {__VLS_StyleScopedClasses['empty']} */ ;
/** @type {__VLS_StyleScopedClasses['collector-list']} */ ;
/** @type {__VLS_StyleScopedClasses['collector-item']} */ ;
/** @type {__VLS_StyleScopedClasses['secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-title']} */ ;
/** @type {__VLS_StyleScopedClasses['compact-title']} */ ;
/** @type {__VLS_StyleScopedClasses['empty']} */ ;
/** @type {__VLS_StyleScopedClasses['table']} */ ;
/** @type {__VLS_StyleScopedClasses['table-row']} */ ;
/** @type {__VLS_StyleScopedClasses['collector-table-head']} */ ;
/** @type {__VLS_StyleScopedClasses['table-row']} */ ;
/** @type {__VLS_StyleScopedClasses['collector-table-row']} */ ;
/** @type {__VLS_StyleScopedClasses['row-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['text-button']} */ ;
/** @type {__VLS_StyleScopedClasses['text-button']} */ ;
/** @type {__VLS_StyleScopedClasses['danger']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-drawer']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-header']} */ ;
/** @type {__VLS_StyleScopedClasses['secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['source-link']} */ ;
/** @type {__VLS_StyleScopedClasses['image-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['content-preview']} */ ;
/** @type {__VLS_StyleScopedClasses['panel']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-title']} */ ;
/** @type {__VLS_StyleScopedClasses['publisher-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['publisher-builder']} */ ;
/** @type {__VLS_StyleScopedClasses['form-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['stacked-field']} */ ;
/** @type {__VLS_StyleScopedClasses['stacked-field']} */ ;
/** @type {__VLS_StyleScopedClasses['row-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['end-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['primary']} */ ;
/** @type {__VLS_StyleScopedClasses['publisher-preview']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-title']} */ ;
/** @type {__VLS_StyleScopedClasses['compact-title']} */ ;
/** @type {__VLS_StyleScopedClasses['empty']} */ ;
/** @type {__VLS_StyleScopedClasses['table']} */ ;
/** @type {__VLS_StyleScopedClasses['table-row']} */ ;
/** @type {__VLS_StyleScopedClasses['publish-table-head']} */ ;
/** @type {__VLS_StyleScopedClasses['table-row']} */ ;
/** @type {__VLS_StyleScopedClasses['publish-table-row']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['row-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['task-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['text-button']} */ ;
/** @type {__VLS_StyleScopedClasses['text-button']} */ ;
/** @type {__VLS_StyleScopedClasses['danger']} */ ;
/** @type {__VLS_StyleScopedClasses['text-button']} */ ;
/** @type {__VLS_StyleScopedClasses['text-button']} */ ;
/** @type {__VLS_StyleScopedClasses['text-button']} */ ;
/** @type {__VLS_StyleScopedClasses['text-button']} */ ;
/** @type {__VLS_StyleScopedClasses['text-button']} */ ;
/** @type {__VLS_StyleScopedClasses['danger']} */ ;
/** @type {__VLS_StyleScopedClasses['diagnostics-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['diagnostics-header']} */ ;
/** @type {__VLS_StyleScopedClasses['text-button']} */ ;
/** @type {__VLS_StyleScopedClasses['diagnostics-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['diagnostics-block']} */ ;
/** @type {__VLS_StyleScopedClasses['screenshot-list']} */ ;
/** @type {__VLS_StyleScopedClasses['diagnostics-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['diagnostics-block']} */ ;
/** @type {__VLS_StyleScopedClasses['panel']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-title']} */ ;
/** @type {__VLS_StyleScopedClasses['model-config-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['model-config-block']} */ ;
/** @type {__VLS_StyleScopedClasses['model-config-block']} */ ;
/** @type {__VLS_StyleScopedClasses['model-config-block']} */ ;
/** @type {__VLS_StyleScopedClasses['model-test-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['model-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['primary']} */ ;
/** @type {__VLS_StyleScopedClasses['secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['panel']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-title']} */ ;
/** @type {__VLS_StyleScopedClasses['empty']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-backdrop']} */ ;
/** @type {__VLS_StyleScopedClasses['work-content-modal']} */ ;
/** @type {__VLS_StyleScopedClasses['work-content-header']} */ ;
/** @type {__VLS_StyleScopedClasses['text-button']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            navItems: navItems,
            dashboard: dashboard,
            statusText: statusText,
            activePage: activePage,
            currentNav: currentNav,
            loginBusy: loginBusy,
            loginPlatform: loginPlatform,
            loginSessionId: loginSessionId,
            selectedAccountIds: selectedAccountIds,
            selectedWorkAccount: selectedWorkAccount,
            accountWorks: accountWorks,
            selectedAccountWork: selectedAccountWork,
            collectorBusy: collectorBusy,
            importingUrl: importingUrl,
            collectorSources: collectorSources,
            collectorItems: collectorItems,
            selectedRawContent: selectedRawContent,
            collectorSourceKey: collectorSourceKey,
            collectorCategoryKey: collectorCategoryKey,
            publisherBusy: publisherBusy,
            selectedDiagnostics: selectedDiagnostics,
            modelBusy: modelBusy,
            modelStatusText: modelStatusText,
            modelTestPrompt: modelTestPrompt,
            modelTestResult: modelTestResult,
            modelForm: modelForm,
            modelKeyPlaceholders: modelKeyPlaceholders,
            publishForm: publishForm,
            collectorCategories: collectorCategories,
            allAccountsSelected: allAccountsSelected,
            refresh: refresh,
            saveModels: saveModels,
            runModelTest: runModelTest,
            openLoginSession: openLoginSession,
            confirmLogin: confirmLogin,
            removeAccount: removeAccount,
            removeSelectedAccounts: removeSelectedAccounts,
            syncWorks: syncWorks,
            showAccountWorks: showAccountWorks,
            clearAccountWorks: clearAccountWorks,
            selectAccountWork: selectAccountWork,
            syncCollectorCategory: syncCollectorCategory,
            previewCollector: previewCollector,
            importCollector: importCollector,
            removeRawContent: removeRawContent,
            formatDate: formatDate,
            metricText: metricText,
            syncPublishDraftForm: syncPublishDraftForm,
            createPublisherTask: createPublisherTask,
            openEditor: openEditor,
            autoPublish: autoPublish,
            markPublished: markPublished,
            markFailed: markFailed,
            cancelTask: cancelTask,
            showTaskDiagnostics: showTaskDiagnostics,
            clearDiagnostics: clearDiagnostics,
            removeTask: removeTask,
            draftTitle: draftTitle,
            taskStatusLabel: taskStatusLabel,
            taskStatusClass: taskStatusClass,
            canShowOpenEditor: canShowOpenEditor,
            canShowAutoPublish: canShowAutoPublish,
            canShowPublishingActions: canShowPublishingActions,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
