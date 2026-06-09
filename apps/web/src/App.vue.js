/// <reference types="../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { provide } from 'vue';
import { appContextKey } from './modules/appContext';
import { createWorkbench } from './modules/app-shell/workbench';
import DashboardPage from './modules/dashboard/DashboardPage.vue';
import AccountsPage from './modules/accounts/AccountsPage.vue';
import CollectorPage from './modules/collector/CollectorPage.vue';
import SmartFilterPage from './modules/smart-filter/SmartFilterPage.vue';
import PublisherPage from './modules/publisher/PublisherPage.vue';
import ModelsPage from './modules/models/index.vue';
import AgentsPage from './modules/agents/index.vue';
import SkillsPage from './modules/skills/index.vue';
import AccountProfilePage from './modules/account-profile/AccountProfilePage.vue';
import AnalyticsPage from './modules/analytics/AnalyticsPage.vue';
import GlobalModals from './modules/modals/GlobalModals.vue';
const { activePage, currentNav, navItems, refresh, providedContext } = createWorkbench();
provide(appContextKey, providedContext);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.main, __VLS_intrinsicElements.main)({
    ...{ class: "shell" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.aside, __VLS_intrinsicElements.aside)({
    ...{ class: "sidebar" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "brand" },
});
for (const [item] of __VLS_getVForSourceType((__VLS_ctx.navItems))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.activePage = item.key;
            } },
        key: (item.key),
        ...{ class: "nav" },
        ...{ class: ({ active: __VLS_ctx.activePage === item.key }) },
    });
    (item.label);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "content" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.header, __VLS_intrinsicElements.header)({
    ...{ class: "topbar" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
(__VLS_ctx.currentNav.label);
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
(__VLS_ctx.currentNav.description);
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.refresh) },
    ...{ class: "primary" },
});
if (__VLS_ctx.activePage === 'dashboard') {
    /** @type {[typeof DashboardPage, ]} */ ;
    // @ts-ignore
    const __VLS_0 = __VLS_asFunctionalComponent(DashboardPage, new DashboardPage({}));
    const __VLS_1 = __VLS_0({}, ...__VLS_functionalComponentArgsRest(__VLS_0));
}
else if (__VLS_ctx.activePage === 'accounts') {
    /** @type {[typeof AccountsPage, ]} */ ;
    // @ts-ignore
    const __VLS_3 = __VLS_asFunctionalComponent(AccountsPage, new AccountsPage({}));
    const __VLS_4 = __VLS_3({}, ...__VLS_functionalComponentArgsRest(__VLS_3));
}
else if (__VLS_ctx.activePage === 'collector') {
    /** @type {[typeof CollectorPage, ]} */ ;
    // @ts-ignore
    const __VLS_6 = __VLS_asFunctionalComponent(CollectorPage, new CollectorPage({}));
    const __VLS_7 = __VLS_6({}, ...__VLS_functionalComponentArgsRest(__VLS_6));
}
else if (__VLS_ctx.activePage === 'smart-filter') {
    /** @type {[typeof SmartFilterPage, ]} */ ;
    // @ts-ignore
    const __VLS_9 = __VLS_asFunctionalComponent(SmartFilterPage, new SmartFilterPage({}));
    const __VLS_10 = __VLS_9({}, ...__VLS_functionalComponentArgsRest(__VLS_9));
}
else if (__VLS_ctx.activePage === 'publisher') {
    /** @type {[typeof PublisherPage, ]} */ ;
    // @ts-ignore
    const __VLS_12 = __VLS_asFunctionalComponent(PublisherPage, new PublisherPage({}));
    const __VLS_13 = __VLS_12({}, ...__VLS_functionalComponentArgsRest(__VLS_12));
}
else if (__VLS_ctx.activePage === 'models') {
    /** @type {[typeof ModelsPage, ]} */ ;
    // @ts-ignore
    const __VLS_15 = __VLS_asFunctionalComponent(ModelsPage, new ModelsPage({}));
    const __VLS_16 = __VLS_15({}, ...__VLS_functionalComponentArgsRest(__VLS_15));
}
else if (__VLS_ctx.activePage === 'agents') {
    /** @type {[typeof AgentsPage, ]} */ ;
    // @ts-ignore
    const __VLS_18 = __VLS_asFunctionalComponent(AgentsPage, new AgentsPage({}));
    const __VLS_19 = __VLS_18({}, ...__VLS_functionalComponentArgsRest(__VLS_18));
}
else if (__VLS_ctx.activePage === 'skills') {
    /** @type {[typeof SkillsPage, ]} */ ;
    // @ts-ignore
    const __VLS_21 = __VLS_asFunctionalComponent(SkillsPage, new SkillsPage({}));
    const __VLS_22 = __VLS_21({}, ...__VLS_functionalComponentArgsRest(__VLS_21));
}
else if (__VLS_ctx.activePage === 'account-profile') {
    /** @type {[typeof AccountProfilePage, ]} */ ;
    // @ts-ignore
    const __VLS_24 = __VLS_asFunctionalComponent(AccountProfilePage, new AccountProfilePage({}));
    const __VLS_25 = __VLS_24({}, ...__VLS_functionalComponentArgsRest(__VLS_24));
}
else if (__VLS_ctx.activePage === 'analytics') {
    /** @type {[typeof AnalyticsPage, ]} */ ;
    // @ts-ignore
    const __VLS_27 = __VLS_asFunctionalComponent(AnalyticsPage, new AnalyticsPage({}));
    const __VLS_28 = __VLS_27({}, ...__VLS_functionalComponentArgsRest(__VLS_27));
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "panel" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "panel-title" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
    (__VLS_ctx.currentNav.label);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "empty" },
    });
}
/** @type {[typeof GlobalModals, ]} */ ;
// @ts-ignore
const __VLS_30 = __VLS_asFunctionalComponent(GlobalModals, new GlobalModals({}));
const __VLS_31 = __VLS_30({}, ...__VLS_functionalComponentArgsRest(__VLS_30));
/** @type {__VLS_StyleScopedClasses['shell']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar']} */ ;
/** @type {__VLS_StyleScopedClasses['brand']} */ ;
/** @type {__VLS_StyleScopedClasses['nav']} */ ;
/** @type {__VLS_StyleScopedClasses['content']} */ ;
/** @type {__VLS_StyleScopedClasses['topbar']} */ ;
/** @type {__VLS_StyleScopedClasses['primary']} */ ;
/** @type {__VLS_StyleScopedClasses['panel']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-title']} */ ;
/** @type {__VLS_StyleScopedClasses['empty']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            DashboardPage: DashboardPage,
            AccountsPage: AccountsPage,
            CollectorPage: CollectorPage,
            SmartFilterPage: SmartFilterPage,
            PublisherPage: PublisherPage,
            ModelsPage: ModelsPage,
            AgentsPage: AgentsPage,
            SkillsPage: SkillsPage,
            AccountProfilePage: AccountProfilePage,
            AnalyticsPage: AnalyticsPage,
            GlobalModals: GlobalModals,
            activePage: activePage,
            currentNav: currentNav,
            navItems: navItems,
            refresh: refresh,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
