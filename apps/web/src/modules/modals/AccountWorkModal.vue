<!--
实现逻辑：
1. 展示账号同步作品的标题和正文内容。
2. 通过 appContext 复用账号模块的选中状态，关闭时只清空当前选中作品。
3. 弹框自身不发起数据请求，保持为轻量展示组件。
-->

<template>
  <div v-if="selectedAccountWork" class="modal-backdrop" @click.self="selectedAccountWork = null">
    <section class="work-content-modal" role="dialog" aria-modal="true">
      <div class="work-content-header">
        <h4>{{ selectedAccountWork.title }}</h4>
        <button class="text-button" @click="selectedAccountWork = null">关闭</button>
      </div>
      <pre>{{ selectedAccountWork.content || '暂无正文，下次同步会继续尝试补全。' }}</pre>
    </section>
  </div>
</template>

<script setup lang="ts">
import { inject, type Ref } from 'vue'
import { appContextKey } from '../appContext'

const app = inject(appContextKey)
if (!app) {
  throw new Error('AccountWorkModal 缺少 appContext')
}

const selectedAccountWork = app.selectedAccountWork as Ref<any>
</script>
