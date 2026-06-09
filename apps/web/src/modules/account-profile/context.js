/*
实现逻辑：
1. 管理账号复盘和账号肖像模块的表单、历史记录、结果弹框状态。
2. 复盘与肖像只依赖 Agent 配置和通用错误/时间格式化能力，避免业务函数继续堆在 App.vue。
3. 历史记录的查看、删除和生成结果都在本模块内闭环，对外提供页面可直接注入的状态与方法。
*/
import { computed, reactive, ref } from 'vue';
import { deleteAccountProfileReport, deleteAccountReviewReport, generateAccountProfile, generateAccountReview, loadAccountProfileReports, loadAccountReviewReports } from '../../api/client';
export function createAccountProfileContext(deps) {
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
    const reviewForm = reactive({
        account_id: 0,
        agent_id: 0
    });
    const profileForm = reactive({
        account_id: 0,
        review_report_id: 0,
        agent_id: 0
    });
    const reviewAgents = computed(() => deps.agentConfigs.value.filter((agent) => agent.agent_type === 'account_review' && agent.enabled));
    const profileAgents = computed(() => deps.agentConfigs.value.filter((agent) => agent.agent_type === 'account_profile' && agent.enabled));
    const reviewResultCreatedAt = computed(() => {
        const value = reviewResult.value?.created_at;
        return value ? deps.formatDate(value) : '刚刚生成';
    });
    const profileResultCreatedAt = computed(() => {
        const value = profileResult.value?.created_at;
        return value ? deps.formatDate(value) : '刚刚生成';
    });
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
            reviewStatusText.value = deps.readableError(error);
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
            reviewStatusText.value = deps.readableError(error, '复盘历史加载失败');
        }
    }
    async function loadProfileContext() {
        if (!profileForm.account_id) {
            clearProfileContext();
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
            profileStatusText.value = deps.readableError(error, '账号肖像上下文加载失败');
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
            profileStatusText.value = deps.readableError(error, '账号肖像生成失败');
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
    function closeProfileResult() {
        profileResult.value = null;
        selectedProfileReportId.value = null;
    }
    async function removeProfileReport(report) {
        if (!window.confirm(`确认删除 ${deps.formatDate(report.created_at)} 的账号肖像记录吗？`)) {
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
            profileStatusText.value = deps.readableError(error, '账号肖像记录删除失败');
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
    function closeReviewResult() {
        reviewResult.value = null;
        selectedReviewReportId.value = null;
    }
    async function removeReviewReport(report) {
        if (!window.confirm(`确认删除 ${deps.formatDate(report.created_at)} 的复盘记录吗？`)) {
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
            reviewStatusText.value = deps.readableError(error, '复盘记录删除失败');
        }
        finally {
            reviewBusy.value = false;
        }
    }
    function clearProfileContext() {
        profileReports.value = [];
        profileReviewReports.value = [];
        profileResult.value = null;
        selectedProfileReportId.value = null;
    }
    return {
        reviewBusy,
        reviewStatusText,
        reviewResult,
        reviewReports,
        selectedReviewReportId,
        profileBusy,
        profileStatusText,
        profileResult,
        profileReports,
        profileReviewReports,
        selectedProfileReportId,
        reviewForm,
        profileForm,
        reviewAgents,
        profileAgents,
        reviewResultCreatedAt,
        profileResultCreatedAt,
        generateReview,
        loadReviewReports,
        loadProfileContext,
        generateProfile,
        selectProfileReport,
        closeProfileResult,
        removeProfileReport,
        selectReviewReport,
        closeReviewResult,
        removeReviewReport,
        clearProfileContext
    };
}
