/// <reference types="../../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { inject } from 'vue';
import PaginationBar from '../../components/PaginationBar.vue';
import { appContextKey } from '../appContext';
import AgentAdd from './add.vue';
import AgentEdit from './edit.vue';
const app = inject(appContextKey);
if (!app) {
    throw new Error('AgentsIndex 缺少 appContext');
}
const agentBusy = app.agentBusy;
const agentConfigs = app.agentConfigs;
const agentModalOpen = app.agentModalOpen;
const agentForm = app.agentForm;
const pagination = app.pagination;
const pageItems = app.pageItems;
const shouldShowPagination = app.shouldShowPagination;
const openCreateAgentModal = app.openCreateAgentModal;
const openEditAgentModal = app.openEditAgentModal;
const setDefaultAgent = app.setDefaultAgent;
const removeAgent = app.removeAgent;
const agentTypeLabel = app.agentTypeLabel;
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "panel" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "panel-title compact-title" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "model-toolbar" },
});
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
                    if (!!(__VLS_ctx.agentConfigs.length === 0))
                        return;
                    __VLS_ctx.openEditAgentModal(config);
                } },
            ...{ class: "text-button" },
            disabled: (__VLS_ctx.agentBusy),
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.agentConfigs.length === 0))
                        return;
                    __VLS_ctx.setDefaultAgent(config.id);
                } },
            ...{ class: "text-button" },
            disabled: (__VLS_ctx.agentBusy || config.is_default),
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
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
    /** @type {[typeof PaginationBar, ]} */ ;
    // @ts-ignore
    const __VLS_0 = __VLS_asFunctionalComponent(PaginationBar, new PaginationBar({
        page: (__VLS_ctx.pagination.agents.page),
        pageSize: (__VLS_ctx.pagination.agents.pageSize),
        total: (__VLS_ctx.agentConfigs.length),
    }));
    const __VLS_1 = __VLS_0({
        page: (__VLS_ctx.pagination.agents.page),
        pageSize: (__VLS_ctx.pagination.agents.pageSize),
        total: (__VLS_ctx.agentConfigs.length),
    }, ...__VLS_functionalComponentArgsRest(__VLS_0));
}
if (__VLS_ctx.agentModalOpen && !__VLS_ctx.agentForm.id) {
    /** @type {[typeof AgentAdd, ]} */ ;
    // @ts-ignore
    const __VLS_3 = __VLS_asFunctionalComponent(AgentAdd, new AgentAdd({}));
    const __VLS_4 = __VLS_3({}, ...__VLS_functionalComponentArgsRest(__VLS_3));
}
if (__VLS_ctx.agentModalOpen && __VLS_ctx.agentForm.id) {
    /** @type {[typeof AgentEdit, ]} */ ;
    // @ts-ignore
    const __VLS_6 = __VLS_asFunctionalComponent(AgentEdit, new AgentEdit({}));
    const __VLS_7 = __VLS_6({}, ...__VLS_functionalComponentArgsRest(__VLS_6));
}
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
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            PaginationBar: PaginationBar,
            AgentAdd: AgentAdd,
            AgentEdit: AgentEdit,
            agentBusy: agentBusy,
            agentConfigs: agentConfigs,
            agentModalOpen: agentModalOpen,
            agentForm: agentForm,
            pagination: pagination,
            pageItems: pageItems,
            shouldShowPagination: shouldShowPagination,
            openCreateAgentModal: openCreateAgentModal,
            openEditAgentModal: openEditAgentModal,
            setDefaultAgent: setDefaultAgent,
            removeAgent: removeAgent,
            agentTypeLabel: agentTypeLabel,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
