/// <reference types="../../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { inject } from 'vue';
import PaginationBar from '../../components/PaginationBar.vue';
import { appContextKey } from '../appContext';
import ModelAdd from './add.vue';
import ModelEdit from './edit.vue';
const app = inject(appContextKey);
if (!app) {
    throw new Error('ModelsIndex 缺少 appContext');
}
const modelBusy = app.modelBusy;
const modelConfigs = app.modelConfigs;
const modelModalOpen = app.modelModalOpen;
const modelForm = app.modelForm;
const pagination = app.pagination;
const pageItems = app.pageItems;
const shouldShowPagination = app.shouldShowPagination;
const openCreateModelModal = app.openCreateModelModal;
const openEditModelModal = app.openEditModelModal;
const setDefaultModel = app.setDefaultModel;
const removeModel = app.removeModel;
const modelProviderLabel = app.modelProviderLabel;
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
                    if (!!(__VLS_ctx.modelConfigs.length === 0))
                        return;
                    __VLS_ctx.openEditModelModal(config);
                } },
            ...{ class: "text-button" },
            disabled: (__VLS_ctx.modelBusy),
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.modelConfigs.length === 0))
                        return;
                    __VLS_ctx.setDefaultModel(config.id);
                } },
            ...{ class: "text-button" },
            disabled: (__VLS_ctx.modelBusy || config.is_default),
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
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
    /** @type {[typeof PaginationBar, ]} */ ;
    // @ts-ignore
    const __VLS_0 = __VLS_asFunctionalComponent(PaginationBar, new PaginationBar({
        page: (__VLS_ctx.pagination.models.page),
        pageSize: (__VLS_ctx.pagination.models.pageSize),
        total: (__VLS_ctx.modelConfigs.length),
    }));
    const __VLS_1 = __VLS_0({
        page: (__VLS_ctx.pagination.models.page),
        pageSize: (__VLS_ctx.pagination.models.pageSize),
        total: (__VLS_ctx.modelConfigs.length),
    }, ...__VLS_functionalComponentArgsRest(__VLS_0));
}
if (__VLS_ctx.modelModalOpen && !__VLS_ctx.modelForm.id) {
    /** @type {[typeof ModelAdd, ]} */ ;
    // @ts-ignore
    const __VLS_3 = __VLS_asFunctionalComponent(ModelAdd, new ModelAdd({}));
    const __VLS_4 = __VLS_3({}, ...__VLS_functionalComponentArgsRest(__VLS_3));
}
if (__VLS_ctx.modelModalOpen && __VLS_ctx.modelForm.id) {
    /** @type {[typeof ModelEdit, ]} */ ;
    // @ts-ignore
    const __VLS_6 = __VLS_asFunctionalComponent(ModelEdit, new ModelEdit({}));
    const __VLS_7 = __VLS_6({}, ...__VLS_functionalComponentArgsRest(__VLS_6));
}
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
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            PaginationBar: PaginationBar,
            ModelAdd: ModelAdd,
            ModelEdit: ModelEdit,
            modelBusy: modelBusy,
            modelConfigs: modelConfigs,
            modelModalOpen: modelModalOpen,
            modelForm: modelForm,
            pagination: pagination,
            pageItems: pageItems,
            shouldShowPagination: shouldShowPagination,
            openCreateModelModal: openCreateModelModal,
            openEditModelModal: openEditModelModal,
            setDefaultModel: setDefaultModel,
            removeModel: removeModel,
            modelProviderLabel: modelProviderLabel,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
