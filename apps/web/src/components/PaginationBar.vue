<!--
实现逻辑：
1. 提供工作台各类表格和列表统一复用的分页条组件。
2. 只展示每页数量、当前页码和翻页操作，不在表格底部展示说明性总数。
3. 通过 v-model 形式向父级同步分页状态。
-->

<template>
  <div class="pagination-bar">
    <label>
      <span>每页</span>
      <select :value="pageSize" @change="handlePageSizeChange">
        <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }}</option>
      </select>
    </label>
    <button class="text-button" :disabled="currentPage <= 1" @click="emit('update:page', currentPage - 1)">
      上一页
    </button>
    <strong>{{ currentPage }} / {{ totalPages }}</strong>
    <button class="text-button" :disabled="currentPage >= totalPages" @click="emit('update:page', currentPage + 1)">
      下一页
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const pageSizeOptions = [10, 20, 50]

const props = defineProps<{
  total: number
  page: number
  pageSize: number
}>()

const emit = defineEmits<{
  'update:page': [value: number]
  'update:pageSize': [value: number]
}>()

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))
const currentPage = computed(() => Math.min(Math.max(1, props.page), totalPages.value))

function handlePageSizeChange(event: Event) {
  emit('update:pageSize', Number((event.target as HTMLSelectElement).value))
  emit('update:page', 1)
}
</script>
