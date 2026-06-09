/// <reference types="../../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { inject } from 'vue';
import PaginationBar from '../../components/PaginationBar.vue';
import { appContextKey } from '../appContext';
const app = inject(appContextKey);
if (!app) {
    throw new Error('PublisherPage 缺少 appContext');
}
const dashboard = app.dashboard;
const publisherBusy = app.publisherBusy;
const pagination = app.pagination;
const pageItems = app.pageItems;
const shouldShowPagination = app.shouldShowPagination;
const openCreatePublishModal = app.openCreatePublishModal;
const platformLabel = app.platformLabel;
const draftTitle = app.draftTitle;
const taskStatusClass = app.taskStatusClass;
const taskStatusLabel = app.taskStatusLabel;
const formatDate = app.formatDate;
const canShowOpenEditor = app.canShowOpenEditor;
const openEditor = app.openEditor;
const canShowAutoPublish = app.canShowAutoPublish;
const autoPublish = app.autoPublish;
const canShowPublishingActions = app.canShowPublishingActions;
const markPublished = app.markPublished;
const markFailed = app.markFailed;
const cancelTask = app.cancelTask;
const showTaskDiagnostics = app.showTaskDiagnostics;
const removeTask = app.removeTask;
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "panel" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "model-toolbar" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.openCreatePublishModal) },
    ...{ class: "primary" },
    disabled: (__VLS_ctx.publisherBusy),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "panel-title compact-title" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
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
        (__VLS_ctx.platformLabel(task.platform));
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
                    if (!!(__VLS_ctx.dashboard.publishTasks.length === 0))
                        return;
                    __VLS_ctx.showTaskDiagnostics(task.id);
                } },
            ...{ class: "text-button" },
            disabled: (__VLS_ctx.publisherBusy),
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.dashboard.publishTasks.length === 0))
                        return;
                    __VLS_ctx.removeTask(task.id);
                } },
            ...{ class: "text-button danger" },
        });
    }
}
if (__VLS_ctx.shouldShowPagination(__VLS_ctx.dashboard.publishTasks, 'publishTasks')) {
    /** @type {[typeof PaginationBar, ]} */ ;
    // @ts-ignore
    const __VLS_0 = __VLS_asFunctionalComponent(PaginationBar, new PaginationBar({
        page: (__VLS_ctx.pagination.publishTasks.page),
        pageSize: (__VLS_ctx.pagination.publishTasks.pageSize),
        total: (__VLS_ctx.dashboard.publishTasks.length),
    }));
    const __VLS_1 = __VLS_0({
        page: (__VLS_ctx.pagination.publishTasks.page),
        pageSize: (__VLS_ctx.pagination.publishTasks.pageSize),
        total: (__VLS_ctx.dashboard.publishTasks.length),
    }, ...__VLS_functionalComponentArgsRest(__VLS_0));
}
/** @type {__VLS_StyleScopedClasses['panel']} */ ;
/** @type {__VLS_StyleScopedClasses['model-toolbar']} */ ;
/** @type {__VLS_StyleScopedClasses['primary']} */ ;
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
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            PaginationBar: PaginationBar,
            dashboard: dashboard,
            publisherBusy: publisherBusy,
            pagination: pagination,
            pageItems: pageItems,
            shouldShowPagination: shouldShowPagination,
            openCreatePublishModal: openCreatePublishModal,
            platformLabel: platformLabel,
            draftTitle: draftTitle,
            taskStatusClass: taskStatusClass,
            taskStatusLabel: taskStatusLabel,
            formatDate: formatDate,
            canShowOpenEditor: canShowOpenEditor,
            openEditor: openEditor,
            canShowAutoPublish: canShowAutoPublish,
            autoPublish: autoPublish,
            canShowPublishingActions: canShowPublishingActions,
            markPublished: markPublished,
            markFailed: markFailed,
            cancelTask: cancelTask,
            showTaskDiagnostics: showTaskDiagnostics,
            removeTask: removeTask,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
