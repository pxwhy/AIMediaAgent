/// <reference types="../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { computed, defineComponent, h, onMounted, reactive, ref } from 'vue';
import { autoPublishTask, cancelPublishTask, createAgentConfig, createDraftFromRawContent, createModelConfig, createPublishTask, createSkillConfig, deleteAccountProfileReport, deleteAgentConfig, deleteAccountReviewReport, deleteRawContent, deleteAccount, deleteModelConfig, deletePublishTask, deleteSkillConfig, generateAccountReview, generateAccountProfile, importCollectorItem, confirmLoginSession, createLoginSession, loadAccountWorks, loadAgentConfigs, loadAccountProfileReports, loadAccountReviewReports, loadCollectorSources, loadDashboard, loadLocalSkills, loadModelConfigs, loadPublishTaskDiagnostics, loadSkillConfigs, markPublishTaskFailed, markPublishTaskPublished, openPublishEditor, reloadLocalSkills, selectCollectedContent, setDefaultAgentConfig, previewCollectorItems, setDefaultModelConfig, testModel, syncAccountWorks, updateAgentConfig, updateModelConfig, updateSkillConfig } from './api/client';
const pageSizeOptions = [10, 20, 50];
const PaginationBar = defineComponent({
    name: 'PaginationBar',
    props: {
        total: { type: Number, required: true },
        page: { type: Number, required: true },
        pageSize: { type: Number, required: true }
    },
    emits: ['update:page', 'update:pageSize'],
    setup(props, { emit }) {
        const totalPages = () => Math.max(1, Math.ceil(props.total / props.pageSize));
        const currentPage = () => Math.min(Math.max(1, props.page), totalPages());
        return () => h('div', { class: 'pagination-bar' }, [
            h('span', `共 ${props.total} 条`),
            h('label', [
                h('span', '每页'),
                h('select', {
                    value: props.pageSize,
                    onChange: (event) => {
                        emit('update:pageSize', Number(event.target.value));
                        emit('update:page', 1);
                    }
                }, pageSizeOptions.map((size) => h('option', { value: size }, String(size))))
            ]),
            h('button', {
                class: 'text-button',
                disabled: currentPage() <= 1,
                onClick: () => emit('update:page', currentPage() - 1)
            }, '上一页'),
            h('strong', `${currentPage()} / ${totalPages()}`),
            h('button', {
                class: 'text-button',
                disabled: currentPage() >= totalPages(),
                onClick: () => emit('update:page', currentPage() + 1)
            }, '下一页')
        ]);
    }
});
const navItems = [
    { key: 'dashboard', label: '仪表盘', description: '采集、Agent、审核、发布和复盘的轻量闭环。' },
    { key: 'accounts', label: '账号', description: '管理平台账号、登录态和每日发布限制。' },
    { key: 'models', label: '模型', description: '配置 DeepSeek 或其他兼容模型，供 Agent 统一调用。' },
    { key: 'agents', label: 'Agent', description: '配置 Agent 类型、绑定模型和执行提示词。' },
    { key: 'skills', label: 'Skills', description: '配置可复用 Skill，供 Agent 执行时注入。' },
    { key: 'collector', label: '采集', description: '手动预览热点、导入素材并管理原始内容。' },
    { key: 'smart-filter', label: '智能筛选', description: '根据复盘选择数据源、采集文章并调用 Agent 筛选素材。' },
    { key: 'account-profile', label: '账号肖像', description: '基于作品和复盘鉴定账号定位、受众、赛道和采集边界。' },
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
const pagination = reactive({
    accounts: { page: 1, pageSize: 10 },
    accountWorks: { page: 1, pageSize: 10 },
    collectorItems: { page: 1, pageSize: 10 },
    rawContents: { page: 1, pageSize: 10 },
    selectionResults: { page: 1, pageSize: 10 },
    publishTasks: { page: 1, pageSize: 10 },
    models: { page: 1, pageSize: 10 },
    agents: { page: 1, pageSize: 10 },
    skills: { page: 1, pageSize: 10 },
    reviewReports: { page: 1, pageSize: 10 },
    profileReports: { page: 1, pageSize: 10 }
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
const selectedRawContentIds = ref([]);
const contentSelectionBusy = ref(false);
const contentSelectionAgentId = ref(0);
const contentSelectionReviewReportId = ref(0);
const contentSelectionResult = ref(null);
const collectorSourceKey = ref('ithome');
const collectorCategoryKey = ref('home');
const publisherBusy = ref(false);
const selectedDiagnostics = ref(null);
const modelBusy = ref(false);
const modelStatusText = ref('等待加载');
const modelTestPrompt = ref('');
const modelTestResult = ref('');
const modelConfigs = ref([]);
const modelModalOpen = ref(false);
const agentBusy = ref(false);
const agentStatusText = ref('等待加载');
const agentConfigs = ref([]);
const agentModalOpen = ref(false);
const skillBusy = ref(false);
const skillStatusText = ref('等待加载');
const skillConfigs = ref([]);
const skillModalOpen = ref(false);
const localSkillsRoot = ref('');
const localSkills = ref([]);
const selectedLocalSkill = ref(null);
const reviewBusy = ref(false);
const reviewStatusText = ref('等待生成');
const reviewResult = ref(null);
const reviewReports = ref([]);
const selectedReviewReportId = ref(null);
const profileBusy = ref(false);
const profileStatusText = ref('等待鉴定');
const profileResult = ref(null);
const profileReports = ref([]);
const profileReviewReports = ref([]);
const selectedProfileReportId = ref(null);
const modelForm = reactive({
    id: 0,
    name: '',
    provider: 'deepseek',
    api_key: '',
    base_url: 'https://api.deepseek.com',
    model: 'deepseek-chat',
    temperature: 0.7,
    timeout_seconds: 60,
    is_default: false,
    api_key_configured: false
});
const agentForm = reactive({
    id: 0,
    name: '',
    agent_type: 'account_review',
    model_config_id: 0,
    system_prompt: '',
    user_prompt_template: '',
    skill_ids: [],
    skill_paths: [],
    enabled: true,
    is_default: false
});
const skillForm = reactive({
    id: 0,
    name: '',
    skill_type: 'prompt',
    description: '',
    content: '',
    enabled: true
});
const modelKeyPlaceholder = computed(() => modelForm.api_key_configured ? '已配置，留空则不修改' : '未配置');
const publishForm = reactive({
    raw_content_id: 0,
    account_id: 0,
    title: '',
    content: ''
});
const reviewForm = reactive({
    account_id: 0,
    agent_id: 0
});
const profileForm = reactive({
    account_id: 0,
    review_report_id: 0,
    agent_id: 0
});
const collectorCategories = computed(() => {
    const source = collectorSources.value.find((item) => item.key === collectorSourceKey.value);
    return source?.categories ?? [];
});
const reviewAgents = computed(() => agentConfigs.value.filter((agent) => agent.agent_type === 'account_review' && agent.enabled));
const contentSelectionAgents = computed(() => agentConfigs.value.filter((agent) => agent.agent_type === 'content_selection' && agent.enabled));
const profileAgents = computed(() => agentConfigs.value.filter((agent) => agent.agent_type === 'account_profile' && agent.enabled));
const selectedContentSelectionReview = computed(() => reviewReports.value.find((report) => report.id === contentSelectionReviewReportId.value) ?? null);
const canRunContentSelection = computed(() => selectedRawContentIds.value.length > 0 || Boolean(selectedContentSelectionReview.value));
const reviewResultCreatedAt = computed(() => {
    const value = reviewResult.value?.created_at;
    return value ? formatDate(value) : '刚刚生成';
});
const profileResultCreatedAt = computed(() => {
    const value = profileResult.value?.created_at;
    return value ? formatDate(value) : '刚刚生成';
});
const allAccountsSelected = computed({
    get() {
        return dashboard.accounts.length > 0 && selectedAccountIds.value.length === dashboard.accounts.length;
    },
    set(checked) {
        selectedAccountIds.value = checked ? dashboard.accounts.map((account) => account.id) : [];
    }
});
const allRawContentsSelected = computed({
    get() {
        return dashboard.rawContents.length > 0 && selectedRawContentIds.value.length === dashboard.rawContents.length;
    },
    set(checked) {
        selectedRawContentIds.value = checked ? dashboard.rawContents.map((content) => content.id) : [];
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
        const rawContentIds = new Set(data.rawContents.map((content) => content.id));
        selectedAccountIds.value = selectedAccountIds.value.filter((accountId) => accountIds.has(accountId));
        selectedRawContentIds.value = selectedRawContentIds.value.filter((rawContentId) => rawContentIds.has(rawContentId));
        statusText.value = '已同步';
    }
    catch (error) {
        console.error(error);
        statusText.value = 'API 未连接';
    }
}
async function loadModels() {
    modelStatusText.value = '加载中';
    try {
        modelConfigs.value = await loadModelConfigs();
        modelStatusText.value = '模型列表已加载';
    }
    catch (error) {
        console.error(error);
        modelStatusText.value = '模型列表加载失败';
    }
}
async function loadAgents() {
    agentStatusText.value = '加载中';
    try {
        agentConfigs.value = await loadAgentConfigs();
        agentStatusText.value = 'Agent 列表已加载';
    }
    catch (error) {
        console.error(error);
        agentStatusText.value = 'Agent 列表加载失败';
    }
}
async function loadSkills() {
    skillStatusText.value = '加载中';
    try {
        skillConfigs.value = await loadSkillConfigs();
        const payload = await loadLocalSkills();
        localSkillsRoot.value = payload.root;
        localSkills.value = payload.skills;
        skillStatusText.value = 'Skills 已加载';
    }
    catch (error) {
        console.error(error);
        skillStatusText.value = 'Skills 列表加载失败';
    }
}
async function reloadSkillsDirectory() {
    skillBusy.value = true;
    skillStatusText.value = '正在读取目录';
    try {
        const payload = await reloadLocalSkills();
        localSkillsRoot.value = payload.root;
        localSkills.value = payload.skills;
        selectedLocalSkill.value = null;
        skillStatusText.value = `已读取 ${payload.skills.length} 个 Skill`;
    }
    catch (error) {
        console.error(error);
        skillStatusText.value = readableError(error, '读取 Skills 目录失败');
    }
    finally {
        skillBusy.value = false;
    }
}
async function saveModels() {
    modelBusy.value = true;
    modelStatusText.value = '正在保存模型';
    try {
        const payload = {
            name: modelForm.name,
            provider: modelForm.provider,
            api_key: modelForm.api_key,
            base_url: modelForm.base_url,
            model: modelForm.model,
            temperature: modelForm.temperature,
            timeout_seconds: modelForm.timeout_seconds,
            is_default: modelForm.is_default
        };
        const config = modelForm.id
            ? await updateModelConfig(modelForm.id, payload)
            : await createModelConfig(payload);
        await loadModels();
        editModel(config);
        closeModelModal();
        modelStatusText.value = '模型已保存';
    }
    catch (error) {
        console.error(error);
        modelStatusText.value = '模型保存失败';
    }
    finally {
        modelBusy.value = false;
    }
}
function openCreateModelModal() {
    resetModelForm();
    modelModalOpen.value = true;
}
function openEditModelModal(config) {
    editModel(config);
    modelModalOpen.value = true;
}
function closeModelModal() {
    modelModalOpen.value = false;
}
function editModel(config) {
    modelForm.id = config.id;
    modelForm.name = config.name;
    modelForm.provider = config.provider;
    modelForm.api_key = '';
    modelForm.base_url = config.base_url;
    modelForm.model = config.model;
    modelForm.temperature = config.temperature;
    modelForm.timeout_seconds = config.timeout_seconds;
    modelForm.is_default = config.is_default;
    modelForm.api_key_configured = config.api_key_configured;
    modelTestResult.value = '';
}
function resetModelForm() {
    modelForm.id = 0;
    modelForm.name = '';
    modelForm.provider = 'deepseek';
    modelForm.api_key = '';
    modelForm.base_url = 'https://api.deepseek.com';
    modelForm.model = 'deepseek-chat';
    modelForm.temperature = 0.7;
    modelForm.timeout_seconds = 60;
    modelForm.is_default = modelConfigs.value.length === 0;
    modelForm.api_key_configured = false;
    modelTestResult.value = '';
}
function syncModelDefaults() {
    if (modelForm.provider === 'deepseek') {
        if (!modelForm.base_url) {
            modelForm.base_url = 'https://api.deepseek.com';
        }
        if (!modelForm.model) {
            modelForm.model = 'deepseek-chat';
        }
    }
}
async function setDefaultModel(modelConfigId) {
    modelBusy.value = true;
    modelStatusText.value = '正在设置默认模型';
    try {
        await setDefaultModelConfig(modelConfigId);
        await loadModels();
        modelStatusText.value = '默认模型已更新';
    }
    catch (error) {
        console.error(error);
        modelStatusText.value = '设置默认模型失败';
    }
    finally {
        modelBusy.value = false;
    }
}
async function removeModel(config) {
    if (!window.confirm(`确认删除模型「${config.name}」吗？`)) {
        return;
    }
    modelBusy.value = true;
    modelStatusText.value = '正在删除模型';
    try {
        await deleteModelConfig(config.id);
        if (modelForm.id === config.id) {
            resetModelForm();
        }
        await loadModels();
        modelStatusText.value = '模型已删除';
    }
    catch (error) {
        console.error(error);
        modelStatusText.value = '模型删除失败';
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
        const result = await testModel(modelTestPrompt.value, modelForm.id || null);
        modelTestResult.value = `${result.provider} / ${result.model}\n\n${result.content}`;
        modelStatusText.value = '模型测试成功';
    }
    catch (error) {
        console.error(error);
        modelStatusText.value = '模型测试失败';
        modelTestResult.value = readableError(error, '模型测试失败，请检查模型配置');
    }
    finally {
        modelBusy.value = false;
    }
}
function modelProviderLabel(provider) {
    return provider === 'other' ? '其他模型' : 'DeepSeek';
}
function agentTypeLabel(agentType) {
    const labels = {
        account_review: '账号复盘',
        content_selection: '素材挑选',
        account_profile: '账号肖像'
    };
    return labels[agentType] ?? agentType;
}
async function saveAgent() {
    agentBusy.value = true;
    agentStatusText.value = '正在保存 Agent';
    try {
        const payload = {
            name: agentForm.name,
            agent_type: agentForm.agent_type,
            model_config_id: agentForm.model_config_id || null,
            system_prompt: agentForm.system_prompt,
            user_prompt_template: agentForm.user_prompt_template,
            skill_ids: agentForm.skill_ids,
            skill_paths: agentForm.skill_paths,
            enabled: agentForm.enabled,
            is_default: agentForm.is_default
        };
        const config = agentForm.id
            ? await updateAgentConfig(agentForm.id, payload)
            : await createAgentConfig(payload);
        await loadAgents();
        editAgent(config);
        closeAgentModal();
        agentStatusText.value = 'Agent 已保存';
    }
    catch (error) {
        console.error(error);
        agentStatusText.value = readableError(error, 'Agent 保存失败');
    }
    finally {
        agentBusy.value = false;
    }
}
function openCreateAgentModal() {
    resetAgentForm();
    agentModalOpen.value = true;
}
function openEditAgentModal(config) {
    editAgent(config);
    agentModalOpen.value = true;
}
function closeAgentModal() {
    agentModalOpen.value = false;
}
function editAgent(config) {
    agentForm.id = config.id;
    agentForm.name = config.name;
    agentForm.agent_type = config.agent_type;
    agentForm.model_config_id = config.model_config_id || 0;
    agentForm.system_prompt = config.system_prompt;
    agentForm.user_prompt_template = config.user_prompt_template;
    agentForm.skill_ids = [...config.skill_ids];
    agentForm.skill_paths = [...config.skill_paths];
    agentForm.enabled = config.enabled;
    agentForm.is_default = config.is_default;
}
function resetAgentForm() {
    agentForm.id = 0;
    agentForm.name = '账号复盘 Agent';
    agentForm.agent_type = 'account_review';
    agentForm.model_config_id = 0;
    agentForm.system_prompt = '你是一个中文自媒体运营复盘 Agent，擅长从作品数据中提炼内容方向、标题规律和下一步选题建议。';
    agentForm.user_prompt_template = [
        '请基于这些作品做一份中文复盘报告，要求：',
        '1. 先总结账号当前内容表现和整体方向。',
        '2. 找出表现较好的作品，并解释可能原因。',
        '3. 分析标题规律、内容结构和受众兴趣点。',
        '4. 指出当前内容存在的问题或数据短板。',
        '5. 给出 5 个下一步选题建议，每个建议附带推荐标题方向。',
        '6. 给出 3 条可执行优化建议。',
        '',
        '输出要结构清晰，避免空泛套话。'
    ].join('\n');
    agentForm.skill_ids = [];
    agentForm.skill_paths = [];
    agentForm.enabled = true;
    agentForm.is_default = agentConfigs.value.length === 0;
}
function syncAgentDefaults() {
    if (agentForm.agent_type === 'content_selection') {
        if (!agentForm.name || agentForm.name.includes('复盘')) {
            agentForm.name = '素材挑选 Agent';
        }
        if (!agentForm.system_prompt || agentForm.system_prompt.includes('复盘')) {
            agentForm.system_prompt = '你是一个中文自媒体素材挑选 Agent，擅长判断采集内容是否适合进入创作和发布流程。';
        }
        if (!agentForm.user_prompt_template || agentForm.user_prompt_template.includes('复盘')) {
            agentForm.user_prompt_template = [
                '请根据采集内容的选题价值、账号适配度、时效性、风险和可改写空间做素材挑选。',
                '优先选择具备讨论度、信息增量、可解释性和可持续创作角度的内容。',
                '不要自动选择风险高、信息不足、标题党明显或无法形成有效观点的内容。'
            ].join('\n');
        }
        return;
    }
    if (agentForm.agent_type === 'account_profile') {
        if (!agentForm.name || agentForm.name.includes('复盘') || agentForm.name.includes('挑选')) {
            agentForm.name = '账号肖像 Agent';
        }
        if (!agentForm.system_prompt || agentForm.system_prompt.includes('复盘') || agentForm.system_prompt.includes('挑选')) {
            agentForm.system_prompt = '你是一个中文自媒体账号肖像鉴定 Agent，擅长基于作品和复盘报告提炼长期稳定的账号画像。';
        }
        if (!agentForm.user_prompt_template || agentForm.user_prompt_template.includes('复盘') || agentForm.user_prompt_template.includes('采集内容')) {
            agentForm.user_prompt_template = [
                '请基于账号作品和复盘信息生成账号肖像。',
                '重点提炼长期稳定的账号定位、目标受众、内容赛道、标题风格、适合采集的数据源方向、禁止内容方向和风险边界。',
                '结论要能指导后续智能筛选和内容创作，不要只复述单次复盘。'
            ].join('\n');
        }
        return;
    }
    if (!agentForm.name || agentForm.name.includes('挑选') || agentForm.name.includes('肖像')) {
        agentForm.name = '账号复盘 Agent';
        agentForm.system_prompt = '你是一个中文自媒体运营复盘 Agent，擅长从作品数据中提炼内容方向、标题规律和下一步选题建议。';
        agentForm.user_prompt_template = [
            '请基于这些作品做一份中文复盘报告，要求：',
            '1. 先总结账号当前内容表现和整体方向。',
            '2. 找出表现较好的作品，并解释可能原因。',
            '3. 分析标题规律、内容结构和受众兴趣点。',
            '4. 指出当前内容存在的问题或数据短板。',
            '5. 给出 5 个下一步选题建议，每个建议附带推荐标题方向。',
            '6. 给出 3 条可执行优化建议。',
            '',
            '输出要结构清晰，避免空泛套话。'
        ].join('\n');
    }
}
async function saveSkill() {
    skillBusy.value = true;
    skillStatusText.value = '正在保存 Skill';
    try {
        const payload = {
            name: skillForm.name,
            skill_type: skillForm.skill_type,
            description: skillForm.description,
            content: skillForm.content,
            enabled: skillForm.enabled
        };
        const config = skillForm.id
            ? await updateSkillConfig(skillForm.id, payload)
            : await createSkillConfig(payload);
        await loadSkills();
        editSkill(config);
        closeSkillModal();
        skillStatusText.value = 'Skill 已保存';
    }
    catch (error) {
        console.error(error);
        skillStatusText.value = readableError(error, 'Skill 保存失败');
    }
    finally {
        skillBusy.value = false;
    }
}
function openCreateSkillModal() {
    resetSkillForm();
    skillModalOpen.value = true;
}
function openEditSkillModal(config) {
    editSkill(config);
    skillModalOpen.value = true;
}
function closeSkillModal() {
    skillModalOpen.value = false;
}
function editSkill(config) {
    skillForm.id = config.id;
    skillForm.name = config.name;
    skillForm.skill_type = config.skill_type;
    skillForm.description = config.description;
    skillForm.content = config.content;
    skillForm.enabled = config.enabled;
}
function resetSkillForm() {
    skillForm.id = 0;
    skillForm.name = '';
    skillForm.skill_type = 'prompt';
    skillForm.description = '';
    skillForm.content = '';
    skillForm.enabled = true;
}
async function removeSkill(config) {
    if (!window.confirm(`确认删除 Skill「${config.name}」吗？`)) {
        return;
    }
    skillBusy.value = true;
    skillStatusText.value = '正在删除 Skill';
    try {
        await deleteSkillConfig(config.id);
        if (skillForm.id === config.id) {
            resetSkillForm();
        }
        await Promise.all([loadSkills(), loadAgents()]);
        skillStatusText.value = 'Skill 已删除';
    }
    catch (error) {
        console.error(error);
        skillStatusText.value = readableError(error, 'Skill 删除失败');
    }
    finally {
        skillBusy.value = false;
    }
}
async function setDefaultAgent(agentId) {
    agentBusy.value = true;
    agentStatusText.value = '正在设置默认 Agent';
    try {
        await setDefaultAgentConfig(agentId);
        await loadAgents();
        agentStatusText.value = '默认 Agent 已更新';
    }
    catch (error) {
        console.error(error);
        agentStatusText.value = readableError(error, '设置默认 Agent 失败');
    }
    finally {
        agentBusy.value = false;
    }
}
async function removeAgent(config) {
    if (!window.confirm(`确认删除 Agent「${config.name}」吗？`)) {
        return;
    }
    agentBusy.value = true;
    agentStatusText.value = '正在删除 Agent';
    try {
        await deleteAgentConfig(config.id);
        if (agentForm.id === config.id) {
            resetAgentForm();
        }
        if (reviewForm.agent_id === config.id) {
            reviewForm.agent_id = 0;
        }
        if (contentSelectionAgentId.value === config.id) {
            contentSelectionAgentId.value = 0;
        }
        if (profileForm.agent_id === config.id) {
            profileForm.agent_id = 0;
        }
        await loadAgents();
        agentStatusText.value = 'Agent 已删除';
    }
    catch (error) {
        console.error(error);
        agentStatusText.value = readableError(error, 'Agent 删除失败');
    }
    finally {
        agentBusy.value = false;
    }
}
function readableError(error, fallback = '操作失败，请稍后重试') {
    const response = error.response;
    return response?.data?.detail || fallback;
}
function pageItems(items, key) {
    const state = pagination[key];
    const pageSize = state.pageSize;
    const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
    const page = Math.min(Math.max(1, state.page), totalPages);
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
}
function shouldShowPagination(items, key) {
    return items.length > pagination[key].pageSize;
}
function reviewList(items) {
    return items.length ? items : ['-'];
}
function priorityLabel(priority) {
    const labels = {
        high: '高优先级',
        medium: '中优先级',
        low: '低优先级'
    };
    return labels[priority] ?? (priority || '-');
}
async function generateReview() {
    if (!reviewForm.account_id) {
        reviewStatusText.value = '请选择账号';
        return;
    }
    reviewBusy.value = true;
    reviewStatusText.value = '正在生成复盘';
    reviewResult.value = null;
    try {
        reviewResult.value = await generateAccountReview({
            account_id: reviewForm.account_id,
            agent_id: reviewForm.agent_id || null
        });
        selectedReviewReportId.value = reviewResult.value.id ?? null;
        await loadReviewReports();
        reviewStatusText.value = '复盘已生成';
    }
    catch (error) {
        console.error(error);
        reviewStatusText.value = readableError(error);
    }
    finally {
        reviewBusy.value = false;
    }
}
async function loadReviewReports() {
    try {
        reviewReports.value = await loadAccountReviewReports(reviewForm.account_id || null);
    }
    catch (error) {
        console.error(error);
        reviewStatusText.value = readableError(error, '复盘历史加载失败');
    }
}
async function loadProfileContext() {
    if (!profileForm.account_id) {
        profileReports.value = [];
        profileReviewReports.value = [];
        profileResult.value = null;
        selectedProfileReportId.value = null;
        return;
    }
    profileStatusText.value = '正在加载账号上下文';
    try {
        const [reports, reviews] = await Promise.all([
            loadAccountProfileReports(profileForm.account_id),
            loadAccountReviewReports(profileForm.account_id)
        ]);
        profileReports.value = reports;
        profileReviewReports.value = reviews;
        if (!reviews.some((report) => report.id === profileForm.review_report_id)) {
            profileForm.review_report_id = 0;
        }
        profileStatusText.value = '账号上下文已加载';
    }
    catch (error) {
        console.error(error);
        profileStatusText.value = readableError(error, '账号肖像上下文加载失败');
    }
}
async function generateProfile() {
    if (!profileForm.account_id) {
        profileStatusText.value = '请选择账号';
        return;
    }
    profileBusy.value = true;
    profileStatusText.value = '正在生成账号肖像';
    profileResult.value = null;
    try {
        profileResult.value = await generateAccountProfile({
            account_id: profileForm.account_id,
            review_report_id: profileForm.review_report_id || null,
            agent_id: profileForm.agent_id || null
        });
        selectedProfileReportId.value = profileResult.value.id ?? null;
        await loadProfileContext();
        profileStatusText.value = '账号肖像已生成';
    }
    catch (error) {
        console.error(error);
        profileStatusText.value = readableError(error, '账号肖像生成失败');
    }
    finally {
        profileBusy.value = false;
    }
}
function selectProfileReport(report) {
    profileResult.value = report;
    selectedProfileReportId.value = report.id;
    profileStatusText.value = '已载入历史肖像';
}
async function removeProfileReport(report) {
    if (!window.confirm(`确认删除 ${formatDate(report.created_at)} 的账号肖像记录吗？`)) {
        return;
    }
    profileBusy.value = true;
    profileStatusText.value = '正在删除账号肖像记录';
    try {
        await deleteAccountProfileReport(report.id);
        if (selectedProfileReportId.value === report.id) {
            profileResult.value = null;
            selectedProfileReportId.value = null;
        }
        await loadProfileContext();
        profileStatusText.value = '账号肖像记录已删除';
    }
    catch (error) {
        console.error(error);
        profileStatusText.value = readableError(error, '账号肖像记录删除失败');
    }
    finally {
        profileBusy.value = false;
    }
}
function selectReviewReport(report) {
    reviewResult.value = report;
    selectedReviewReportId.value = report.id;
    reviewStatusText.value = '已载入历史复盘';
}
async function removeReviewReport(report) {
    if (!window.confirm(`确认删除 ${formatDate(report.created_at)} 的复盘记录吗？`)) {
        return;
    }
    reviewBusy.value = true;
    reviewStatusText.value = '正在删除复盘记录';
    try {
        await deleteAccountReviewReport(report.id);
        if (selectedReviewReportId.value === report.id) {
            reviewResult.value = null;
            selectedReviewReportId.value = null;
        }
        await loadReviewReports();
        reviewStatusText.value = '复盘记录已删除';
    }
    catch (error) {
        console.error(error);
        reviewStatusText.value = readableError(error, '复盘记录删除失败');
    }
    finally {
        reviewBusy.value = false;
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
        if (profileForm.account_id === account.id) {
            profileForm.account_id = 0;
            profileReports.value = [];
            profileReviewReports.value = [];
            profileResult.value = null;
            selectedProfileReportId.value = null;
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
        if (accountIds.includes(profileForm.account_id)) {
            profileForm.account_id = 0;
            profileReports.value = [];
            profileReviewReports.value = [];
            profileResult.value = null;
            selectedProfileReportId.value = null;
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
        selectedRawContentIds.value = selectedRawContentIds.value.filter((rawContentId) => rawContentId !== content.id);
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
async function runContentSelection() {
    contentSelectionBusy.value = true;
    contentSelectionResult.value = null;
    try {
        const candidateIds = selectedRawContentIds.value.length
            ? [...selectedRawContentIds.value]
            : await collectRawContentsByReview();
        if (candidateIds.length === 0) {
            statusText.value = selectedContentSelectionReview.value
                ? '复盘方向暂无匹配的数据源分类'
                : '请选择采集内容或复盘报告';
            return;
        }
        statusText.value = selectedRawContentIds.value.length
            ? '正在智能挑选已选素材'
            : '正在分析智能采集素材';
        contentSelectionResult.value = await selectCollectedContent({
            raw_content_ids: candidateIds,
            agent_id: contentSelectionAgentId.value || null
        });
        statusText.value = `素材挑选完成，共 ${candidateIds.length} 条候选`;
    }
    catch (error) {
        console.error(error);
        statusText.value = readableError(error, '素材挑选失败');
    }
    finally {
        contentSelectionBusy.value = false;
    }
}
async function collectRawContentsByReview() {
    const report = selectedContentSelectionReview.value;
    if (!report) {
        return [];
    }
    const targets = matchCollectorTargetsByReview(report).slice(0, 3);
    if (targets.length === 0) {
        return [];
    }
    const rawContentIds = [];
    const previewItems = [];
    for (const target of targets) {
        statusText.value = `正在预览 ${target.sourceName} / ${target.categoryName}`;
        const items = await previewCollectorItems({
            source: target.source,
            category: target.category,
            limit: 20,
            with_detail: false
        });
        previewItems.push(...items);
        for (const item of items) {
            const rawContent = await importCollectorForSelection(item);
            if (rawContent && !rawContentIds.includes(rawContent.id)) {
                rawContentIds.push(rawContent.id);
            }
        }
    }
    collectorItems.value = previewItems;
    await refresh();
    statusText.value = `已按复盘导入 ${rawContentIds.length} 条素材`;
    return rawContentIds;
}
async function importCollectorForSelection(item) {
    const existing = dashboard.rawContents.find((content) => content.source_url === item.url);
    if (existing) {
        return existing;
    }
    try {
        return await importCollectorItem(item);
    }
    catch (error) {
        console.error(error);
        return null;
    }
}
function matchCollectorTargetsByReview(report) {
    const keywords = extractReviewKeywords(report);
    if (keywords.length === 0) {
        return [];
    }
    return collectorSources.value
        .flatMap((source) => source.categories.map((category) => ({
        source: source.key,
        sourceName: source.name,
        category: category.key,
        categoryName: category.name,
        score: scoreCollectorTargetByKeywords(source, category, keywords)
    })))
        .filter((target) => target.score > 0)
        .sort((a, b) => {
        if (b.score !== a.score) {
            return b.score - a.score;
        }
        return `${a.sourceName}${a.categoryName}`.localeCompare(`${b.sourceName}${b.categoryName}`, 'zh-CN');
    });
}
function extractReviewKeywords(report) {
    const values = [
        report.report.positioning.current_direction,
        ...report.report.positioning.strengths,
        ...report.report.audience.interests,
        ...report.report.audience.unmet_needs,
        ...report.report.topic_suggestions.flatMap((item) => [
            item.topic,
            item.title_direction,
            item.reason,
            item.angle
        ]),
        ...report.report.actions.map((item) => item.action)
    ];
    const keywords = [];
    for (const value of values) {
        for (const keyword of splitKeywordText(value)) {
            if (!keywords.includes(keyword)) {
                keywords.push(keyword);
            }
        }
        for (const keyword of extractDomainKeywords(value)) {
            if (!keywords.includes(keyword)) {
                keywords.push(keyword);
            }
        }
    }
    return keywords.slice(0, 40);
}
function splitKeywordText(value) {
    return String(value || '')
        .split(/[\s,，。；;、：:（）()【】[\]《》"'“”‘’/\\|]+/)
        .map((item) => item.trim().toLowerCase())
        .filter((item) => item.length >= 2 && item.length <= 24);
}
function extractDomainKeywords(value) {
    const text = String(value || '').toLowerCase();
    const domainKeywords = [
        'ai',
        '人工智能',
        '科技',
        '数码',
        '互联网',
        '手机',
        '通信',
        '财经',
        '经济',
        '商业',
        '金融',
        '股票',
        '基金',
        'ipo',
        '教育',
        '高考',
        '考研',
        '留学',
        '国际',
        '全球',
        '外交',
        '社会',
        '时政',
        '政策',
        '民生',
        '文化',
        '历史',
        '艺术',
        '文旅',
        '健康',
        '生活',
        '亲子',
        '母婴',
        '体育',
        '娱乐',
        '游戏',
        '汽车',
        '房产'
    ];
    return domainKeywords.filter((keyword) => text.includes(keyword));
}
function scoreCollectorTargetByKeywords(source, category, keywords) {
    const text = `${source.key} ${source.name} ${category.key} ${category.name}`.toLowerCase();
    const expandedText = `${text} ${collectorTargetAliasText(source, category)}`.toLowerCase();
    let score = 0;
    for (const keyword of keywords) {
        if (expandedText.includes(keyword)) {
            score += 4;
        }
    }
    return score;
}
function collectorTargetAliasText(source, category) {
    const text = `${source.name} ${category.name}`;
    const aliases = [];
    if (/it|科技|数码|互联网|通信|智能|硬件|ai|5g/i.test(text)) {
        aliases.push('科技 数码 互联网 ai 人工智能 产品 手机 通信 智能硬件');
    }
    if (/财经|经济|股票|基金|ipo|公司|地产|商业|金融/i.test(text)) {
        aliases.push('财经 经济 公司 商业 金融 投资 股票 基金 ipo 地产');
    }
    if (/教育|高考|考研|学校|高校|留学/i.test(text)) {
        aliases.push('教育 学习 学校 高考 考研 留学 老师 学生');
    }
    if (/国际|世界|外交|全球|海外/i.test(text)) {
        aliases.push('国际 世界 全球 海外 外交');
    }
    if (/时政|政|社会|法治|热点|要闻|舆论/i.test(text)) {
        aliases.push('时政 社会 热点 舆论 政策 民生 新闻');
    }
    if (/文化|历史|艺术|读书|文旅|旅游/i.test(text)) {
        aliases.push('文化 历史 艺术 读书 文旅 旅游');
    }
    if (/健康|生活|亲子|母婴|时尚|美容/i.test(text)) {
        aliases.push('健康 生活 亲子 母婴 时尚 美容');
    }
    if (/体育|运动|赛事/i.test(text)) {
        aliases.push('体育 运动 赛事');
    }
    if (/娱乐|明星|影视|音乐|综艺/i.test(text)) {
        aliases.push('娱乐 明星 影视 音乐 综艺');
    }
    if (/游戏|电竞|手游|网游/i.test(text)) {
        aliases.push('游戏 电竞 手游 网游');
    }
    if (/汽车|车/i.test(text)) {
        aliases.push('汽车 新能源车 车');
    }
    if (/房产|房地产|地产/i.test(text)) {
        aliases.push('房产 房地产 地产');
    }
    return aliases.join(' ');
}
function selectionReviewLabel(report) {
    const account = dashboard.accounts.find((item) => item.id === report.account_id);
    const accountName = account?.nickname || account?.uid || `账号 ${report.account_id}`;
    return `${accountName} / ${formatDate(report.created_at)}`;
}
function rawContentTitle(rawContentId) {
    const content = dashboard.rawContents.find((item) => item.id === rawContentId);
    return content?.title || `素材 ${rawContentId}`;
}
function selectionResultClass(item) {
    return item.selected ? 'status-published' : 'status-failed';
}
function selectionRiskLabel(risk) {
    const labels = {
        high: '高风险',
        medium: '中风险',
        low: '低风险'
    };
    return labels[risk] ?? risk;
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
    await Promise.all([refresh(), loadCollectors(), loadModels(), loadAgents(), loadSkills()]);
    await loadReviewReports();
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
        for (const [account] of __VLS_getVForSourceType((__VLS_ctx.pageItems(__VLS_ctx.dashboard.accounts, 'accounts')))) {
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
    if (__VLS_ctx.shouldShowPagination(__VLS_ctx.dashboard.accounts, 'accounts')) {
        const __VLS_0 = {}.PaginationBar;
        /** @type {[typeof __VLS_components.PaginationBar, ]} */ ;
        // @ts-ignore
        const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
            page: (__VLS_ctx.pagination.accounts.page),
            pageSize: (__VLS_ctx.pagination.accounts.pageSize),
            total: (__VLS_ctx.dashboard.accounts.length),
        }));
        const __VLS_2 = __VLS_1({
            page: (__VLS_ctx.pagination.accounts.page),
            pageSize: (__VLS_ctx.pagination.accounts.pageSize),
            total: (__VLS_ctx.dashboard.accounts.length),
        }, ...__VLS_functionalComponentArgsRest(__VLS_1));
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
            for (const [work] of __VLS_getVForSourceType((__VLS_ctx.pageItems(__VLS_ctx.accountWorks, 'accountWorks')))) {
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
        if (__VLS_ctx.shouldShowPagination(__VLS_ctx.accountWorks, 'accountWorks')) {
            const __VLS_4 = {}.PaginationBar;
            /** @type {[typeof __VLS_components.PaginationBar, ]} */ ;
            // @ts-ignore
            const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
                page: (__VLS_ctx.pagination.accountWorks.page),
                pageSize: (__VLS_ctx.pagination.accountWorks.pageSize),
                total: (__VLS_ctx.accountWorks.length),
            }));
            const __VLS_6 = __VLS_5({
                page: (__VLS_ctx.pagination.accountWorks.page),
                pageSize: (__VLS_ctx.pagination.accountWorks.pageSize),
                total: (__VLS_ctx.accountWorks.length),
            }, ...__VLS_functionalComponentArgsRest(__VLS_5));
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
        for (const [item] of __VLS_getVForSourceType((__VLS_ctx.pageItems(__VLS_ctx.collectorItems, 'collectorItems')))) {
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
    if (__VLS_ctx.shouldShowPagination(__VLS_ctx.collectorItems, 'collectorItems')) {
        const __VLS_8 = {}.PaginationBar;
        /** @type {[typeof __VLS_components.PaginationBar, ]} */ ;
        // @ts-ignore
        const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
            page: (__VLS_ctx.pagination.collectorItems.page),
            pageSize: (__VLS_ctx.pagination.collectorItems.pageSize),
            total: (__VLS_ctx.collectorItems.length),
        }));
        const __VLS_10 = __VLS_9({
            page: (__VLS_ctx.pagination.collectorItems.page),
            pageSize: (__VLS_ctx.pagination.collectorItems.pageSize),
            total: (__VLS_ctx.collectorItems.length),
        }, ...__VLS_functionalComponentArgsRest(__VLS_9));
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
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "checkbox-cell" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            type: "checkbox",
        });
        (__VLS_ctx.allRawContentsSelected);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        for (const [content] of __VLS_getVForSourceType((__VLS_ctx.pageItems(__VLS_ctx.dashboard.rawContents, 'rawContents')))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                key: (content.id),
                ...{ class: "table-row collector-table-row" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "checkbox-cell" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                type: "checkbox",
                value: (content.id),
            });
            (__VLS_ctx.selectedRawContentIds);
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
        if (__VLS_ctx.shouldShowPagination(__VLS_ctx.dashboard.rawContents, 'rawContents')) {
            const __VLS_12 = {}.PaginationBar;
            /** @type {[typeof __VLS_components.PaginationBar, ]} */ ;
            // @ts-ignore
            const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
                page: (__VLS_ctx.pagination.rawContents.page),
                pageSize: (__VLS_ctx.pagination.rawContents.pageSize),
                total: (__VLS_ctx.dashboard.rawContents.length),
            }));
            const __VLS_14 = __VLS_13({
                page: (__VLS_ctx.pagination.rawContents.page),
                pageSize: (__VLS_ctx.pagination.rawContents.pageSize),
                total: (__VLS_ctx.dashboard.rawContents.length),
            }, ...__VLS_functionalComponentArgsRest(__VLS_13));
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
else if (__VLS_ctx.activePage === 'smart-filter') {
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
        ...{ class: "collector-selection-toolbar smart-filter-toolbar" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "selection-count" },
    });
    (__VLS_ctx.selectedRawContentIds.length);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "selection-agent-field" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
        value: (__VLS_ctx.contentSelectionAgentId),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: (0),
    });
    for (const [config] of __VLS_getVForSourceType((__VLS_ctx.contentSelectionAgents))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
            key: (config.id),
            value: (config.id),
        });
        (config.name);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "selection-agent-field" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
        value: (__VLS_ctx.contentSelectionReviewReportId),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: (0),
    });
    for (const [report] of __VLS_getVForSourceType((__VLS_ctx.reviewReports))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
            key: (report.id),
            value: (report.id),
        });
        (__VLS_ctx.selectionReviewLabel(report));
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "selection-actions" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.runContentSelection) },
        ...{ class: "primary" },
        disabled: (__VLS_ctx.contentSelectionBusy || !__VLS_ctx.canRunContentSelection),
    });
    (__VLS_ctx.contentSelectionBusy ? '筛选中' : '智能采集筛选');
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
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "checkbox-cell" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            type: "checkbox",
        });
        (__VLS_ctx.allRawContentsSelected);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        for (const [content] of __VLS_getVForSourceType((__VLS_ctx.pageItems(__VLS_ctx.dashboard.rawContents, 'rawContents')))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                key: (content.id),
                ...{ class: "table-row collector-table-row" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "checkbox-cell" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                type: "checkbox",
                value: (content.id),
            });
            (__VLS_ctx.selectedRawContentIds);
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
                        if (!!(__VLS_ctx.activePage === 'collector'))
                            return;
                        if (!(__VLS_ctx.activePage === 'smart-filter'))
                            return;
                        if (!!(__VLS_ctx.dashboard.rawContents.length === 0))
                            return;
                        __VLS_ctx.selectedRawContent = content;
                    } },
                ...{ class: "text-button" },
            });
        }
        if (__VLS_ctx.shouldShowPagination(__VLS_ctx.dashboard.rawContents, 'rawContents')) {
            const __VLS_16 = {}.PaginationBar;
            /** @type {[typeof __VLS_components.PaginationBar, ]} */ ;
            // @ts-ignore
            const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
                page: (__VLS_ctx.pagination.rawContents.page),
                pageSize: (__VLS_ctx.pagination.rawContents.pageSize),
                total: (__VLS_ctx.dashboard.rawContents.length),
            }));
            const __VLS_18 = __VLS_17({
                page: (__VLS_ctx.pagination.rawContents.page),
                pageSize: (__VLS_ctx.pagination.rawContents.pageSize),
                total: (__VLS_ctx.dashboard.rawContents.length),
            }, ...__VLS_functionalComponentArgsRest(__VLS_17));
        }
    }
    if (__VLS_ctx.contentSelectionResult) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
            ...{ class: "selection-result-panel" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "panel-title compact-title" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (__VLS_ctx.contentSelectionResult.agent_name || '默认 Agent');
        (__VLS_ctx.contentSelectionResult.model);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "selection-result-list" },
        });
        for (const [item] of __VLS_getVForSourceType((__VLS_ctx.pageItems(__VLS_ctx.contentSelectionResult.results, 'selectionResults')))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
                key: (item.raw_content_id),
                ...{ class: "selection-result-item" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "selection-result-main" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
            (__VLS_ctx.rawContentTitle(item.raw_content_id));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
            (item.reason || '-');
            if (item.suggested_angle) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
                (item.suggested_angle);
            }
            if (item.suggested_title) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
                (item.suggested_title);
            }
            if (item.data_limits.length) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
                (item.data_limits.join('、'));
            }
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "selection-result-meta" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "status-badge" },
                ...{ class: (__VLS_ctx.selectionResultClass(item)) },
            });
            (item.selected ? '建议选择' : '不建议');
            __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
            (item.score);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
            (__VLS_ctx.selectionRiskLabel(item.risk));
        }
        if (__VLS_ctx.shouldShowPagination(__VLS_ctx.contentSelectionResult.results, 'selectionResults')) {
            const __VLS_20 = {}.PaginationBar;
            /** @type {[typeof __VLS_components.PaginationBar, ]} */ ;
            // @ts-ignore
            const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
                page: (__VLS_ctx.pagination.selectionResults.page),
                pageSize: (__VLS_ctx.pagination.selectionResults.pageSize),
                total: (__VLS_ctx.contentSelectionResult.results.length),
            }));
            const __VLS_22 = __VLS_21({
                page: (__VLS_ctx.pagination.selectionResults.page),
                pageSize: (__VLS_ctx.pagination.selectionResults.pageSize),
                total: (__VLS_ctx.contentSelectionResult.results.length),
            }, ...__VLS_functionalComponentArgsRest(__VLS_21));
        }
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
        for (const [task] of __VLS_getVForSourceType((__VLS_ctx.pageItems(__VLS_ctx.dashboard.publishTasks, 'publishTasks')))) {
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
                            if (!!(__VLS_ctx.activePage === 'smart-filter'))
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
                            if (!!(__VLS_ctx.activePage === 'smart-filter'))
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
                            if (!!(__VLS_ctx.activePage === 'smart-filter'))
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
                            if (!!(__VLS_ctx.activePage === 'smart-filter'))
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
                            if (!!(__VLS_ctx.activePage === 'smart-filter'))
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
                        if (!!(__VLS_ctx.activePage === 'smart-filter'))
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
                        if (!!(__VLS_ctx.activePage === 'smart-filter'))
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
    if (__VLS_ctx.shouldShowPagination(__VLS_ctx.dashboard.publishTasks, 'publishTasks')) {
        const __VLS_24 = {}.PaginationBar;
        /** @type {[typeof __VLS_components.PaginationBar, ]} */ ;
        // @ts-ignore
        const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
            page: (__VLS_ctx.pagination.publishTasks.page),
            pageSize: (__VLS_ctx.pagination.publishTasks.pageSize),
            total: (__VLS_ctx.dashboard.publishTasks.length),
        }));
        const __VLS_26 = __VLS_25({
            page: (__VLS_ctx.pagination.publishTasks.page),
            pageSize: (__VLS_ctx.pagination.publishTasks.pageSize),
            total: (__VLS_ctx.dashboard.publishTasks.length),
        }, ...__VLS_functionalComponentArgsRest(__VLS_25));
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
        ...{ class: "panel-title compact-title" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.modelConfigs.length);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "model-toolbar" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.modelStatusText);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.openCreateModelModal) },
        ...{ class: "primary" },
        disabled: (__VLS_ctx.modelBusy),
    });
    if (__VLS_ctx.modelConfigs.length === 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "empty" },
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.table, __VLS_intrinsicElements.table)({
            ...{ class: "model-config-table" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.thead, __VLS_intrinsicElements.thead)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.tbody, __VLS_intrinsicElements.tbody)({});
        for (const [config] of __VLS_getVForSourceType((__VLS_ctx.pageItems(__VLS_ctx.modelConfigs, 'models')))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({
                key: (config.id),
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
            (config.name);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
            (__VLS_ctx.modelProviderLabel(config.provider));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
            (config.model || '-');
            __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
            (config.api_key_configured ? '已配置' : '未配置');
            __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
            if (config.is_default) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: "status-badge status-published" },
                });
            }
            else {
            }
            __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "row-actions model-row-actions" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.activePage === 'dashboard'))
                            return;
                        if (!!(__VLS_ctx.activePage === 'accounts'))
                            return;
                        if (!!(__VLS_ctx.activePage === 'collector'))
                            return;
                        if (!!(__VLS_ctx.activePage === 'smart-filter'))
                            return;
                        if (!!(__VLS_ctx.activePage === 'publisher'))
                            return;
                        if (!(__VLS_ctx.activePage === 'models'))
                            return;
                        if (!!(__VLS_ctx.modelConfigs.length === 0))
                            return;
                        __VLS_ctx.openEditModelModal(config);
                    } },
                ...{ class: "text-button" },
                disabled: (__VLS_ctx.modelBusy),
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.activePage === 'dashboard'))
                            return;
                        if (!!(__VLS_ctx.activePage === 'accounts'))
                            return;
                        if (!!(__VLS_ctx.activePage === 'collector'))
                            return;
                        if (!!(__VLS_ctx.activePage === 'smart-filter'))
                            return;
                        if (!!(__VLS_ctx.activePage === 'publisher'))
                            return;
                        if (!(__VLS_ctx.activePage === 'models'))
                            return;
                        if (!!(__VLS_ctx.modelConfigs.length === 0))
                            return;
                        __VLS_ctx.setDefaultModel(config.id);
                    } },
                ...{ class: "text-button" },
                disabled: (__VLS_ctx.modelBusy || config.is_default),
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.activePage === 'dashboard'))
                            return;
                        if (!!(__VLS_ctx.activePage === 'accounts'))
                            return;
                        if (!!(__VLS_ctx.activePage === 'collector'))
                            return;
                        if (!!(__VLS_ctx.activePage === 'smart-filter'))
                            return;
                        if (!!(__VLS_ctx.activePage === 'publisher'))
                            return;
                        if (!(__VLS_ctx.activePage === 'models'))
                            return;
                        if (!!(__VLS_ctx.modelConfigs.length === 0))
                            return;
                        __VLS_ctx.removeModel(config);
                    } },
                ...{ class: "text-button danger" },
                disabled: (__VLS_ctx.modelBusy),
            });
        }
    }
    if (__VLS_ctx.shouldShowPagination(__VLS_ctx.modelConfigs, 'models')) {
        const __VLS_28 = {}.PaginationBar;
        /** @type {[typeof __VLS_components.PaginationBar, ]} */ ;
        // @ts-ignore
        const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
            page: (__VLS_ctx.pagination.models.page),
            pageSize: (__VLS_ctx.pagination.models.pageSize),
            total: (__VLS_ctx.modelConfigs.length),
        }));
        const __VLS_30 = __VLS_29({
            page: (__VLS_ctx.pagination.models.page),
            pageSize: (__VLS_ctx.pagination.models.pageSize),
            total: (__VLS_ctx.modelConfigs.length),
        }, ...__VLS_functionalComponentArgsRest(__VLS_29));
    }
}
else if (__VLS_ctx.activePage === 'agents') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "panel" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "panel-title compact-title" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.agentConfigs.length);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "model-toolbar" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.agentStatusText);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.openCreateAgentModal) },
        ...{ class: "primary" },
        disabled: (__VLS_ctx.agentBusy),
    });
    if (__VLS_ctx.agentConfigs.length === 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "empty" },
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.table, __VLS_intrinsicElements.table)({
            ...{ class: "agent-config-table" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.thead, __VLS_intrinsicElements.thead)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.tbody, __VLS_intrinsicElements.tbody)({});
        for (const [config] of __VLS_getVForSourceType((__VLS_ctx.pageItems(__VLS_ctx.agentConfigs, 'agents')))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({
                key: (config.id),
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
            (config.name);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
            (__VLS_ctx.agentTypeLabel(config.agent_type));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
            (config.model_config_name);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
            (config.skill_names.length ? config.skill_names.join('、') : '-');
            __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
            (config.enabled ? '启用' : '禁用');
            __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
            if (config.is_default) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: "status-badge status-published" },
                });
            }
            else {
            }
            __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "row-actions model-row-actions" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.activePage === 'dashboard'))
                            return;
                        if (!!(__VLS_ctx.activePage === 'accounts'))
                            return;
                        if (!!(__VLS_ctx.activePage === 'collector'))
                            return;
                        if (!!(__VLS_ctx.activePage === 'smart-filter'))
                            return;
                        if (!!(__VLS_ctx.activePage === 'publisher'))
                            return;
                        if (!!(__VLS_ctx.activePage === 'models'))
                            return;
                        if (!(__VLS_ctx.activePage === 'agents'))
                            return;
                        if (!!(__VLS_ctx.agentConfigs.length === 0))
                            return;
                        __VLS_ctx.openEditAgentModal(config);
                    } },
                ...{ class: "text-button" },
                disabled: (__VLS_ctx.agentBusy),
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.activePage === 'dashboard'))
                            return;
                        if (!!(__VLS_ctx.activePage === 'accounts'))
                            return;
                        if (!!(__VLS_ctx.activePage === 'collector'))
                            return;
                        if (!!(__VLS_ctx.activePage === 'smart-filter'))
                            return;
                        if (!!(__VLS_ctx.activePage === 'publisher'))
                            return;
                        if (!!(__VLS_ctx.activePage === 'models'))
                            return;
                        if (!(__VLS_ctx.activePage === 'agents'))
                            return;
                        if (!!(__VLS_ctx.agentConfigs.length === 0))
                            return;
                        __VLS_ctx.setDefaultAgent(config.id);
                    } },
                ...{ class: "text-button" },
                disabled: (__VLS_ctx.agentBusy || config.is_default),
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.activePage === 'dashboard'))
                            return;
                        if (!!(__VLS_ctx.activePage === 'accounts'))
                            return;
                        if (!!(__VLS_ctx.activePage === 'collector'))
                            return;
                        if (!!(__VLS_ctx.activePage === 'smart-filter'))
                            return;
                        if (!!(__VLS_ctx.activePage === 'publisher'))
                            return;
                        if (!!(__VLS_ctx.activePage === 'models'))
                            return;
                        if (!(__VLS_ctx.activePage === 'agents'))
                            return;
                        if (!!(__VLS_ctx.agentConfigs.length === 0))
                            return;
                        __VLS_ctx.removeAgent(config);
                    } },
                ...{ class: "text-button danger" },
                disabled: (__VLS_ctx.agentBusy),
            });
        }
    }
    if (__VLS_ctx.shouldShowPagination(__VLS_ctx.agentConfigs, 'agents')) {
        const __VLS_32 = {}.PaginationBar;
        /** @type {[typeof __VLS_components.PaginationBar, ]} */ ;
        // @ts-ignore
        const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
            page: (__VLS_ctx.pagination.agents.page),
            pageSize: (__VLS_ctx.pagination.agents.pageSize),
            total: (__VLS_ctx.agentConfigs.length),
        }));
        const __VLS_34 = __VLS_33({
            page: (__VLS_ctx.pagination.agents.page),
            pageSize: (__VLS_ctx.pagination.agents.pageSize),
            total: (__VLS_ctx.agentConfigs.length),
        }, ...__VLS_functionalComponentArgsRest(__VLS_33));
    }
}
else if (__VLS_ctx.activePage === 'skills') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "panel" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "panel-title compact-title" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.localSkills.length);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "skills-local-toolbar" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        value: (__VLS_ctx.localSkillsRoot || '-'),
        readonly: true,
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.skillStatusText);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.reloadSkillsDirectory) },
        ...{ class: "primary" },
        disabled: (__VLS_ctx.skillBusy),
    });
    (__VLS_ctx.skillBusy ? '加载中' : '加载 Skills');
    if (__VLS_ctx.localSkills.length === 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "empty" },
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.table, __VLS_intrinsicElements.table)({
            ...{ class: "skill-config-table" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.thead, __VLS_intrinsicElements.thead)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.tbody, __VLS_intrinsicElements.tbody)({});
        for (const [config] of __VLS_getVForSourceType((__VLS_ctx.pageItems(__VLS_ctx.localSkills, 'skills')))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({
                key: (config.path),
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
            (config.name);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
            (config.description || '-');
            __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
            (config.path);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "row-actions model-row-actions" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.activePage === 'dashboard'))
                            return;
                        if (!!(__VLS_ctx.activePage === 'accounts'))
                            return;
                        if (!!(__VLS_ctx.activePage === 'collector'))
                            return;
                        if (!!(__VLS_ctx.activePage === 'smart-filter'))
                            return;
                        if (!!(__VLS_ctx.activePage === 'publisher'))
                            return;
                        if (!!(__VLS_ctx.activePage === 'models'))
                            return;
                        if (!!(__VLS_ctx.activePage === 'agents'))
                            return;
                        if (!(__VLS_ctx.activePage === 'skills'))
                            return;
                        if (!!(__VLS_ctx.localSkills.length === 0))
                            return;
                        __VLS_ctx.selectedLocalSkill = config;
                    } },
                ...{ class: "text-button" },
            });
        }
    }
    if (__VLS_ctx.shouldShowPagination(__VLS_ctx.localSkills, 'skills')) {
        const __VLS_36 = {}.PaginationBar;
        /** @type {[typeof __VLS_components.PaginationBar, ]} */ ;
        // @ts-ignore
        const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
            page: (__VLS_ctx.pagination.skills.page),
            pageSize: (__VLS_ctx.pagination.skills.pageSize),
            total: (__VLS_ctx.localSkills.length),
        }));
        const __VLS_38 = __VLS_37({
            page: (__VLS_ctx.pagination.skills.page),
            pageSize: (__VLS_ctx.pagination.skills.pageSize),
            total: (__VLS_ctx.localSkills.length),
        }, ...__VLS_functionalComponentArgsRest(__VLS_37));
    }
    if (__VLS_ctx.selectedLocalSkill) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
            ...{ class: "local-skill-detail" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "work-content-header" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)({});
        (__VLS_ctx.selectedLocalSkill.name);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.activePage === 'dashboard'))
                        return;
                    if (!!(__VLS_ctx.activePage === 'accounts'))
                        return;
                    if (!!(__VLS_ctx.activePage === 'collector'))
                        return;
                    if (!!(__VLS_ctx.activePage === 'smart-filter'))
                        return;
                    if (!!(__VLS_ctx.activePage === 'publisher'))
                        return;
                    if (!!(__VLS_ctx.activePage === 'models'))
                        return;
                    if (!!(__VLS_ctx.activePage === 'agents'))
                        return;
                    if (!(__VLS_ctx.activePage === 'skills'))
                        return;
                    if (!(__VLS_ctx.selectedLocalSkill))
                        return;
                    __VLS_ctx.selectedLocalSkill = null;
                } },
            ...{ class: "text-button" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        (__VLS_ctx.selectedLocalSkill.description || __VLS_ctx.selectedLocalSkill.path);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.pre, __VLS_intrinsicElements.pre)({});
        (__VLS_ctx.selectedLocalSkill.content || '暂无内容');
    }
}
else if (__VLS_ctx.activePage === 'account-profile') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "panel" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "panel-title compact-title" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.profileStatusText);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "review-toolbar" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
        ...{ onChange: (__VLS_ctx.loadProfileContext) },
        value: (__VLS_ctx.profileForm.account_id),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: (0),
    });
    for (const [account] of __VLS_getVForSourceType((__VLS_ctx.dashboard.accounts))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
            key: (account.id),
            value: (account.id),
        });
        (account.nickname || account.uid || account.platform);
        (__VLS_ctx.platformLabel(account.platform));
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
        value: (__VLS_ctx.profileForm.review_report_id),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: (0),
    });
    for (const [report] of __VLS_getVForSourceType((__VLS_ctx.profileReviewReports))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
            key: (report.id),
            value: (report.id),
        });
        (__VLS_ctx.formatDate(report.created_at));
        (report.works_count);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
        value: (__VLS_ctx.profileForm.agent_id),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: (0),
    });
    for (const [config] of __VLS_getVForSourceType((__VLS_ctx.profileAgents))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
            key: (config.id),
            value: (config.id),
        });
        (config.name);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.generateProfile) },
        ...{ class: "primary" },
        disabled: (__VLS_ctx.profileBusy),
    });
    (__VLS_ctx.profileBusy ? '鉴定中' : '生成肖像');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "review-history" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "panel-title compact-title" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.profileReports.length);
    if (__VLS_ctx.profileReports.length === 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "empty compact-empty" },
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "table" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "table-row review-history-row table-head" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        for (const [report] of __VLS_getVForSourceType((__VLS_ctx.pageItems(__VLS_ctx.profileReports, 'profileReports')))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                key: (report.id),
                ...{ class: "table-row review-history-row" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (__VLS_ctx.formatDate(report.created_at));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (report.agent_name || '-');
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (report.provider);
            (report.model);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (report.works_count);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            if (__VLS_ctx.selectedProfileReportId === report.id) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: "status-badge status-published" },
                });
            }
            else {
            }
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "row-actions" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.activePage === 'dashboard'))
                            return;
                        if (!!(__VLS_ctx.activePage === 'accounts'))
                            return;
                        if (!!(__VLS_ctx.activePage === 'collector'))
                            return;
                        if (!!(__VLS_ctx.activePage === 'smart-filter'))
                            return;
                        if (!!(__VLS_ctx.activePage === 'publisher'))
                            return;
                        if (!!(__VLS_ctx.activePage === 'models'))
                            return;
                        if (!!(__VLS_ctx.activePage === 'agents'))
                            return;
                        if (!!(__VLS_ctx.activePage === 'skills'))
                            return;
                        if (!(__VLS_ctx.activePage === 'account-profile'))
                            return;
                        if (!!(__VLS_ctx.profileReports.length === 0))
                            return;
                        __VLS_ctx.selectProfileReport(report);
                    } },
                ...{ class: "text-button" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.activePage === 'dashboard'))
                            return;
                        if (!!(__VLS_ctx.activePage === 'accounts'))
                            return;
                        if (!!(__VLS_ctx.activePage === 'collector'))
                            return;
                        if (!!(__VLS_ctx.activePage === 'smart-filter'))
                            return;
                        if (!!(__VLS_ctx.activePage === 'publisher'))
                            return;
                        if (!!(__VLS_ctx.activePage === 'models'))
                            return;
                        if (!!(__VLS_ctx.activePage === 'agents'))
                            return;
                        if (!!(__VLS_ctx.activePage === 'skills'))
                            return;
                        if (!(__VLS_ctx.activePage === 'account-profile'))
                            return;
                        if (!!(__VLS_ctx.profileReports.length === 0))
                            return;
                        __VLS_ctx.removeProfileReport(report);
                    } },
                ...{ class: "text-button danger" },
            });
        }
    }
    if (__VLS_ctx.shouldShowPagination(__VLS_ctx.profileReports, 'profileReports')) {
        const __VLS_40 = {}.PaginationBar;
        /** @type {[typeof __VLS_components.PaginationBar, ]} */ ;
        // @ts-ignore
        const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
            page: (__VLS_ctx.pagination.profileReports.page),
            pageSize: (__VLS_ctx.pagination.profileReports.pageSize),
            total: (__VLS_ctx.profileReports.length),
        }));
        const __VLS_42 = __VLS_41({
            page: (__VLS_ctx.pagination.profileReports.page),
            pageSize: (__VLS_ctx.pagination.profileReports.pageSize),
            total: (__VLS_ctx.profileReports.length),
        }, ...__VLS_functionalComponentArgsRest(__VLS_41));
    }
    if (__VLS_ctx.dashboard.accounts.length === 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "empty" },
        });
    }
    else if (!__VLS_ctx.profileResult) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "empty" },
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
            ...{ class: "review-result" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "diagnostics-grid" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (__VLS_ctx.profileResultCreatedAt);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (__VLS_ctx.profileResult.agent_name || '-');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (__VLS_ctx.profileResult.provider);
        (__VLS_ctx.profileResult.model);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (__VLS_ctx.profileResult.works_count);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "review-section" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        (__VLS_ctx.profileResult.profile.summary || '-');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "review-section" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        (__VLS_ctx.profileResult.profile.positioning || '-');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        (__VLS_ctx.profileResult.profile.audience_profile || '-');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "review-section" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({});
        for (const [item] of __VLS_getVForSourceType((__VLS_ctx.reviewList(__VLS_ctx.profileResult.profile.content_tracks)))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({
                key: (item),
            });
            (item);
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "review-section" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({});
        for (const [item] of __VLS_getVForSourceType((__VLS_ctx.reviewList(__VLS_ctx.profileResult.profile.title_style)))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({
                key: (item),
            });
            (item);
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "review-section" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
        for (const [source] of __VLS_getVForSourceType((__VLS_ctx.profileResult.profile.source_preferences))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                key: (`${source.source}-${source.category}-${source.reason}`),
                ...{ class: "review-item" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
            (source.source || '-');
            (source.category || '-');
            (__VLS_ctx.priorityLabel(source.priority));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
            (source.reason || '-');
            __VLS_asFunctionalElement(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
            (source.keywords.join('、') || '-');
        }
        if (__VLS_ctx.profileResult.profile.source_preferences.length === 0) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "diagnostics-empty" },
            });
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "review-section" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({});
        for (const [item] of __VLS_getVForSourceType((__VLS_ctx.reviewList(__VLS_ctx.profileResult.profile.topic_keywords)))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({
                key: (item),
            });
            (item);
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "review-section" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "review-columns" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({});
        for (const [item] of __VLS_getVForSourceType((__VLS_ctx.reviewList(__VLS_ctx.profileResult.profile.forbidden_topics)))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({
                key: (item),
            });
            (item);
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({});
        for (const [item] of __VLS_getVForSourceType((__VLS_ctx.reviewList(__VLS_ctx.profileResult.profile.risk_boundaries)))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({
                key: (item),
            });
            (item);
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "review-section" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({});
        for (const [item] of __VLS_getVForSourceType((__VLS_ctx.reviewList(__VLS_ctx.profileResult.profile.publishing_advice)))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({
                key: (item),
            });
            (item);
        }
        if (__VLS_ctx.profileResult.profile.data_limits.length) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "review-section" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
            __VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({});
            for (const [item] of __VLS_getVForSourceType((__VLS_ctx.profileResult.profile.data_limits))) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({
                    key: (item),
                });
                (item);
            }
        }
    }
}
else if (__VLS_ctx.activePage === 'analytics') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "panel" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "panel-title compact-title" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.reviewStatusText);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "review-toolbar" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
        ...{ onChange: (__VLS_ctx.loadReviewReports) },
        value: (__VLS_ctx.reviewForm.account_id),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: (0),
    });
    for (const [account] of __VLS_getVForSourceType((__VLS_ctx.dashboard.accounts))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
            key: (account.id),
            value: (account.id),
        });
        (account.nickname || account.uid || account.platform);
        (__VLS_ctx.platformLabel(account.platform));
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
        value: (__VLS_ctx.reviewForm.agent_id),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: (0),
    });
    for (const [config] of __VLS_getVForSourceType((__VLS_ctx.reviewAgents))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
            key: (config.id),
            value: (config.id),
        });
        (config.name);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.generateReview) },
        ...{ class: "primary" },
        disabled: (__VLS_ctx.reviewBusy),
    });
    (__VLS_ctx.reviewBusy ? '生成中' : '生成复盘');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "review-history" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "panel-title compact-title" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.reviewReports.length);
    if (__VLS_ctx.reviewReports.length === 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "empty compact-empty" },
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "table" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "table-row review-history-row table-head" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        for (const [report] of __VLS_getVForSourceType((__VLS_ctx.pageItems(__VLS_ctx.reviewReports, 'reviewReports')))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                key: (report.id),
                ...{ class: "table-row review-history-row" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (__VLS_ctx.formatDate(report.created_at));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (report.agent_name || '-');
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (report.provider);
            (report.model);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (report.works_count);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            if (__VLS_ctx.selectedReviewReportId === report.id) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: "status-badge status-published" },
                });
            }
            else {
            }
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "row-actions" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.activePage === 'dashboard'))
                            return;
                        if (!!(__VLS_ctx.activePage === 'accounts'))
                            return;
                        if (!!(__VLS_ctx.activePage === 'collector'))
                            return;
                        if (!!(__VLS_ctx.activePage === 'smart-filter'))
                            return;
                        if (!!(__VLS_ctx.activePage === 'publisher'))
                            return;
                        if (!!(__VLS_ctx.activePage === 'models'))
                            return;
                        if (!!(__VLS_ctx.activePage === 'agents'))
                            return;
                        if (!!(__VLS_ctx.activePage === 'skills'))
                            return;
                        if (!!(__VLS_ctx.activePage === 'account-profile'))
                            return;
                        if (!(__VLS_ctx.activePage === 'analytics'))
                            return;
                        if (!!(__VLS_ctx.reviewReports.length === 0))
                            return;
                        __VLS_ctx.selectReviewReport(report);
                    } },
                ...{ class: "text-button" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.activePage === 'dashboard'))
                            return;
                        if (!!(__VLS_ctx.activePage === 'accounts'))
                            return;
                        if (!!(__VLS_ctx.activePage === 'collector'))
                            return;
                        if (!!(__VLS_ctx.activePage === 'smart-filter'))
                            return;
                        if (!!(__VLS_ctx.activePage === 'publisher'))
                            return;
                        if (!!(__VLS_ctx.activePage === 'models'))
                            return;
                        if (!!(__VLS_ctx.activePage === 'agents'))
                            return;
                        if (!!(__VLS_ctx.activePage === 'skills'))
                            return;
                        if (!!(__VLS_ctx.activePage === 'account-profile'))
                            return;
                        if (!(__VLS_ctx.activePage === 'analytics'))
                            return;
                        if (!!(__VLS_ctx.reviewReports.length === 0))
                            return;
                        __VLS_ctx.removeReviewReport(report);
                    } },
                ...{ class: "text-button danger" },
            });
        }
    }
    if (__VLS_ctx.shouldShowPagination(__VLS_ctx.reviewReports, 'reviewReports')) {
        const __VLS_44 = {}.PaginationBar;
        /** @type {[typeof __VLS_components.PaginationBar, ]} */ ;
        // @ts-ignore
        const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({
            page: (__VLS_ctx.pagination.reviewReports.page),
            pageSize: (__VLS_ctx.pagination.reviewReports.pageSize),
            total: (__VLS_ctx.reviewReports.length),
        }));
        const __VLS_46 = __VLS_45({
            page: (__VLS_ctx.pagination.reviewReports.page),
            pageSize: (__VLS_ctx.pagination.reviewReports.pageSize),
            total: (__VLS_ctx.reviewReports.length),
        }, ...__VLS_functionalComponentArgsRest(__VLS_45));
    }
    if (__VLS_ctx.dashboard.accounts.length === 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "empty" },
        });
    }
    else if (!__VLS_ctx.reviewResult) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "empty" },
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
            ...{ class: "review-result" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "diagnostics-grid" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (__VLS_ctx.reviewResultCreatedAt);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (__VLS_ctx.reviewResult.agent_name || '-');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (__VLS_ctx.reviewResult.provider);
        (__VLS_ctx.reviewResult.model);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (__VLS_ctx.reviewResult.works_count);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "review-section" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        (__VLS_ctx.reviewResult.report.summary || '-');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "review-section" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        (__VLS_ctx.reviewResult.report.positioning.current_direction || '-');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "review-columns" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({});
        for (const [item] of __VLS_getVForSourceType((__VLS_ctx.reviewList(__VLS_ctx.reviewResult.report.positioning.strengths)))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({
                key: (item),
            });
            (item);
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({});
        for (const [item] of __VLS_getVForSourceType((__VLS_ctx.reviewList(__VLS_ctx.reviewResult.report.positioning.risks)))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({
                key: (item),
            });
            (item);
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "review-section" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
        for (const [work] of __VLS_getVForSourceType((__VLS_ctx.reviewResult.report.top_works))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                key: (work.title),
                ...{ class: "review-item" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
            (work.title || '-');
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
            (work.reason || '-');
            __VLS_asFunctionalElement(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
            (work.evidence || '-');
        }
        if (__VLS_ctx.reviewResult.report.top_works.length === 0) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "diagnostics-empty" },
            });
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "review-section" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "review-columns" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({});
        for (const [item] of __VLS_getVForSourceType((__VLS_ctx.reviewList(__VLS_ctx.reviewResult.report.title_analysis.patterns)))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({
                key: (item),
            });
            (item);
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({});
        for (const [item] of __VLS_getVForSourceType((__VLS_ctx.reviewList(__VLS_ctx.reviewResult.report.title_analysis.problems)))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({
                key: (item),
            });
            (item);
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({});
        for (const [item] of __VLS_getVForSourceType((__VLS_ctx.reviewList(__VLS_ctx.reviewResult.report.title_analysis.formulas)))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({
                key: (item),
            });
            (item);
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "review-section" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        (__VLS_ctx.reviewResult.report.content_structure.template || '-');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "review-columns" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({});
        for (const [item] of __VLS_getVForSourceType((__VLS_ctx.reviewList(__VLS_ctx.reviewResult.report.content_structure.strengths)))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({
                key: (item),
            });
            (item);
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({});
        for (const [item] of __VLS_getVForSourceType((__VLS_ctx.reviewList(__VLS_ctx.reviewResult.report.content_structure.problems)))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({
                key: (item),
            });
            (item);
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "review-section" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        (__VLS_ctx.reviewResult.report.audience.profile || '-');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "review-columns" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({});
        for (const [item] of __VLS_getVForSourceType((__VLS_ctx.reviewList(__VLS_ctx.reviewResult.report.audience.interests)))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({
                key: (item),
            });
            (item);
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({});
        for (const [item] of __VLS_getVForSourceType((__VLS_ctx.reviewList(__VLS_ctx.reviewResult.report.audience.unmet_needs)))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({
                key: (item),
            });
            (item);
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "review-section" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
        for (const [topic] of __VLS_getVForSourceType((__VLS_ctx.reviewResult.report.topic_suggestions))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                key: (topic.topic),
                ...{ class: "review-item" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
            (topic.topic || '-');
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
            (topic.title_direction || '-');
            __VLS_asFunctionalElement(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
            (topic.reason || '-');
            (topic.angle || '-');
            (topic.metric || '-');
        }
        if (__VLS_ctx.reviewResult.report.topic_suggestions.length === 0) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "diagnostics-empty" },
            });
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "review-section" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
        for (const [action] of __VLS_getVForSourceType((__VLS_ctx.reviewResult.report.actions))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                key: (action.action),
                ...{ class: "review-item" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
            (action.action || '-');
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
            (__VLS_ctx.priorityLabel(action.priority));
            (action.metric || '-');
            (action.cycle || '-');
        }
        if (__VLS_ctx.reviewResult.report.actions.length === 0) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "diagnostics-empty" },
            });
        }
        if (__VLS_ctx.reviewResult.report.data_limits.length) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "review-section" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
            __VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({});
            for (const [item] of __VLS_getVForSourceType((__VLS_ctx.reviewResult.report.data_limits))) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({
                    key: (item),
                });
                (item);
            }
        }
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
if (__VLS_ctx.modelModalOpen) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (__VLS_ctx.closeModelModal) },
        ...{ class: "modal-backdrop" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "model-config-modal" },
        role: "dialog",
        'aria-modal': "true",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "work-content-header" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)({});
    (__VLS_ctx.modelForm.id ? '编辑模型' : '新增模型');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.closeModelModal) },
        ...{ class: "text-button" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "model-config-block modal-form-block" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({});
    (__VLS_ctx.modelForm.name);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
        ...{ onChange: (__VLS_ctx.syncModelDefaults) },
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
        type: "password",
        placeholder: (__VLS_ctx.modelKeyPlaceholder),
    });
    (__VLS_ctx.modelForm.api_key);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        placeholder: "https://api.deepseek.com",
    });
    (__VLS_ctx.modelForm.base_url);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        placeholder: "deepseek-chat",
    });
    (__VLS_ctx.modelForm.model);
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
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "inline-check" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        type: "checkbox",
    });
    (__VLS_ctx.modelForm.is_default);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
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
    (__VLS_ctx.modelForm.id ? '保存模型' : '新增模型');
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
if (__VLS_ctx.agentModalOpen) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (__VLS_ctx.closeAgentModal) },
        ...{ class: "modal-backdrop" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "agent-config-modal" },
        role: "dialog",
        'aria-modal': "true",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "work-content-header" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)({});
    (__VLS_ctx.agentForm.id ? '编辑 Agent' : '新增 Agent');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.closeAgentModal) },
        ...{ class: "text-button" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "model-config-block modal-form-block" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({});
    (__VLS_ctx.agentForm.name);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
        ...{ onChange: (__VLS_ctx.syncAgentDefaults) },
        value: (__VLS_ctx.agentForm.agent_type),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "account_review",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "content_selection",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "account_profile",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
        value: (__VLS_ctx.agentForm.model_config_id),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: (0),
    });
    for (const [config] of __VLS_getVForSourceType((__VLS_ctx.modelConfigs))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
            key: (config.id),
            value: (config.id),
        });
        (config.name);
        (config.model);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "inline-check" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        type: "checkbox",
    });
    (__VLS_ctx.agentForm.enabled);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "inline-check" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        type: "checkbox",
    });
    (__VLS_ctx.agentForm.is_default);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "skill-picker" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "skill-picker-title" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
    (__VLS_ctx.agentForm.skill_paths.length);
    if (__VLS_ctx.localSkills.length === 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "empty compact-empty" },
        });
    }
    else {
        for (const [skill] of __VLS_getVForSourceType((__VLS_ctx.localSkills))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                key: (skill.relative_path),
                ...{ class: "skill-check" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                type: "checkbox",
                value: (skill.relative_path),
            });
            (__VLS_ctx.agentForm.skill_paths);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (skill.name);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
            (skill.description || skill.relative_path);
        }
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "agent-prompt-block" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "stacked-field" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
        value: (__VLS_ctx.agentForm.system_prompt),
        rows: "4",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "stacked-field" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
        value: (__VLS_ctx.agentForm.user_prompt_template),
        rows: "8",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "model-actions" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.saveAgent) },
        ...{ class: "primary" },
        disabled: (__VLS_ctx.agentBusy),
    });
    (__VLS_ctx.agentForm.id ? '保存 Agent' : '新增 Agent');
}
if (__VLS_ctx.skillModalOpen) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (__VLS_ctx.closeSkillModal) },
        ...{ class: "modal-backdrop" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "skill-config-modal" },
        role: "dialog",
        'aria-modal': "true",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "work-content-header" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)({});
    (__VLS_ctx.skillForm.id ? '编辑 Skill' : '新增 Skill');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.closeSkillModal) },
        ...{ class: "text-button" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "model-config-block modal-form-block" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({});
    (__VLS_ctx.skillForm.name);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
        value: (__VLS_ctx.skillForm.skill_type),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "prompt",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({});
    (__VLS_ctx.skillForm.description);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "inline-check" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        type: "checkbox",
    });
    (__VLS_ctx.skillForm.enabled);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "agent-prompt-block" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "stacked-field" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
        value: (__VLS_ctx.skillForm.content),
        rows: "10",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "model-actions" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.saveSkill) },
        ...{ class: "primary" },
        disabled: (__VLS_ctx.skillBusy),
    });
    (__VLS_ctx.skillForm.id ? '保存 Skill' : '新增 Skill');
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
/** @type {__VLS_StyleScopedClasses['checkbox-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['table-row']} */ ;
/** @type {__VLS_StyleScopedClasses['collector-table-row']} */ ;
/** @type {__VLS_StyleScopedClasses['checkbox-cell']} */ ;
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
/** @type {__VLS_StyleScopedClasses['collector-selection-toolbar']} */ ;
/** @type {__VLS_StyleScopedClasses['smart-filter-toolbar']} */ ;
/** @type {__VLS_StyleScopedClasses['selection-count']} */ ;
/** @type {__VLS_StyleScopedClasses['selection-agent-field']} */ ;
/** @type {__VLS_StyleScopedClasses['selection-agent-field']} */ ;
/** @type {__VLS_StyleScopedClasses['selection-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['primary']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-title']} */ ;
/** @type {__VLS_StyleScopedClasses['compact-title']} */ ;
/** @type {__VLS_StyleScopedClasses['empty']} */ ;
/** @type {__VLS_StyleScopedClasses['table']} */ ;
/** @type {__VLS_StyleScopedClasses['table-row']} */ ;
/** @type {__VLS_StyleScopedClasses['collector-table-head']} */ ;
/** @type {__VLS_StyleScopedClasses['checkbox-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['table-row']} */ ;
/** @type {__VLS_StyleScopedClasses['collector-table-row']} */ ;
/** @type {__VLS_StyleScopedClasses['checkbox-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['row-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['text-button']} */ ;
/** @type {__VLS_StyleScopedClasses['selection-result-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-title']} */ ;
/** @type {__VLS_StyleScopedClasses['compact-title']} */ ;
/** @type {__VLS_StyleScopedClasses['selection-result-list']} */ ;
/** @type {__VLS_StyleScopedClasses['selection-result-item']} */ ;
/** @type {__VLS_StyleScopedClasses['selection-result-main']} */ ;
/** @type {__VLS_StyleScopedClasses['selection-result-meta']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
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
/** @type {__VLS_StyleScopedClasses['compact-title']} */ ;
/** @type {__VLS_StyleScopedClasses['model-toolbar']} */ ;
/** @type {__VLS_StyleScopedClasses['primary']} */ ;
/** @type {__VLS_StyleScopedClasses['empty']} */ ;
/** @type {__VLS_StyleScopedClasses['model-config-table']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['status-published']} */ ;
/** @type {__VLS_StyleScopedClasses['row-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['model-row-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['text-button']} */ ;
/** @type {__VLS_StyleScopedClasses['text-button']} */ ;
/** @type {__VLS_StyleScopedClasses['text-button']} */ ;
/** @type {__VLS_StyleScopedClasses['danger']} */ ;
/** @type {__VLS_StyleScopedClasses['panel']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-title']} */ ;
/** @type {__VLS_StyleScopedClasses['compact-title']} */ ;
/** @type {__VLS_StyleScopedClasses['model-toolbar']} */ ;
/** @type {__VLS_StyleScopedClasses['primary']} */ ;
/** @type {__VLS_StyleScopedClasses['empty']} */ ;
/** @type {__VLS_StyleScopedClasses['agent-config-table']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['status-published']} */ ;
/** @type {__VLS_StyleScopedClasses['row-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['model-row-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['text-button']} */ ;
/** @type {__VLS_StyleScopedClasses['text-button']} */ ;
/** @type {__VLS_StyleScopedClasses['text-button']} */ ;
/** @type {__VLS_StyleScopedClasses['danger']} */ ;
/** @type {__VLS_StyleScopedClasses['panel']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-title']} */ ;
/** @type {__VLS_StyleScopedClasses['compact-title']} */ ;
/** @type {__VLS_StyleScopedClasses['skills-local-toolbar']} */ ;
/** @type {__VLS_StyleScopedClasses['primary']} */ ;
/** @type {__VLS_StyleScopedClasses['empty']} */ ;
/** @type {__VLS_StyleScopedClasses['skill-config-table']} */ ;
/** @type {__VLS_StyleScopedClasses['row-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['model-row-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['text-button']} */ ;
/** @type {__VLS_StyleScopedClasses['local-skill-detail']} */ ;
/** @type {__VLS_StyleScopedClasses['work-content-header']} */ ;
/** @type {__VLS_StyleScopedClasses['text-button']} */ ;
/** @type {__VLS_StyleScopedClasses['panel']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-title']} */ ;
/** @type {__VLS_StyleScopedClasses['compact-title']} */ ;
/** @type {__VLS_StyleScopedClasses['review-toolbar']} */ ;
/** @type {__VLS_StyleScopedClasses['primary']} */ ;
/** @type {__VLS_StyleScopedClasses['review-history']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-title']} */ ;
/** @type {__VLS_StyleScopedClasses['compact-title']} */ ;
/** @type {__VLS_StyleScopedClasses['empty']} */ ;
/** @type {__VLS_StyleScopedClasses['compact-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['table']} */ ;
/** @type {__VLS_StyleScopedClasses['table-row']} */ ;
/** @type {__VLS_StyleScopedClasses['review-history-row']} */ ;
/** @type {__VLS_StyleScopedClasses['table-head']} */ ;
/** @type {__VLS_StyleScopedClasses['table-row']} */ ;
/** @type {__VLS_StyleScopedClasses['review-history-row']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['status-published']} */ ;
/** @type {__VLS_StyleScopedClasses['row-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['text-button']} */ ;
/** @type {__VLS_StyleScopedClasses['text-button']} */ ;
/** @type {__VLS_StyleScopedClasses['danger']} */ ;
/** @type {__VLS_StyleScopedClasses['empty']} */ ;
/** @type {__VLS_StyleScopedClasses['empty']} */ ;
/** @type {__VLS_StyleScopedClasses['review-result']} */ ;
/** @type {__VLS_StyleScopedClasses['diagnostics-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['review-section']} */ ;
/** @type {__VLS_StyleScopedClasses['review-section']} */ ;
/** @type {__VLS_StyleScopedClasses['review-section']} */ ;
/** @type {__VLS_StyleScopedClasses['review-section']} */ ;
/** @type {__VLS_StyleScopedClasses['review-section']} */ ;
/** @type {__VLS_StyleScopedClasses['review-item']} */ ;
/** @type {__VLS_StyleScopedClasses['diagnostics-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['review-section']} */ ;
/** @type {__VLS_StyleScopedClasses['review-section']} */ ;
/** @type {__VLS_StyleScopedClasses['review-columns']} */ ;
/** @type {__VLS_StyleScopedClasses['review-section']} */ ;
/** @type {__VLS_StyleScopedClasses['review-section']} */ ;
/** @type {__VLS_StyleScopedClasses['panel']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-title']} */ ;
/** @type {__VLS_StyleScopedClasses['compact-title']} */ ;
/** @type {__VLS_StyleScopedClasses['review-toolbar']} */ ;
/** @type {__VLS_StyleScopedClasses['primary']} */ ;
/** @type {__VLS_StyleScopedClasses['review-history']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-title']} */ ;
/** @type {__VLS_StyleScopedClasses['compact-title']} */ ;
/** @type {__VLS_StyleScopedClasses['empty']} */ ;
/** @type {__VLS_StyleScopedClasses['compact-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['table']} */ ;
/** @type {__VLS_StyleScopedClasses['table-row']} */ ;
/** @type {__VLS_StyleScopedClasses['review-history-row']} */ ;
/** @type {__VLS_StyleScopedClasses['table-head']} */ ;
/** @type {__VLS_StyleScopedClasses['table-row']} */ ;
/** @type {__VLS_StyleScopedClasses['review-history-row']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['status-published']} */ ;
/** @type {__VLS_StyleScopedClasses['row-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['text-button']} */ ;
/** @type {__VLS_StyleScopedClasses['text-button']} */ ;
/** @type {__VLS_StyleScopedClasses['danger']} */ ;
/** @type {__VLS_StyleScopedClasses['empty']} */ ;
/** @type {__VLS_StyleScopedClasses['empty']} */ ;
/** @type {__VLS_StyleScopedClasses['review-result']} */ ;
/** @type {__VLS_StyleScopedClasses['diagnostics-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['review-section']} */ ;
/** @type {__VLS_StyleScopedClasses['review-section']} */ ;
/** @type {__VLS_StyleScopedClasses['review-columns']} */ ;
/** @type {__VLS_StyleScopedClasses['review-section']} */ ;
/** @type {__VLS_StyleScopedClasses['review-item']} */ ;
/** @type {__VLS_StyleScopedClasses['diagnostics-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['review-section']} */ ;
/** @type {__VLS_StyleScopedClasses['review-columns']} */ ;
/** @type {__VLS_StyleScopedClasses['review-section']} */ ;
/** @type {__VLS_StyleScopedClasses['review-columns']} */ ;
/** @type {__VLS_StyleScopedClasses['review-section']} */ ;
/** @type {__VLS_StyleScopedClasses['review-columns']} */ ;
/** @type {__VLS_StyleScopedClasses['review-section']} */ ;
/** @type {__VLS_StyleScopedClasses['review-item']} */ ;
/** @type {__VLS_StyleScopedClasses['diagnostics-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['review-section']} */ ;
/** @type {__VLS_StyleScopedClasses['review-item']} */ ;
/** @type {__VLS_StyleScopedClasses['diagnostics-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['review-section']} */ ;
/** @type {__VLS_StyleScopedClasses['panel']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-title']} */ ;
/** @type {__VLS_StyleScopedClasses['empty']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-backdrop']} */ ;
/** @type {__VLS_StyleScopedClasses['work-content-modal']} */ ;
/** @type {__VLS_StyleScopedClasses['work-content-header']} */ ;
/** @type {__VLS_StyleScopedClasses['text-button']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-backdrop']} */ ;
/** @type {__VLS_StyleScopedClasses['model-config-modal']} */ ;
/** @type {__VLS_StyleScopedClasses['work-content-header']} */ ;
/** @type {__VLS_StyleScopedClasses['text-button']} */ ;
/** @type {__VLS_StyleScopedClasses['model-config-block']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-form-block']} */ ;
/** @type {__VLS_StyleScopedClasses['inline-check']} */ ;
/** @type {__VLS_StyleScopedClasses['model-test-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['model-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['primary']} */ ;
/** @type {__VLS_StyleScopedClasses['secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-backdrop']} */ ;
/** @type {__VLS_StyleScopedClasses['agent-config-modal']} */ ;
/** @type {__VLS_StyleScopedClasses['work-content-header']} */ ;
/** @type {__VLS_StyleScopedClasses['text-button']} */ ;
/** @type {__VLS_StyleScopedClasses['model-config-block']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-form-block']} */ ;
/** @type {__VLS_StyleScopedClasses['inline-check']} */ ;
/** @type {__VLS_StyleScopedClasses['inline-check']} */ ;
/** @type {__VLS_StyleScopedClasses['skill-picker']} */ ;
/** @type {__VLS_StyleScopedClasses['skill-picker-title']} */ ;
/** @type {__VLS_StyleScopedClasses['empty']} */ ;
/** @type {__VLS_StyleScopedClasses['compact-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['skill-check']} */ ;
/** @type {__VLS_StyleScopedClasses['agent-prompt-block']} */ ;
/** @type {__VLS_StyleScopedClasses['stacked-field']} */ ;
/** @type {__VLS_StyleScopedClasses['stacked-field']} */ ;
/** @type {__VLS_StyleScopedClasses['model-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['primary']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-backdrop']} */ ;
/** @type {__VLS_StyleScopedClasses['skill-config-modal']} */ ;
/** @type {__VLS_StyleScopedClasses['work-content-header']} */ ;
/** @type {__VLS_StyleScopedClasses['text-button']} */ ;
/** @type {__VLS_StyleScopedClasses['model-config-block']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-form-block']} */ ;
/** @type {__VLS_StyleScopedClasses['inline-check']} */ ;
/** @type {__VLS_StyleScopedClasses['agent-prompt-block']} */ ;
/** @type {__VLS_StyleScopedClasses['stacked-field']} */ ;
/** @type {__VLS_StyleScopedClasses['model-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['primary']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            PaginationBar: PaginationBar,
            navItems: navItems,
            dashboard: dashboard,
            pagination: pagination,
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
            selectedRawContentIds: selectedRawContentIds,
            contentSelectionBusy: contentSelectionBusy,
            contentSelectionAgentId: contentSelectionAgentId,
            contentSelectionReviewReportId: contentSelectionReviewReportId,
            contentSelectionResult: contentSelectionResult,
            collectorSourceKey: collectorSourceKey,
            collectorCategoryKey: collectorCategoryKey,
            publisherBusy: publisherBusy,
            selectedDiagnostics: selectedDiagnostics,
            modelBusy: modelBusy,
            modelStatusText: modelStatusText,
            modelTestPrompt: modelTestPrompt,
            modelTestResult: modelTestResult,
            modelConfigs: modelConfigs,
            modelModalOpen: modelModalOpen,
            agentBusy: agentBusy,
            agentStatusText: agentStatusText,
            agentConfigs: agentConfigs,
            agentModalOpen: agentModalOpen,
            skillBusy: skillBusy,
            skillStatusText: skillStatusText,
            skillModalOpen: skillModalOpen,
            localSkillsRoot: localSkillsRoot,
            localSkills: localSkills,
            selectedLocalSkill: selectedLocalSkill,
            reviewBusy: reviewBusy,
            reviewStatusText: reviewStatusText,
            reviewResult: reviewResult,
            reviewReports: reviewReports,
            selectedReviewReportId: selectedReviewReportId,
            profileBusy: profileBusy,
            profileStatusText: profileStatusText,
            profileResult: profileResult,
            profileReports: profileReports,
            profileReviewReports: profileReviewReports,
            selectedProfileReportId: selectedProfileReportId,
            modelForm: modelForm,
            agentForm: agentForm,
            skillForm: skillForm,
            modelKeyPlaceholder: modelKeyPlaceholder,
            publishForm: publishForm,
            reviewForm: reviewForm,
            profileForm: profileForm,
            collectorCategories: collectorCategories,
            reviewAgents: reviewAgents,
            contentSelectionAgents: contentSelectionAgents,
            profileAgents: profileAgents,
            canRunContentSelection: canRunContentSelection,
            reviewResultCreatedAt: reviewResultCreatedAt,
            profileResultCreatedAt: profileResultCreatedAt,
            allAccountsSelected: allAccountsSelected,
            allRawContentsSelected: allRawContentsSelected,
            refresh: refresh,
            reloadSkillsDirectory: reloadSkillsDirectory,
            saveModels: saveModels,
            openCreateModelModal: openCreateModelModal,
            openEditModelModal: openEditModelModal,
            closeModelModal: closeModelModal,
            syncModelDefaults: syncModelDefaults,
            setDefaultModel: setDefaultModel,
            removeModel: removeModel,
            runModelTest: runModelTest,
            modelProviderLabel: modelProviderLabel,
            agentTypeLabel: agentTypeLabel,
            saveAgent: saveAgent,
            openCreateAgentModal: openCreateAgentModal,
            openEditAgentModal: openEditAgentModal,
            closeAgentModal: closeAgentModal,
            syncAgentDefaults: syncAgentDefaults,
            saveSkill: saveSkill,
            closeSkillModal: closeSkillModal,
            setDefaultAgent: setDefaultAgent,
            removeAgent: removeAgent,
            pageItems: pageItems,
            shouldShowPagination: shouldShowPagination,
            reviewList: reviewList,
            priorityLabel: priorityLabel,
            generateReview: generateReview,
            loadReviewReports: loadReviewReports,
            loadProfileContext: loadProfileContext,
            generateProfile: generateProfile,
            selectProfileReport: selectProfileReport,
            removeProfileReport: removeProfileReport,
            selectReviewReport: selectReviewReport,
            removeReviewReport: removeReviewReport,
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
            runContentSelection: runContentSelection,
            selectionReviewLabel: selectionReviewLabel,
            rawContentTitle: rawContentTitle,
            selectionResultClass: selectionResultClass,
            selectionRiskLabel: selectionRiskLabel,
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
            platformLabel: platformLabel,
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
