/// <reference types="../../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { inject } from 'vue';
import PaginationBar from '../../components/PaginationBar.vue';
import { appContextKey } from '../appContext';
const app = inject(appContextKey);
if (!app) {
    throw new Error('AccountsPage 缺少 appContext');
}
const dashboard = app.dashboard;
const statusText = app.statusText;
const loginBusy = app.loginBusy;
const loginPlatform = app.loginPlatform;
const loginSessionId = app.loginSessionId;
const selectedAccountIds = app.selectedAccountIds;
const selectedWorkAccount = app.selectedWorkAccount;
const accountWorks = app.accountWorks;
const pagination = app.pagination;
const allAccountsSelected = app.allAccountsSelected;
const pageItems = app.pageItems;
const shouldShowPagination = app.shouldShowPagination;
const openLoginSession = app.openLoginSession;
const confirmLogin = app.confirmLogin;
const removeSelectedAccounts = app.removeSelectedAccounts;
const syncWorks = app.syncWorks;
const showAccountWorks = app.showAccountWorks;
const removeAccount = app.removeAccount;
const clearAccountWorks = app.clearAccountWorks;
const selectAccountWork = app.selectAccountWork;
const metricText = app.metricText;
const formatDate = app.formatDate;
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
    ...{ class: "login-card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "account-toolbar" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "account-selection-count" },
});
(__VLS_ctx.selectedAccountIds.length);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "login-actions" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    value: (__VLS_ctx.loginPlatform),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "toutiao",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "baijiahao",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "weixin",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "qiehao",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "xiaohongshu",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.openLoginSession) },
    ...{ class: "secondary" },
    disabled: (__VLS_ctx.loginBusy),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.confirmLogin) },
    ...{ class: "primary" },
    disabled: (__VLS_ctx.loginBusy || !__VLS_ctx.loginSessionId),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.removeSelectedAccounts) },
    ...{ class: "text-button danger" },
    disabled: (__VLS_ctx.loginBusy || __VLS_ctx.selectedAccountIds.length === 0),
});
(__VLS_ctx.selectedAccountIds.length ? `（${__VLS_ctx.selectedAccountIds.length}）` : '');
if (__VLS_ctx.dashboard.accounts.length === 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "empty" },
    });
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "table" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "table-row table-head account-table-row" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "checkbox-cell" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        type: "checkbox",
        disabled: (__VLS_ctx.loginBusy || __VLS_ctx.dashboard.accounts.length === 0),
    });
    (__VLS_ctx.allAccountsSelected);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    for (const [account] of __VLS_getVForSourceType((__VLS_ctx.pageItems(__VLS_ctx.dashboard.accounts, 'accounts')))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (account.id),
            ...{ class: "table-row account-table-row" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
            ...{ class: "checkbox-cell" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            type: "checkbox",
            value: (account.id),
            disabled: (__VLS_ctx.loginBusy),
        });
        (__VLS_ctx.selectedAccountIds);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (account.platform);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (account.nickname || '-');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (account.uid || '-');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (account.status);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (account.daily_publish_limit);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "row-actions" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.dashboard.accounts.length === 0))
                        return;
                    __VLS_ctx.syncWorks(account);
                } },
            ...{ class: "text-button" },
            disabled: (__VLS_ctx.loginBusy || account.platform !== 'toutiao'),
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.dashboard.accounts.length === 0))
                        return;
                    __VLS_ctx.showAccountWorks(account);
                } },
            ...{ class: "text-button" },
            disabled: (__VLS_ctx.loginBusy),
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.dashboard.accounts.length === 0))
                        return;
                    __VLS_ctx.removeAccount(account);
                } },
            ...{ class: "text-button danger" },
            disabled: (__VLS_ctx.loginBusy),
        });
    }
}
if (__VLS_ctx.shouldShowPagination(__VLS_ctx.dashboard.accounts, 'accounts')) {
    /** @type {[typeof PaginationBar, ]} */ ;
    // @ts-ignore
    const __VLS_0 = __VLS_asFunctionalComponent(PaginationBar, new PaginationBar({
        page: (__VLS_ctx.pagination.accounts.page),
        pageSize: (__VLS_ctx.pagination.accounts.pageSize),
        total: (__VLS_ctx.dashboard.accounts.length),
    }));
    const __VLS_1 = __VLS_0({
        page: (__VLS_ctx.pagination.accounts.page),
        pageSize: (__VLS_ctx.pagination.accounts.pageSize),
        total: (__VLS_ctx.dashboard.accounts.length),
    }, ...__VLS_functionalComponentArgsRest(__VLS_0));
}
if (__VLS_ctx.selectedWorkAccount) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "account-works-panel" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "account-works-header" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
    (__VLS_ctx.selectedWorkAccount.nickname || __VLS_ctx.selectedWorkAccount.uid || __VLS_ctx.selectedWorkAccount.platform);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.clearAccountWorks) },
        ...{ class: "text-button" },
    });
    if (__VLS_ctx.accountWorks.length === 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "empty compact-empty" },
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "table" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "table-row account-work-row table-head" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        for (const [work] of __VLS_getVForSourceType((__VLS_ctx.pageItems(__VLS_ctx.accountWorks, 'accountWorks')))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                key: (work.id),
                ...{ class: "table-row account-work-row" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            if (work.url) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
                    href: (work.url),
                    target: "_blank",
                    rel: "noreferrer",
                });
                (work.title);
            }
            else {
                (work.title);
            }
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (work.status || '-');
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (__VLS_ctx.metricText(work.metrics, 'views'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (__VLS_ctx.metricText(work.metrics, 'likes'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (__VLS_ctx.metricText(work.metrics, 'comments'));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (__VLS_ctx.formatDate(work.synced_at));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "row-actions" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.selectedWorkAccount))
                            return;
                        if (!!(__VLS_ctx.accountWorks.length === 0))
                            return;
                        __VLS_ctx.selectAccountWork(work);
                    } },
                ...{ class: "text-button" },
            });
        }
    }
    if (__VLS_ctx.shouldShowPagination(__VLS_ctx.accountWorks, 'accountWorks')) {
        /** @type {[typeof PaginationBar, ]} */ ;
        // @ts-ignore
        const __VLS_3 = __VLS_asFunctionalComponent(PaginationBar, new PaginationBar({
            page: (__VLS_ctx.pagination.accountWorks.page),
            pageSize: (__VLS_ctx.pagination.accountWorks.pageSize),
            total: (__VLS_ctx.accountWorks.length),
        }));
        const __VLS_4 = __VLS_3({
            page: (__VLS_ctx.pagination.accountWorks.page),
            pageSize: (__VLS_ctx.pagination.accountWorks.pageSize),
            total: (__VLS_ctx.accountWorks.length),
        }, ...__VLS_functionalComponentArgsRest(__VLS_3));
    }
}
/** @type {__VLS_StyleScopedClasses['panel']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-title']} */ ;
/** @type {__VLS_StyleScopedClasses['login-card']} */ ;
/** @type {__VLS_StyleScopedClasses['account-toolbar']} */ ;
/** @type {__VLS_StyleScopedClasses['account-selection-count']} */ ;
/** @type {__VLS_StyleScopedClasses['login-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['primary']} */ ;
/** @type {__VLS_StyleScopedClasses['text-button']} */ ;
/** @type {__VLS_StyleScopedClasses['danger']} */ ;
/** @type {__VLS_StyleScopedClasses['empty']} */ ;
/** @type {__VLS_StyleScopedClasses['table']} */ ;
/** @type {__VLS_StyleScopedClasses['table-row']} */ ;
/** @type {__VLS_StyleScopedClasses['table-head']} */ ;
/** @type {__VLS_StyleScopedClasses['account-table-row']} */ ;
/** @type {__VLS_StyleScopedClasses['checkbox-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['table-row']} */ ;
/** @type {__VLS_StyleScopedClasses['account-table-row']} */ ;
/** @type {__VLS_StyleScopedClasses['checkbox-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['row-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['text-button']} */ ;
/** @type {__VLS_StyleScopedClasses['text-button']} */ ;
/** @type {__VLS_StyleScopedClasses['text-button']} */ ;
/** @type {__VLS_StyleScopedClasses['danger']} */ ;
/** @type {__VLS_StyleScopedClasses['account-works-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['account-works-header']} */ ;
/** @type {__VLS_StyleScopedClasses['text-button']} */ ;
/** @type {__VLS_StyleScopedClasses['empty']} */ ;
/** @type {__VLS_StyleScopedClasses['compact-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['table']} */ ;
/** @type {__VLS_StyleScopedClasses['table-row']} */ ;
/** @type {__VLS_StyleScopedClasses['account-work-row']} */ ;
/** @type {__VLS_StyleScopedClasses['table-head']} */ ;
/** @type {__VLS_StyleScopedClasses['table-row']} */ ;
/** @type {__VLS_StyleScopedClasses['account-work-row']} */ ;
/** @type {__VLS_StyleScopedClasses['row-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['text-button']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            PaginationBar: PaginationBar,
            dashboard: dashboard,
            statusText: statusText,
            loginBusy: loginBusy,
            loginPlatform: loginPlatform,
            loginSessionId: loginSessionId,
            selectedAccountIds: selectedAccountIds,
            selectedWorkAccount: selectedWorkAccount,
            accountWorks: accountWorks,
            pagination: pagination,
            allAccountsSelected: allAccountsSelected,
            pageItems: pageItems,
            shouldShowPagination: shouldShowPagination,
            openLoginSession: openLoginSession,
            confirmLogin: confirmLogin,
            removeSelectedAccounts: removeSelectedAccounts,
            syncWorks: syncWorks,
            showAccountWorks: showAccountWorks,
            removeAccount: removeAccount,
            clearAccountWorks: clearAccountWorks,
            selectAccountWork: selectAccountWork,
            metricText: metricText,
            formatDate: formatDate,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
