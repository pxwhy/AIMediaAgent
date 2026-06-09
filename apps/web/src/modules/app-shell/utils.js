/*
实现逻辑：
1. 提供工作台通用展示函数，包括分页、日期、指标、平台和优先级文案。
2. 纯函数集中维护，避免 App.vue 继续承载跨模块工具逻辑。
3. 分页 helper 绑定当前分页状态后再提供给各列表模块使用。
*/
export function createPaginationHelpers(pagination) {
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
    return {
        pageItems,
        shouldShowPagination
    };
}
export function readableError(error, fallback = '操作失败，请稍后重试') {
    const response = error.response;
    return response?.data?.detail || fallback;
}
export function priorityLabel(priority) {
    const labels = {
        high: '高优先级',
        medium: '中优先级',
        low: '低优先级'
    };
    return labels[priority] ?? (priority || '-');
}
export function formatDate(value) {
    return value ? new Date(value).toLocaleString('zh-CN', { hour12: false }) : '-';
}
export function metricText(metrics, key) {
    const value = metrics[key];
    if (value === undefined || value === null || value === '') {
        return '-';
    }
    return String(value);
}
export function platformLabel(platform) {
    const labels = {
        toutiao: '头条号',
        xiaohongshu: '小红书'
    };
    return labels[platform] ?? platform;
}
