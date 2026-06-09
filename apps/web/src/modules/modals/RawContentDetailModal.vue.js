/// <reference types="../../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { inject } from 'vue';
import { appContextKey } from '../appContext';
const app = inject(appContextKey);
if (!app) {
    throw new Error('RawContentDetailModal 缺少 appContext');
}
const selectedRawContent = app.selectedRawContent;
const rawContentSourceLabel = app.rawContentSourceLabel;
const formatDate = app.formatDate;
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
if (__VLS_ctx.selectedRawContent) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.selectedRawContent))
                    return;
                __VLS_ctx.selectedRawContent = null;
            } },
        ...{ class: "modal-backdrop" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "work-content-modal detail-modal" },
        role: "dialog",
        'aria-modal': "true",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "work-content-header" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "modal-title-block" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)({});
    (__VLS_ctx.selectedRawContent.title);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    (__VLS_ctx.rawContentSourceLabel(__VLS_ctx.selectedRawContent.source));
    (__VLS_ctx.selectedRawContent.category || '-');
    (__VLS_ctx.formatDate(__VLS_ctx.selectedRawContent.created_at));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.selectedRawContent))
                    return;
                __VLS_ctx.selectedRawContent = null;
            } },
        ...{ class: "text-button" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "detail-modal-body" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "detail-media-panel" },
    });
    if (__VLS_ctx.selectedRawContent.images.length) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "detail-image-grid" },
        });
        for (const [image] of __VLS_getVForSourceType((__VLS_ctx.selectedRawContent.images))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
                key: (image),
                href: (image),
                target: "_blank",
                rel: "noreferrer",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
                src: (image),
                alt: (__VLS_ctx.selectedRawContent.title),
            });
        }
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "empty compact-empty detail-media-empty" },
        });
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "detail-text-panel" },
    });
    if (__VLS_ctx.selectedRawContent.source_url) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
            ...{ class: "source-link" },
            href: (__VLS_ctx.selectedRawContent.source_url),
            target: "_blank",
            rel: "noreferrer",
        });
        (__VLS_ctx.selectedRawContent.source_url);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "content-preview" },
    });
    (__VLS_ctx.selectedRawContent.content || '暂无正文内容');
}
/** @type {__VLS_StyleScopedClasses['modal-backdrop']} */ ;
/** @type {__VLS_StyleScopedClasses['work-content-modal']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-modal']} */ ;
/** @type {__VLS_StyleScopedClasses['work-content-header']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-title-block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-button']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-modal-body']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-media-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-image-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['empty']} */ ;
/** @type {__VLS_StyleScopedClasses['compact-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-media-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-text-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['source-link']} */ ;
/** @type {__VLS_StyleScopedClasses['content-preview']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            selectedRawContent: selectedRawContent,
            rawContentSourceLabel: rawContentSourceLabel,
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
