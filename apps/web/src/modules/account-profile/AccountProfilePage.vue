<!--
实现逻辑：
1. 承载账号肖像鉴定入口、肖像 Agent 选择和肖像历史列表。
2. 页面只负责展示和触发操作，账号数据、复盘报告、分页和生成逻辑由共享上下文提供。
-->

<template>
  <section class="panel">
    <div class="panel-title compact-title">
      <h2>账号肖像鉴定</h2>
      <span>{{ profileStatusText }}</span>
    </div>
    <div class="review-toolbar">
      <label>
        <span>账号</span>
        <select v-model.number="profileForm.account_id" @change="loadProfileContext">
          <option :value="0">请选择账号</option>
          <option v-for="account in dashboard.accounts" :key="account.id" :value="account.id">
            {{ account.nickname || account.uid || account.platform }} / {{ platformLabel(account.platform) }}
          </option>
        </select>
      </label>
      <label>
        <span>复盘报告</span>
        <select v-model.number="profileForm.review_report_id">
          <option :value="0">使用最近复盘</option>
          <option v-for="report in profileReviewReports" :key="report.id" :value="report.id">
            {{ formatDate(report.created_at) }} / {{ report.works_count }} 作品
          </option>
        </select>
      </label>
      <label>
        <span>肖像 Agent</span>
        <select v-model.number="profileForm.agent_id">
          <option :value="0">默认肖像 Agent</option>
          <option v-for="config in profileAgents" :key="config.id" :value="config.id">
            {{ config.name }}
          </option>
        </select>
      </label>
      <button class="primary" @click="generateProfile" :disabled="profileBusy">
        {{ profileBusy ? '鉴定中' : '生成肖像' }}
      </button>
    </div>
    <section class="review-history">
      <div class="panel-title compact-title">
        <h2>肖像历史</h2>
      </div>
      <div v-if="profileReports.length === 0" class="empty compact-empty">
        暂无账号肖像历史
      </div>
      <div v-else class="table">
        <div class="table-row review-history-row table-head">
          <span>时间</span>
          <span>Agent</span>
          <span>模型</span>
          <span>作品数</span>
          <span>状态</span>
          <span>操作</span>
        </div>
        <div v-for="report in pageItems(profileReports, 'profileReports')" :key="report.id" class="table-row review-history-row">
          <span>{{ formatDate(report.created_at) }}</span>
          <span>{{ report.agent_name || '-' }}</span>
          <span>{{ report.provider }} / {{ report.model }}</span>
          <span>{{ report.works_count }}</span>
          <span>
            <span v-if="selectedProfileReportId === report.id" class="status-badge status-published">查看中</span>
            <template v-else>-</template>
          </span>
          <span class="row-actions">
            <button class="text-button" @click="selectProfileReport(report)">查看</button>
            <button class="text-button danger" @click="removeProfileReport(report)">删除</button>
          </span>
        </div>
      </div>
      <PaginationBar
        v-if="shouldShowPagination(profileReports, 'profileReports')"
        v-model:page="pagination.profileReports.page"
        v-model:page-size="pagination.profileReports.pageSize"
        :total="profileReports.length"
      />
    </section>
    <div v-if="dashboard.accounts.length === 0" class="empty">
      暂无账号，请先完成账号登录。
    </div>
    <div v-else-if="!profileResult" class="empty">
      选择账号后生成账号肖像。
    </div>
  </section>
</template>

<script setup lang="ts">
import { inject, type Ref } from 'vue'
import PaginationBar from '../../components/PaginationBar.vue'
import { appContextKey } from '../appContext'

const app = inject(appContextKey)
if (!app) {
  throw new Error('AccountProfilePage 缺少 appContext')
}

const dashboard = app.dashboard
const pagination = app.pagination
const profileStatusText = app.profileStatusText as Ref<string>
const profileForm = app.profileForm
const profileReviewReports = app.profileReviewReports as Ref<any[]>
const profileAgents = app.profileAgents as Ref<any[]>
const profileBusy = app.profileBusy as Ref<boolean>
const profileReports = app.profileReports as Ref<any[]>
const selectedProfileReportId = app.selectedProfileReportId as Ref<number>
const profileResult = app.profileResult
const loadProfileContext = app.loadProfileContext
const generateProfile = app.generateProfile
const selectProfileReport = app.selectProfileReport
const removeProfileReport = app.removeProfileReport
const pageItems = app.pageItems
const shouldShowPagination = app.shouldShowPagination
const formatDate = app.formatDate
const platformLabel = app.platformLabel
</script>
