/// <reference types="../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { computed } from 'vue';
const pageSizeOptions = [10, 20, 50];
const props = defineProps();
const emit = defineEmits();
const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)));
const currentPage = computed(() => Math.min(Math.max(1, props.page), totalPages.value));
function handlePageSizeChange(event) {
    emit('update:pageSize', Number(event.target.value));
    emit('update:page', 1);
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "pagination-bar" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
(__VLS_ctx.total);
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    ...{ onChange: (__VLS_ctx.handlePageSizeChange) },
    value: (__VLS_ctx.pageSize),
});
for (const [size] of __VLS_getVForSourceType((__VLS_ctx.pageSizeOptions))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        key: (size),
        value: (size),
    });
    (size);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.emit('update:page', __VLS_ctx.currentPage - 1);
        } },
    ...{ class: "text-button" },
    disabled: (__VLS_ctx.currentPage <= 1),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
(__VLS_ctx.currentPage);
(__VLS_ctx.totalPages);
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.emit('update:page', __VLS_ctx.currentPage + 1);
        } },
    ...{ class: "text-button" },
    disabled: (__VLS_ctx.currentPage >= __VLS_ctx.totalPages),
});
/** @type {__VLS_StyleScopedClasses['pagination-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['text-button']} */ ;
/** @type {__VLS_StyleScopedClasses['text-button']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            pageSizeOptions: pageSizeOptions,
            emit: emit,
            totalPages: totalPages,
            currentPage: currentPage,
            handlePageSizeChange: handlePageSizeChange,
        };
    },
    __typeEmits: {},
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeEmits: {},
    __typeProps: {},
});
; /* PartiallyEnd: #4569/main.vue */
