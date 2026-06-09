<!--
实现逻辑：
1. 提供 H5 管理端的仪表盘、账号、模型、Agent、Skills、采集、发布任务等核心工作台页面。
2. 账号页负责平台登录态接入，模型页负责保存和测试模型配置，Agent 页负责绑定模型、Skills 和提示词。
3. 账号页支持单个删除、批量删除和头条号作品同步，智能筛选页可调用挑选 Agent，复盘页基于已同步作品调用对应 Agent。
4. 发布任务页根据任务状态展示可用操作。
-->

<template>
  <main class="shell">
    <aside class="sidebar">
      <div class="brand">AIMediaAgent</div>
      <button
        v-for="item in navItems"
        :key="item.key"
        class="nav"
        :class="{ active: activePage === item.key }"
        @click="activePage = item.key"
      >
        {{ item.label }}
      </button>
    </aside>

    <section class="content">
      <header class="topbar">
        <div>
          <h1>{{ currentNav.label }}</h1>
          <p>{{ currentNav.description }}</p>
        </div>
        <button class="primary" @click="refresh">刷新</button>
      </header>

      <DashboardPage v-if="activePage === 'dashboard'" />

      <AccountsPage v-else-if="activePage === 'accounts'" />

      <CollectorPage v-else-if="activePage === 'collector'" />

      <SmartFilterPage v-else-if="activePage === 'smart-filter'" />

      <PublisherPage v-else-if="activePage === 'publisher'" />

      <ModelsPage v-else-if="activePage === 'models'" />

      <AgentsPage v-else-if="activePage === 'agents'" />

      <SkillsPage v-else-if="activePage === 'skills'" />

      <AccountProfilePage v-else-if="activePage === 'account-profile'" />

      <AnalyticsPage v-else-if="activePage === 'analytics'" />

      <section v-else class="panel">
        <div class="panel-title">
          <h2>{{ currentNav.label }}</h2>
          <span>规划中</span>
        </div>
        <div class="empty">该模块页面正在接入，当前先完成账号和仪表盘。</div>
      </section>
    </section>
    <GlobalModals />
  </main>
</template>

<script setup lang="ts">
import { provide } from 'vue'
import { appContextKey } from './modules/appContext'
import { createWorkbench } from './modules/app-shell/workbench'
import DashboardPage from './modules/dashboard/DashboardPage.vue'
import AccountsPage from './modules/accounts/AccountsPage.vue'
import CollectorPage from './modules/collector/CollectorPage.vue'
import SmartFilterPage from './modules/smart-filter/SmartFilterPage.vue'
import PublisherPage from './modules/publisher/PublisherPage.vue'
import ModelsPage from './modules/models/index.vue'
import AgentsPage from './modules/agents/index.vue'
import SkillsPage from './modules/skills/index.vue'
import AccountProfilePage from './modules/account-profile/AccountProfilePage.vue'
import AnalyticsPage from './modules/analytics/AnalyticsPage.vue'
import GlobalModals from './modules/modals/GlobalModals.vue'

const { activePage, currentNav, navItems, refresh, providedContext } = createWorkbench()

provide(appContextKey, providedContext)
</script>
