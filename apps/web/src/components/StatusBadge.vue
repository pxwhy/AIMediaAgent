<!--
实现逻辑：
1. 提供列表状态统一徽标，避免各模块重复拼状态 class。
2. tone 只控制视觉语义，具体业务中文文案由调用方传入。
3. 空 label 时展示占位横线，保证表格列宽稳定。
-->

<template>
  <span v-if="label" class="status-badge" :class="badgeClass">{{ label }}</span>
  <span v-else>-</span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  label?: string
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info'
}>(), {
  label: '',
  tone: 'neutral'
})

const badgeClass = computed(() => `status-${props.tone}`)
</script>
