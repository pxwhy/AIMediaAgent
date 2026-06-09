/*
实现逻辑：
1. 管理 Agent 配置列表、新增编辑弹框、默认设置和删除操作。
2. Agent 表单只维护自身配置，删除后的跨模块清理由调用方通过回调处理。
3. 不在 Agent 模块直接控制浏览器或发布任务，只负责推理配置、模型绑定和 Skills 绑定。
*/
import { reactive, ref } from 'vue';
import { createAgentConfig, deleteAgentConfig, loadAgentConfigs, setDefaultAgentConfig, updateAgentConfig } from '../../api/client';
export function createAgentsContext(deps) {
    const agentBusy = ref(false);
    const agentStatusText = ref('等待加载');
    const agentConfigs = ref([]);
    const agentModalOpen = ref(false);
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
            agentStatusText.value = deps.readableError(error, 'Agent 保存失败');
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
            agentStatusText.value = deps.readableError(error, '设置默认 Agent 失败');
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
            deps.onAgentDeleted(config.id);
            await loadAgents();
            agentStatusText.value = 'Agent 已删除';
        }
        catch (error) {
            console.error(error);
            agentStatusText.value = deps.readableError(error, 'Agent 删除失败');
        }
        finally {
            agentBusy.value = false;
        }
    }
    return {
        agentBusy,
        agentStatusText,
        agentConfigs,
        agentModalOpen,
        agentForm,
        loadAgents,
        saveAgent,
        openCreateAgentModal,
        openEditAgentModal,
        closeAgentModal,
        syncAgentDefaults,
        setDefaultAgent,
        removeAgent,
        agentTypeLabel
    };
}
