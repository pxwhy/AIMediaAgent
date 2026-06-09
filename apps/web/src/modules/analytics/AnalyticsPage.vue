<!--
实现逻辑：
1. 承载账号复盘入口、复盘 Agent 选择和复盘历史列表。
2. 页面只负责展示和触发操作，复盘生成、历史加载、分页和状态由共享上下文提供。
-->

<template>
  <section class="panel">
    <div class="panel-title compact-title">
      <h2>账号复盘</h2>
      <span>{{ reviewStatusText }}</span>
    </div>
    <div class="review-toolbar">
      <label>
        <span>账号</span>
        <select v-model.number="reviewForm.account_id" @change="loadReviewReports">
          <option :value="0">请选择账号</option>
          <option v-for="account in dashboard.accounts" :key="account.id" :value="account.id">
            {{ account.nickname || account.uid || account.platform }} / {{ platformLabel(account.platform) }}
          </option>
        </select>
      </label>
      <label>
        <span>复盘 Agent</span>
        <select v-model.number="reviewForm.agent_id">
          <option :value="0">默认复盘 Agent</option>
          <option v-for="config in reviewAgents" :key="config.id" :value="config.id">
            {{ config.name }}
          </option>
        </select>
      </label>
      <button class="primary" @click="generateReview" :disabled="reviewBusy">
        {{ reviewBusy ? '生成中' : '生成复盘' }}
      </button>
    </div>
    <section class="review-history">
      <div class="panel-title compact-title">
        <h2>复盘历史</h2>
      </div>
      <div v-if="reviewReports.length === 0" class="empty compact-empty">
        暂无复盘历史
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
        <div v-for="report in pageItems(reviewReports, 'reviewReports')" :key="report.id" class="table-row review-history-row">
          <span>{{ formatDate(report.created_at) }}</span>
          <span>{{ report.agent_name || '-' }}</span>
          <span>{{ report.provider }} / {{ report.model }}</span>
          <span>{{ report.works_count }}</span>
          <span>
            <span v-if="selectedReviewReportId === report.id" class="status-badge status-published">查看中</span>
            <template v-else>-</template>
          </span>
          <span class="row-actions">
            <button class="text-button" @click="selectReviewReport(report)">查看</button>
            <button class="text-button danger" @click="removeReviewReport(report)">删除</button>
          </span>
        </div>
      </div>
      <PaginationBar
        v-if="shouldShowPagination(reviewReports, 'reviewReports')"
        v-model:page="pagination.reviewReports.page"
        v-model:page-size="pagination.reviewReports.pageSize"
        :total="reviewReports.length"
      />
    </section>
    <div v-if="dashboard.accounts.length === 0" class="empty">
      暂无账号，请先完成账号登录。
    </div>
    <div v-else-if="!reviewResult" class="empty">
      选择已同步作品的账号后生成复盘。
    </div>
  </section>
</template>

<script setup lang="ts">
import { inject, type Ref } from 'vue'
import PaginationBar from '../../components/PaginationBar.vue'
import { appContextKey } from '../appContext'

const app = inject<any>(appContextKey)
if (!app) {
  throw new Error('AnalyticsPage 缺少 appContext')
}

const dashboard = app.dashboard
const pagination = app.pagination
const reviewStatusText = app.reviewStatusText as Ref<string>
const reviewForm = app.reviewForm
const reviewAgents = app.reviewAgents as Ref<any[]>
const reviewBusy = app.reviewBusy as Ref<boolean>
const reviewReports = app.reviewReports as Ref<any[]>
const selectedReviewReportId = app.selectedReviewReportId as Ref<number>
const reviewResult = app.reviewResult
const loadReviewReports = app.loadReviewReports
const generateReview = app.generateReview
const selectReviewReport = app.selectReviewReport
const removeReviewReport = app.removeReviewReport
const pageItems = app.pageItems
const shouldShowPagination = app.shouldShowPagination
const formatDate = app.formatDate
const platformLabel = app.platformLabel
</script>
