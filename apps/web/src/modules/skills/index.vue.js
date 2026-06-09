/// <reference types="../../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { inject } from 'vue';
import PaginationBar from '../../components/PaginationBar.vue';
import { appContextKey } from '../appContext';
import SkillEdit from './edit.vue';
const app = inject(appContextKey);
if (!app) {
    throw new Error('SkillsIndex 缺少 appContext');
}
const skillBusy = app.skillBusy;
const skillConfigs = app.skillConfigs;
const skillModalOpen = app.skillModalOpen;
const skillForm = app.skillForm;
const localSkillsRoot = app.localSkillsRoot;
const localSkills = app.localSkills;
const selectedLocalSkill = app.selectedLocalSkill;
const pagination = app.pagination;
const pageItems = app.pageItems;
const shouldShowPagination = app.shouldShowPagination;
const reloadSkillsDirectory = app.reloadSkillsDirectory;
const openEditSkillModal = app.openEditSkillModal;
const removeSkill = app.removeSkill;
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
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.reloadSkillsDirectory) },
    ...{ class: "secondary" },
    disabled: (__VLS_ctx.skillBusy),
});
(__VLS_ctx.skillBusy ? '加载中' : '加载目录');
if (__VLS_ctx.skillConfigs.length === 0) {
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
    __VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.tbody, __VLS_intrinsicElements.tbody)({});
    for (const [config] of __VLS_getVForSourceType((__VLS_ctx.pageItems(__VLS_ctx.skillConfigs, 'skills')))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({
            key: (config.id),
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
        (config.name);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
        (config.skill_type);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
        (config.description || '-');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
        (config.enabled ? '启用' : '禁用');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "row-actions model-row-actions" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.skillConfigs.length === 0))
                        return;
                    __VLS_ctx.openEditSkillModal(config);
                } },
            ...{ class: "text-button" },
            disabled: (__VLS_ctx.skillBusy),
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.skillConfigs.length === 0))
                        return;
                    __VLS_ctx.removeSkill(config);
                } },
            ...{ class: "text-button danger" },
            disabled: (__VLS_ctx.skillBusy),
        });
    }
}
if (__VLS_ctx.shouldShowPagination(__VLS_ctx.skillConfigs, 'skills')) {
    /** @type {[typeof PaginationBar, ]} */ ;
    // @ts-ignore
    const __VLS_0 = __VLS_asFunctionalComponent(PaginationBar, new PaginationBar({
        page: (__VLS_ctx.pagination.skills.page),
        pageSize: (__VLS_ctx.pagination.skills.pageSize),
        total: (__VLS_ctx.skillConfigs.length),
    }));
    const __VLS_1 = __VLS_0({
        page: (__VLS_ctx.pagination.skills.page),
        pageSize: (__VLS_ctx.pagination.skills.pageSize),
        total: (__VLS_ctx.skillConfigs.length),
    }, ...__VLS_functionalComponentArgsRest(__VLS_0));
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "review-history" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "panel-title compact-title" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
if (__VLS_ctx.localSkills.length === 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "empty compact-empty" },
    });
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "table" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "table-row skill-local-row table-head" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    for (const [skill] of __VLS_getVForSourceType((__VLS_ctx.pageItems(__VLS_ctx.localSkills, 'localSkills')))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (skill.path),
            ...{ class: "table-row skill-local-row" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (skill.name);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (skill.description || '-');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (skill.path);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "row-actions" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.localSkills.length === 0))
                        return;
                    __VLS_ctx.selectedLocalSkill = skill;
                } },
            ...{ class: "text-button" },
        });
    }
}
if (__VLS_ctx.shouldShowPagination(__VLS_ctx.localSkills, 'localSkills')) {
    /** @type {[typeof PaginationBar, ]} */ ;
    // @ts-ignore
    const __VLS_3 = __VLS_asFunctionalComponent(PaginationBar, new PaginationBar({
        page: (__VLS_ctx.pagination.localSkills.page),
        pageSize: (__VLS_ctx.pagination.localSkills.pageSize),
        total: (__VLS_ctx.localSkills.length),
    }));
    const __VLS_4 = __VLS_3({
        page: (__VLS_ctx.pagination.localSkills.page),
        pageSize: (__VLS_ctx.pagination.localSkills.pageSize),
        total: (__VLS_ctx.localSkills.length),
    }, ...__VLS_functionalComponentArgsRest(__VLS_3));
}
if (__VLS_ctx.skillModalOpen && __VLS_ctx.skillForm.id) {
    /** @type {[typeof SkillEdit, ]} */ ;
    // @ts-ignore
    const __VLS_6 = __VLS_asFunctionalComponent(SkillEdit, new SkillEdit({}));
    const __VLS_7 = __VLS_6({}, ...__VLS_functionalComponentArgsRest(__VLS_6));
}
/** @type {__VLS_StyleScopedClasses['panel']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-title']} */ ;
/** @type {__VLS_StyleScopedClasses['compact-title']} */ ;
/** @type {__VLS_StyleScopedClasses['skills-local-toolbar']} */ ;
/** @type {__VLS_StyleScopedClasses['secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['empty']} */ ;
/** @type {__VLS_StyleScopedClasses['skill-config-table']} */ ;
/** @type {__VLS_StyleScopedClasses['row-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['model-row-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['text-button']} */ ;
/** @type {__VLS_StyleScopedClasses['text-button']} */ ;
/** @type {__VLS_StyleScopedClasses['danger']} */ ;
/** @type {__VLS_StyleScopedClasses['review-history']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-title']} */ ;
/** @type {__VLS_StyleScopedClasses['compact-title']} */ ;
/** @type {__VLS_StyleScopedClasses['empty']} */ ;
/** @type {__VLS_StyleScopedClasses['compact-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['table']} */ ;
/** @type {__VLS_StyleScopedClasses['table-row']} */ ;
/** @type {__VLS_StyleScopedClasses['skill-local-row']} */ ;
/** @type {__VLS_StyleScopedClasses['table-head']} */ ;
/** @type {__VLS_StyleScopedClasses['table-row']} */ ;
/** @type {__VLS_StyleScopedClasses['skill-local-row']} */ ;
/** @type {__VLS_StyleScopedClasses['row-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['text-button']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            PaginationBar: PaginationBar,
            SkillEdit: SkillEdit,
            skillBusy: skillBusy,
            skillConfigs: skillConfigs,
            skillModalOpen: skillModalOpen,
            skillForm: skillForm,
            localSkillsRoot: localSkillsRoot,
            localSkills: localSkills,
            selectedLocalSkill: selectedLocalSkill,
            pagination: pagination,
            pageItems: pageItems,
            shouldShowPagination: shouldShowPagination,
            reloadSkillsDirectory: reloadSkillsDirectory,
            openEditSkillModal: openEditSkillModal,
            removeSkill: removeSkill,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
