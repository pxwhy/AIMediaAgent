/// <reference types="../../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { inject } from 'vue';
import PaginationBar from '../../components/PaginationBar.vue';
import { appContextKey } from '../appContext';
const app = inject(appContextKey);
if (!app) {
    throw new Error('SmartFilterPage 缺少 appContext');
}
const dashboard = app.dashboard;
const statusText = app.statusText;
const selectedRawContent = app.selectedRawContent;
const selectedRawContentIds = app.selectedRawContentIds;
const smartFilterAccountId = app.smartFilterAccountId;
const contentSelectionBusy = app.contentSelectionBusy;
const contentSelectionAgentId = app.contentSelectionAgentId;
const contentSelectionProfileReportId = app.contentSelectionProfileReportId;
const contentSelectionReviewReportId = app.contentSelectionReviewReportId;
const contentSelectionResult = app.contentSelectionResult;
const contentSelectionHistory = app.contentSelectionHistory;
const contentSelectionProfileReports = app.contentSelectionProfileReports;
const contentSelectionReviewReports = app.contentSelectionReviewReports;
const contentSelectionResultFilter = app.contentSelectionResultFilter;
const contentSelectionStats = app.contentSelectionStats;
const contentSelectionAgents = app.contentSelectionAgents;
const canRunContentSelection = app.canRunContentSelection;
const filteredContentSelectionResults = app.filteredContentSelectionResults;
const contentSelectionRecommendedCount = app.contentSelectionRecommendedCount;
const allRawContentsSelected = app.allRawContentsSelected;
const pagination = app.pagination;
const pageItems = app.pageItems;
const shouldShowPagination = app.shouldShowPagination;
const loadSmartFilterContext = app.loadSmartFilterContext;
const selectionReviewLabel = app.selectionReviewLabel;
const runContentSelection = app.runContentSelection;
const selectContentSelectionRun = app.selectContentSelectionRun;
const removeContentSelectionRun = app.removeContentSelectionRun;
const removeSelectedRawContents = app.removeSelectedRawContents;
const rawContentSourceLabel = app.rawContentSourceLabel;
const rawContentStatusLabel = app.rawContentStatusLabel;
const formatDate = app.formatDate;
const rawContentTitle = app.rawContentTitle;
const selectionResultClass = app.selectionResultClass;
const selectionRiskLabel = app.selectionRiskLabel;
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
    ...{ class: "collector-selection-toolbar smart-filter-toolbar" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "selection-agent-field" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    ...{ onChange: (__VLS_ctx.loadSmartFilterContext) },
    value: (__VLS_ctx.smartFilterAccountId),
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
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "selection-agent-field" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    value: (__VLS_ctx.contentSelectionProfileReportId),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: (0),
});
for (const [profile] of __VLS_getVForSourceType((__VLS_ctx.contentSelectionProfileReports))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        key: (profile.id),
        value: (profile.id),
    });
    (__VLS_ctx.formatDate(profile.created_at));
}
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
for (const [report] of __VLS_getVForSourceType((__VLS_ctx.contentSelectionReviewReports))) {
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
(__VLS_ctx.contentSelectionBusy ? '筛选中' : '智能筛选');
if (__VLS_ctx.contentSelectionStats.started) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "selection-stats" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.contentSelectionStats.basis || '-');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.contentSelectionStats.targets);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.contentSelectionStats.candidates);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.contentSelectionRecommendedCount);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "review-history" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "panel-title compact-title" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
if (__VLS_ctx.contentSelectionHistory.length === 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "empty compact-empty" },
    });
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "table" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "table-row selection-history-row table-head" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    for (const [run] of __VLS_getVForSourceType((__VLS_ctx.pageItems(__VLS_ctx.contentSelectionHistory, 'selectionHistory')))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (run.id || run.created_at),
            ...{ class: "table-row selection-history-row" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (__VLS_ctx.formatDate(run.created_at || ''));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (run.basis || '-');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (run.agent_name || '-');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (run.provider);
        (run.model);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (run.candidates_count);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (run.recommended_count);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "row-actions" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.contentSelectionHistory.length === 0))
                        return;
                    __VLS_ctx.selectContentSelectionRun(run);
                } },
            ...{ class: "text-button" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.contentSelectionHistory.length === 0))
                        return;
                    __VLS_ctx.removeContentSelectionRun(run);
                } },
            ...{ class: "text-button danger" },
            disabled: (__VLS_ctx.contentSelectionBusy),
        });
    }
}
if (__VLS_ctx.shouldShowPagination(__VLS_ctx.contentSelectionHistory, 'selectionHistory')) {
    /** @type {[typeof PaginationBar, ]} */ ;
    // @ts-ignore
    const __VLS_0 = __VLS_asFunctionalComponent(PaginationBar, new PaginationBar({
        page: (__VLS_ctx.pagination.selectionHistory.page),
        pageSize: (__VLS_ctx.pagination.selectionHistory.pageSize),
        total: (__VLS_ctx.contentSelectionHistory.length),
    }));
    const __VLS_1 = __VLS_0({
        page: (__VLS_ctx.pagination.selectionHistory.page),
        pageSize: (__VLS_ctx.pagination.selectionHistory.pageSize),
        total: (__VLS_ctx.contentSelectionHistory.length),
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
if (__VLS_ctx.contentSelectionResult) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "selection-result-panel" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "panel-title compact-title" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "result-filter-tabs" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.contentSelectionResult))
                    return;
                __VLS_ctx.contentSelectionResultFilter = 'all';
            } },
        ...{ class: ({ active: __VLS_ctx.contentSelectionResultFilter === 'all' }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.contentSelectionResult))
                    return;
                __VLS_ctx.contentSelectionResultFilter = 'selected';
            } },
        ...{ class: ({ active: __VLS_ctx.contentSelectionResultFilter === 'selected' }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.contentSelectionResult))
                    return;
                __VLS_ctx.contentSelectionResultFilter = 'rejected';
            } },
        ...{ class: ({ active: __VLS_ctx.contentSelectionResultFilter === 'rejected' }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "selection-result-list" },
    });
    for (const [item] of __VLS_getVForSourceType((__VLS_ctx.pageItems(__VLS_ctx.filteredContentSelectionResults, 'selectionResults')))) {
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
    if (__VLS_ctx.shouldShowPagination(__VLS_ctx.filteredContentSelectionResults, 'selectionResults')) {
        /** @type {[typeof PaginationBar, ]} */ ;
        // @ts-ignore
        const __VLS_6 = __VLS_asFunctionalComponent(PaginationBar, new PaginationBar({
            page: (__VLS_ctx.pagination.selectionResults.page),
            pageSize: (__VLS_ctx.pagination.selectionResults.pageSize),
            total: (__VLS_ctx.filteredContentSelectionResults.length),
        }));
        const __VLS_7 = __VLS_6({
            page: (__VLS_ctx.pagination.selectionResults.page),
            pageSize: (__VLS_ctx.pagination.selectionResults.pageSize),
            total: (__VLS_ctx.filteredContentSelectionResults.length),
        }, ...__VLS_functionalComponentArgsRest(__VLS_6));
    }
}
/** @type {__VLS_StyleScopedClasses['panel']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-title']} */ ;
/** @type {__VLS_StyleScopedClasses['collector-selection-toolbar']} */ ;
/** @type {__VLS_StyleScopedClasses['smart-filter-toolbar']} */ ;
/** @type {__VLS_StyleScopedClasses['selection-agent-field']} */ ;
/** @type {__VLS_StyleScopedClasses['selection-agent-field']} */ ;
/** @type {__VLS_StyleScopedClasses['selection-agent-field']} */ ;
/** @type {__VLS_StyleScopedClasses['selection-agent-field']} */ ;
/** @type {__VLS_StyleScopedClasses['selection-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['primary']} */ ;
/** @type {__VLS_StyleScopedClasses['selection-stats']} */ ;
/** @type {__VLS_StyleScopedClasses['review-history']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-title']} */ ;
/** @type {__VLS_StyleScopedClasses['compact-title']} */ ;
/** @type {__VLS_StyleScopedClasses['empty']} */ ;
/** @type {__VLS_StyleScopedClasses['compact-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['table']} */ ;
/** @type {__VLS_StyleScopedClasses['table-row']} */ ;
/** @type {__VLS_StyleScopedClasses['selection-history-row']} */ ;
/** @type {__VLS_StyleScopedClasses['table-head']} */ ;
/** @type {__VLS_StyleScopedClasses['table-row']} */ ;
/** @type {__VLS_StyleScopedClasses['selection-history-row']} */ ;
/** @type {__VLS_StyleScopedClasses['row-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['text-button']} */ ;
/** @type {__VLS_StyleScopedClasses['text-button']} */ ;
/** @type {__VLS_StyleScopedClasses['danger']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-title']} */ ;
/** @type {__VLS_StyleScopedClasses['compact-title']} */ ;
/** @type {__VLS_StyleScopedClasses['empty']} */ ;
/** @type {__VLS_StyleScopedClasses['collector-selection-toolbar']} */ ;
/** @type {__VLS_StyleScopedClasses['raw-content-toolbar']} */ ;
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
/** @type {__VLS_StyleScopedClasses['selection-result-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-title']} */ ;
/** @type {__VLS_StyleScopedClasses['compact-title']} */ ;
/** @type {__VLS_StyleScopedClasses['result-filter-tabs']} */ ;
/** @type {__VLS_StyleScopedClasses['selection-result-list']} */ ;
/** @type {__VLS_StyleScopedClasses['selection-result-item']} */ ;
/** @type {__VLS_StyleScopedClasses['selection-result-main']} */ ;
/** @type {__VLS_StyleScopedClasses['selection-result-meta']} */ ;
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            PaginationBar: PaginationBar,
            dashboard: dashboard,
            statusText: statusText,
            selectedRawContent: selectedRawContent,
            selectedRawContentIds: selectedRawContentIds,
            smartFilterAccountId: smartFilterAccountId,
            contentSelectionBusy: contentSelectionBusy,
            contentSelectionAgentId: contentSelectionAgentId,
            contentSelectionProfileReportId: contentSelectionProfileReportId,
            contentSelectionReviewReportId: contentSelectionReviewReportId,
            contentSelectionResult: contentSelectionResult,
            contentSelectionHistory: contentSelectionHistory,
            contentSelectionProfileReports: contentSelectionProfileReports,
            contentSelectionReviewReports: contentSelectionReviewReports,
            contentSelectionResultFilter: contentSelectionResultFilter,
            contentSelectionStats: contentSelectionStats,
            contentSelectionAgents: contentSelectionAgents,
            canRunContentSelection: canRunContentSelection,
            filteredContentSelectionResults: filteredContentSelectionResults,
            contentSelectionRecommendedCount: contentSelectionRecommendedCount,
            allRawContentsSelected: allRawContentsSelected,
            pagination: pagination,
            pageItems: pageItems,
            shouldShowPagination: shouldShowPagination,
            loadSmartFilterContext: loadSmartFilterContext,
            selectionReviewLabel: selectionReviewLabel,
            runContentSelection: runContentSelection,
            selectContentSelectionRun: selectContentSelectionRun,
            removeContentSelectionRun: removeContentSelectionRun,
            removeSelectedRawContents: removeSelectedRawContents,
            rawContentSourceLabel: rawContentSourceLabel,
            rawContentStatusLabel: rawContentStatusLabel,
            formatDate: formatDate,
            rawContentTitle: rawContentTitle,
            selectionResultClass: selectionResultClass,
            selectionRiskLabel: selectionRiskLabel,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
