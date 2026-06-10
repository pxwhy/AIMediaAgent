<!--
实现逻辑：
1. 承载工作台首页的仪表盘指标和业务流概览。
2. 只消费共享上下文中的只读数据，不直接改动业务状态。
-->

<template>
  <template v-if="dashboard">
    <section class="metrics">
      <article class="metric">
        <span>账号</span>
        <strong>{{ dashboard.accounts.length }}</strong>
      </article>
      <article class="metric">
        <span>采集内容</span>
        <strong>{{ dashboard.rawContents.length }}</strong>
      </article>
      <article class="metric">
        <span>草稿</span>
        <strong>{{ dashboard.drafts.length }}</strong>
      </article>
      <article class="metric">
        <span>发布任务</span>
        <strong>{{ dashboard.publishTasks.length }}</strong>
      </article>
    </section>

    <section class="panel">
      <div class="panel-title">
        <h2>业务流</h2>
        <span>{{ statusText }}</span>
      </div>
      <div class="flow">
        <div>数据采集</div>
        <div>Agent 草稿</div>
        <div>人工审核</div>
        <div>平台发布</div>
        <div>数据复盘</div>
      </div>
    </section>
  </template>
</template>

<script setup lang="ts">
import { inject, type Ref } from 'vue'
import { appContextKey } from '../appContext'

const app = inject(appContextKey)
if (!app) {
  throw new Error('DashboardPage 缺少 appContext')
}

const dashboard = app.dashboard
const statusText = app.statusText as Ref<string>
</script>
