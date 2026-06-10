<!--
实现逻辑：
1. 提供统一确认弹框，替代业务组件内散落的 window.confirm。
2. 弹框只负责确认/取消事件，具体删除或提交逻辑仍由业务模块处理。
3. 支持 danger 语义，用于删除等不可逆操作。
-->

<template>
  <div v-if="open" class="modal-backdrop" @click.self="emit('cancel')">
    <section class="confirm-modal" role="dialog" aria-modal="true">
      <div class="work-content-header">
        <h4>{{ title }}</h4>
        <button class="text-button" @click="emit('cancel')">关闭</button>
      </div>
      <p>{{ message }}</p>
      <div class="confirm-modal-actions">
        <button class="secondary" @click="emit('cancel')">取消</button>
        <button :class="danger ? 'danger-button' : 'primary'" :disabled="busy" @click="emit('confirm')">
          {{ busy ? busyText : confirmText }}
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  open: boolean
  title: string
  message: string
  confirmText?: string
  busyText?: string
  danger?: boolean
  busy?: boolean
}>(), {
  confirmText: '确认',
  busyText: '处理中',
  danger: false,
  busy: false
})

const emit = defineEmits<{
  cancel: []
  confirm: []
}>()
</script>
