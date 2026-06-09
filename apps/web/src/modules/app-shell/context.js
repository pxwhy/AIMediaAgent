/*
实现逻辑：
1. 提供工作台壳层的导航配置、仪表盘初始数据和分页初始状态。
2. App.vue 只负责装配模块和刷新数据，不再维护大段静态配置。
3. 分页 key 在这里统一声明，保证各业务模块复用同一套分页状态。
*/
export const navItems = [
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
export function createDashboardState() {
    return {
        accounts: [],
        rawContents: [],
        drafts: [],
        publishTasks: []
    };
}
export function createPaginationState() {
    return {
        accounts: { page: 1, pageSize: 10 },
        accountWorks: { page: 1, pageSize: 10 },
        collectorItems: { page: 1, pageSize: 10 },
        rawContents: { page: 1, pageSize: 10 },
        selectionResults: { page: 1, pageSize: 10 },
        selectionHistory: { page: 1, pageSize: 10 },
        publishTasks: { page: 1, pageSize: 10 },
        models: { page: 1, pageSize: 10 },
        agents: { page: 1, pageSize: 10 },
        skills: { page: 1, pageSize: 10 },
        localSkills: { page: 1, pageSize: 10 },
        reviewReports: { page: 1, pageSize: 10 },
        profileReports: { page: 1, pageSize: 10 }
    };
}
