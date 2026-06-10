<!--
实现逻辑：
1. 管理平台账号列表、登录接入、批量删除和作品同步入口。
2. 通过共享上下文复用账号相关状态、分页配置和事件处理函数。
-->

<template>
  <section class="panel">
    <div class="panel-title">
      <h2>账号列表</h2>
      <span>{{ statusText }}</span>
    </div>
    <div class="login-card">
      <div>
        <h3>平台登录接入</h3>
        <p>打开平台登录页，手动完成登录后点击确认，系统会保存登录态。</p>
      </div>
      <div class="account-toolbar">
        <span class="account-selection-count">已选择 {{ selectedAccountIds.length }} 个账号</span>
        <div class="login-actions">
          <select v-model="loginPlatform">
            <option value="toutiao">头条号</option>
            <option value="baijiahao">百家号</option>
            <option value="weixin">微信公众号</option>
            <option value="qiehao">企鹅号</option>
            <option value="xiaohongshu">小红书</option>
          </select>
          <button class="secondary" @click="openLoginSession" :disabled="loginBusy">
            打开登录页
          </button>
          <button class="primary" @click="confirmLogin" :disabled="loginBusy || !loginSessionId">
            我已登录
          </button>
          <button
            class="text-button danger"
            @click="removeSelectedAccounts"
            :disabled="loginBusy || selectedAccountIds.length === 0"
          >
            批量删除{{ selectedAccountIds.length ? `（${selectedAccountIds.length}）` : '' }}
          </button>
        </div>
      </div>
    </div>
    <div v-if="dashboard.accounts.length === 0" class="empty">
      暂无账号
    </div>
    <div v-else class="table">
      <div class="table-row table-head account-table-row">
        <label class="checkbox-cell">
          <input
            v-model="allAccountsSelected"
            type="checkbox"
            :disabled="loginBusy || dashboard.accounts.length === 0"
          />
        </label>
        <span>平台</span>
        <span>昵称</span>
        <span>UID</span>
        <span>状态</span>
        <span>每日上限</span>
        <span>操作</span>
      </div>
      <div v-for="account in pageItems(dashboard.accounts, 'accounts')" :key="account.id" class="table-row account-table-row">
        <label class="checkbox-cell">
          <input
            v-model="selectedAccountIds"
            type="checkbox"
            :value="account.id"
            :disabled="loginBusy"
          />
        </label>
        <span>{{ account.platform }}</span>
        <span>{{ account.nickname || '-' }}</span>
        <span>{{ account.uid || '-' }}</span>
        <span>{{ account.status }}</span>
        <span>{{ account.daily_publish_limit }}</span>
        <span class="row-actions">
          <button class="text-button" @click="syncWorks(account)" :disabled="loginBusy || account.platform !== 'toutiao'">
            同步作品
          </button>
          <button class="text-button" @click="showAccountWorks(account)" :disabled="loginBusy">
            作品
          </button>
          <button class="text-button danger" @click="removeAccount(account)" :disabled="loginBusy">
            删除
          </button>
        </span>
      </div>
    </div>
    <PaginationBar
      v-if="shouldShowPagination(dashboard.accounts, 'accounts')"
      v-model:page="pagination.accounts.page"
      v-model:page-size="pagination.accounts.pageSize"
      :total="dashboard.accounts.length"
    />
    <section v-if="selectedWorkAccount" class="account-works-panel">
      <div class="account-works-header">
        <h3>{{ selectedWorkAccount.nickname || selectedWorkAccount.uid || selectedWorkAccount.platform }} 的作品</h3>
        <button class="text-button" @click="clearAccountWorks">关闭</button>
      </div>
      <div v-if="accountWorks.length === 0" class="empty compact-empty">
        暂无同步作品
      </div>
      <div v-else class="table">
        <div class="table-row account-work-row table-head">
          <span>标题</span>
          <span>状态</span>
          <span>阅读/播放</span>
          <span>点赞</span>
          <span>评论</span>
          <span>同步时间</span>
          <span>操作</span>
        </div>
        <div v-for="work in pageItems(accountWorks, 'accountWorks')" :key="work.id" class="table-row account-work-row">
          <span>
            <a v-if="work.url" :href="work.url" target="_blank" rel="noreferrer">{{ work.title }}</a>
            <template v-else>{{ work.title }}</template>
          </span>
          <span>{{ work.status || '-' }}</span>
          <span>{{ metricText(work.metrics, 'views') }}</span>
          <span>{{ metricText(work.metrics, 'likes') }}</span>
          <span>{{ metricText(work.metrics, 'comments') }}</span>
          <span>{{ formatDate(work.synced_at) }}</span>
          <span class="row-actions">
            <button class="text-button" @click="selectAccountWork(work)">内容</button>
          </span>
        </div>
      </div>
      <PaginationBar
        v-if="shouldShowPagination(accountWorks, 'accountWorks')"
        v-model:page="pagination.accountWorks.page"
        v-model:page-size="pagination.accountWorks.pageSize"
        :total="accountWorks.length"
      />
    </section>
  </section>
</template>

<script setup lang="ts">
import { inject, type Ref } from 'vue'
import PaginationBar from '../../components/PaginationBar.vue'
import { appContextKey } from '../appContext'

const app = inject(appContextKey)
if (!app) {
  throw new Error('AccountsPage 缺少 appContext')
}

const dashboard = app.dashboard
const statusText = app.statusText as Ref<string>
const loginBusy = app.loginBusy as Ref<boolean>
const loginPlatform = app.loginPlatform as Ref<string>
const loginSessionId = app.loginSessionId as Ref<string>
const selectedAccountIds = app.selectedAccountIds as Ref<number[]>
const selectedWorkAccount = app.selectedWorkAccount as Ref<any>
const accountWorks = app.accountWorks as Ref<any[]>
const pagination = app.pagination
const allAccountsSelected = app.allAccountsSelected
const pageItems = app.pageItems
const shouldShowPagination = app.shouldShowPagination
const openLoginSession = app.openLoginSession
const confirmLogin = app.confirmLogin
const removeSelectedAccounts = app.removeSelectedAccounts
const syncWorks = app.syncWorks
const showAccountWorks = app.showAccountWorks
const removeAccount = app.removeAccount
const clearAccountWorks = app.clearAccountWorks
const selectAccountWork = app.selectAccountWork
const metricText = app.metricText
const formatDate = app.formatDate
</script>
