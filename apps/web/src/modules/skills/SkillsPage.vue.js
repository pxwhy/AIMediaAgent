/// <reference types="../../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { inject } from 'vue';
import PaginationBar from '../../components/PaginationBar.vue';
import { appContextKey } from '../appContext';
const app = inject(appContextKey);
if (!app) {
    throw new Error('SkillsPage 缺少 appContext');
}
const skillBusy = app.skillBusy;
const skillStatusText = app.skillStatusText;
const localSkillsRoot = app.localSkillsRoot;
const localSkills = app.localSkills;
const selectedLocalSkill = app.selectedLocalSkill;
const pagination = app.pagination;
const pageItems = app.pageItems;
const shouldShowPagination = app.shouldShowPagination;
const reloadSkillsDirectory = app.reloadSkillsDirectory;
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
                    if (!!(__VLS_ctx.localSkills.length === 0))
                        return;
                    __VLS_ctx.selectedLocalSkill = config;
                } },
            ...{ class: "text-button" },
        });
    }
}
if (__VLS_ctx.shouldShowPagination(__VLS_ctx.localSkills, 'skills')) {
    /** @type {[typeof PaginationBar, ]} */ ;
    // @ts-ignore
    const __VLS_0 = __VLS_asFunctionalComponent(PaginationBar, new PaginationBar({
        page: (__VLS_ctx.pagination.skills.page),
        pageSize: (__VLS_ctx.pagination.skills.pageSize),
        total: (__VLS_ctx.localSkills.length),
    }));
    const __VLS_1 = __VLS_0({
        page: (__VLS_ctx.pagination.skills.page),
        pageSize: (__VLS_ctx.pagination.skills.pageSize),
        total: (__VLS_ctx.localSkills.length),
    }, ...__VLS_functionalComponentArgsRest(__VLS_0));
}
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
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            PaginationBar: PaginationBar,
            skillBusy: skillBusy,
            skillStatusText: skillStatusText,
            localSkillsRoot: localSkillsRoot,
            localSkills: localSkills,
            selectedLocalSkill: selectedLocalSkill,
            pagination: pagination,
            pageItems: pageItems,
            shouldShowPagination: shouldShowPagination,
            reloadSkillsDirectory: reloadSkillsDirectory,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
