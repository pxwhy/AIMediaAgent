/// <reference types="../../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { inject } from 'vue';
import PaginationBar from '../../components/PaginationBar.vue';
import { appContextKey } from '../appContext';
const app = inject(appContextKey);
if (!app) {
    throw new Error('CollectorPage 缺少 appContext');
}
const dashboard = app.dashboard;
const statusText = app.statusText;
const collectorBusy = app.collectorBusy;
const importingUrl = app.importingUrl;
const collectorSources = app.collectorSources;
const collectorItems = app.collectorItems;
const selectedRawContent = app.selectedRawContent;
const selectedRawContentIds = app.selectedRawContentIds;
const collectorSourceKey = app.collectorSourceKey;
const collectorCategoryKey = app.collectorCategoryKey;
const collectorCategories = app.collectorCategories;
const pagination = app.pagination;
const allRawContentsSelected = app.allRawContentsSelected;
const pageItems = app.pageItems;
const shouldShowPagination = app.shouldShowPagination;
const syncCollectorCategory = app.syncCollectorCategory;
const previewCollector = app.previewCollector;
const importCollector = app.importCollector;
const removeSelectedRawContents = app.removeSelectedRawContents;
const rawContentSourceLabel = app.rawContentSourceLabel;
const rawContentStatusLabel = app.rawContentStatusLabel;
const formatDate = app.formatDate;
const removeRawContent = app.removeRawContent;
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
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
    /** @type {[typeof PaginationBar, ]} */ ;
    // @ts-ignore
    const __VLS_0 = __VLS_asFunctionalComponent(PaginationBar, new PaginationBar({
        page: (__VLS_ctx.pagination.collectorItems.page),
        pageSize: (__VLS_ctx.pagination.collectorItems.pageSize),
        total: (__VLS_ctx.collectorItems.length),
    }));
    const __VLS_1 = __VLS_0({
        page: (__VLS_ctx.pagination.collectorItems.page),
        pageSize: (__VLS_ctx.pagination.collectorItems.pageSize),
        total: (__VLS_ctx.collectorItems.length),
    }, ...__VLS_functionalComponentArgsRest(__VLS_0));
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "panel-title compact-title" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
if (__VLS_ctx.dashboard.rawContents.length === 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "empty" },
    });
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "collector-selection-toolbar raw-content-toolbar" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "selection-count" },
    });
    (__VLS_ctx.selectedRawContentIds.length);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "selection-actions" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.removeSelectedRawContents) },
        ...{ class: "text-button danger" },
        disabled: (__VLS_ctx.selectedRawContentIds.length === 0),
    });
    (__VLS_ctx.selectedRawContentIds.length ? `（${__VLS_ctx.selectedRawContentIds.length}）` : '');
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
        (__VLS_ctx.rawContentSourceLabel(content.source));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (content.title);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (__VLS_ctx.rawContentStatusLabel(content.status));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (__VLS_ctx.formatDate(content.created_at));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "row-actions" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.dashboard.rawContents.length === 0))
                        return;
                    __VLS_ctx.selectedRawContent = content;
                } },
            ...{ class: "text-button" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.dashboard.rawContents.length === 0))
                        return;
                    __VLS_ctx.removeRawContent(content);
                } },
            ...{ class: "text-button danger" },
        });
    }
    if (__VLS_ctx.shouldShowPagination(__VLS_ctx.dashboard.rawContents, 'rawContents')) {
        /** @type {[typeof PaginationBar, ]} */ ;
        // @ts-ignore
        const __VLS_3 = __VLS_asFunctionalComponent(PaginationBar, new PaginationBar({
            page: (__VLS_ctx.pagination.rawContents.page),
            pageSize: (__VLS_ctx.pagination.rawContents.pageSize),
            total: (__VLS_ctx.dashboard.rawContents.length),
        }));
        const __VLS_4 = __VLS_3({
            page: (__VLS_ctx.pagination.rawContents.page),
            pageSize: (__VLS_ctx.pagination.rawContents.pageSize),
            total: (__VLS_ctx.dashboard.rawContents.length),
        }, ...__VLS_functionalComponentArgsRest(__VLS_3));
    }
}
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
/** @type {__VLS_StyleScopedClasses['collector-selection-toolbar']} */ ;
/** @type {__VLS_StyleScopedClasses['raw-content-toolbar']} */ ;
/** @type {__VLS_StyleScopedClasses['selection-count']} */ ;
/** @type {__VLS_StyleScopedClasses['selection-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['text-button']} */ ;
/** @type {__VLS_StyleScopedClasses['danger']} */ ;
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
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            PaginationBar: PaginationBar,
            dashboard: dashboard,
            statusText: statusText,
            collectorBusy: collectorBusy,
            importingUrl: importingUrl,
            collectorSources: collectorSources,
            collectorItems: collectorItems,
            selectedRawContent: selectedRawContent,
            selectedRawContentIds: selectedRawContentIds,
            collectorSourceKey: collectorSourceKey,
            collectorCategoryKey: collectorCategoryKey,
            collectorCategories: collectorCategories,
            pagination: pagination,
            allRawContentsSelected: allRawContentsSelected,
            pageItems: pageItems,
            shouldShowPagination: shouldShowPagination,
            syncCollectorCategory: syncCollectorCategory,
            previewCollector: previewCollector,
            importCollector: importCollector,
            removeSelectedRawContents: removeSelectedRawContents,
            rawContentSourceLabel: rawContentSourceLabel,
            rawContentStatusLabel: rawContentStatusLabel,
            formatDate: formatDate,
            removeRawContent: removeRawContent,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
