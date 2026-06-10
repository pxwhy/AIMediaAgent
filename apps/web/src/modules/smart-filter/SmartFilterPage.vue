<!--
实现逻辑：
1. 承载账号肖像/复盘驱动的智能筛选页面。
2. 只筛选已有素材库内容，并展示候选、筛选结果和批量删除操作。
-->

<template>
  <section class="panel">
    <div class="panel-title">
      <h2>智能筛选</h2>
      <span>{{ statusText }}</span>
    </div>
    <div class="collector-selection-toolbar smart-filter-toolbar">
      <label class="selection-agent-field">
        <span>账号</span>
        <select v-model.number="smartFilterAccountId" @change="loadSmartFilterContext">
          <option :value="0">请选择账号</option>
          <option v-for="account in dashboard.accounts" :key="account.id" :value="account.id">
            {{ account.nickname || account.uid || account.platform }}
          </option>
        </select>
      </label>
      <label class="selection-agent-field">
        <span>账号肖像</span>
        <select v-model.number="contentSelectionProfileReportId">
          <option :value="0">使用最近肖像</option>
          <option v-for="profile in contentSelectionProfileReports" :key="profile.id" :value="profile.id">
            {{ formatDate(profile.created_at) }}
          </option>
        </select>
      </label>
      <label class="selection-agent-field">
        <span>挑选 Agent</span>
        <select v-model.number="contentSelectionAgentId">
          <option :value="0">默认挑选 Agent</option>
          <option v-for="config in contentSelectionAgents" :key="config.id" :value="config.id">
            {{ config.name }}
          </option>
        </select>
      </label>
      <label class="selection-agent-field">
        <span>复盘备用</span>
        <select v-model.number="contentSelectionReviewReportId">
          <option :value="0">使用最近复盘</option>
          <option v-for="report in contentSelectionReviewReports" :key="report.id" :value="report.id">
            {{ selectionReviewLabel(report) }}
          </option>
        </select>
      </label>
      <div class="selection-actions">
        <button
          class="primary"
          @click="runContentSelection"
          :disabled="contentSelectionBusy || !canRunContentSelection"
        >
          {{ contentSelectionBusy ? '筛选中' : '智能筛选' }}
        </button>
      </div>
    </div>

    <div v-if="contentSelectionStats.started" class="selection-stats">
      <span>依据：{{ contentSelectionStats.basis || '-' }}</span>
      <span>数据源：{{ contentSelectionStats.targets }}</span>
      <span>命中候选：{{ contentSelectionStats.candidates }}</span>
      <span>推荐：{{ contentSelectionRecommendedCount }}</span>
    </div>

    <section class="review-history">
      <div class="panel-title compact-title">
        <h2>筛选历史</h2>
      </div>
      <div v-if="contentSelectionHistory.length === 0" class="empty compact-empty">
        暂无智能筛选记录
      </div>
      <div v-else class="table">
        <div class="table-row selection-history-row table-head">
          <span>时间</span>
          <span>依据</span>
          <span>Agent</span>
          <span>模型</span>
          <span>候选</span>
          <span>推荐</span>
          <span>操作</span>
        </div>
        <div
          v-for="run in pageItems(contentSelectionHistory, 'selectionHistory')"
          :key="run.id || run.created_at"
          class="table-row selection-history-row"
        >
          <span>{{ formatDate(run.created_at || '') }}</span>
          <span>{{ run.basis || '-' }}</span>
          <span>{{ run.agent_name || '-' }}</span>
          <span>{{ run.provider }} / {{ run.model }}</span>
          <span>{{ run.candidates_count }}</span>
          <span>{{ run.recommended_count }}</span>
          <span class="row-actions">
            <button class="text-button" @click="selectContentSelectionRun(run)">查看</button>
            <button class="text-button danger" @click="removeContentSelectionRun(run)" :disabled="contentSelectionBusy">删除</button>
          </span>
        </div>
      </div>
      <PaginationBar
        v-if="shouldShowPagination(contentSelectionHistory, 'selectionHistory')"
        v-model:page="pagination.selectionHistory.page"
        v-model:page-size="pagination.selectionHistory.pageSize"
        :total="contentSelectionHistory.length"
      />
    </section>

    <div class="panel-title compact-title">
      <h2>素材候选</h2>
    </div>
    <div v-if="dashboard.rawContents.length === 0" class="empty">
      暂无采集内容，选择复盘后可直接智能筛选。
    </div>
    <template v-else>
      <div class="collector-selection-toolbar raw-content-toolbar">
        <div class="selection-actions">
          <button
            class="text-button danger"
            @click="removeSelectedRawContents"
            :disabled="selectedRawContentIds.length === 0"
          >
            批量删除{{ selectedRawContentIds.length ? `（${selectedRawContentIds.length}）` : '' }}
          </button>
        </div>
      </div>
      <div class="table">
        <div class="table-row collector-table-head">
          <span class="checkbox-cell">
            <input v-model="allRawContentsSelected" type="checkbox" />
          </span>
          <span>来源</span>
          <span>标题</span>
          <span>状态</span>
          <span>时间</span>
          <span>操作</span>
        </div>
        <div v-for="content in pageItems(dashboard.rawContents, 'rawContents')" :key="content.id" class="table-row collector-table-row">
          <span class="checkbox-cell">
            <input v-model="selectedRawContentIds" type="checkbox" :value="content.id" />
          </span>
          <span>{{ rawContentSourceLabel(content.source) }}</span>
          <span>{{ content.title }}</span>
          <span>{{ rawContentStatusLabel(content.status) }}</span>
          <span>{{ formatDate(content.created_at) }}</span>
          <span class="row-actions">
            <button class="text-button" @click="selectedRawContent = content">查看</button>
          </span>
        </div>
      </div>
      <PaginationBar
        v-if="shouldShowPagination(dashboard.rawContents, 'rawContents')"
        v-model:page="pagination.rawContents.page"
        v-model:page-size="pagination.rawContents.pageSize"
        :total="dashboard.rawContents.length"
      />
    </template>

    <section v-if="contentSelectionResult" class="selection-result-panel">
      <div class="panel-title compact-title">
        <h2>筛选结果</h2>
      </div>
      <div class="result-filter-tabs">
        <button
          :class="{ active: contentSelectionResultFilter === 'all' }"
          @click="contentSelectionResultFilter = 'all'"
        >
          全部
        </button>
        <button
          :class="{ active: contentSelectionResultFilter === 'selected' }"
          @click="contentSelectionResultFilter = 'selected'"
        >
          建议选择
        </button>
        <button
          :class="{ active: contentSelectionResultFilter === 'rejected' }"
          @click="contentSelectionResultFilter = 'rejected'"
        >
          不建议
        </button>
      </div>
      <div class="selection-result-list">
        <article
          v-for="item in pageItems(filteredContentSelectionResults, 'selectionResults')"
          :key="item.raw_content_id"
          class="selection-result-item"
        >
          <div class="selection-result-main">
            <strong>{{ rawContentTitle(item.raw_content_id) }}</strong>
            <p>{{ item.reason || '-' }}</p>
            <small v-if="item.suggested_angle">角度：{{ item.suggested_angle }}</small>
            <small v-if="item.suggested_title">标题：{{ item.suggested_title }}</small>
            <small v-if="item.data_limits.length">限制：{{ item.data_limits.join('、') }}</small>
          </div>
          <div class="selection-result-meta">
            <span class="status-badge" :class="selectionResultClass(item)">
              {{ item.selected ? '建议选择' : '不建议' }}
            </span>
            <strong>{{ item.score }}</strong>
            <small>{{ selectionRiskLabel(item.risk) }}</small>
          </div>
        </article>
      </div>
      <PaginationBar
        v-if="shouldShowPagination(filteredContentSelectionResults, 'selectionResults')"
        v-model:page="pagination.selectionResults.page"
        v-model:page-size="pagination.selectionResults.pageSize"
        :total="filteredContentSelectionResults.length"
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
  throw new Error('SmartFilterPage 缺少 appContext')
}

const dashboard = app.dashboard
const statusText = app.statusText as Ref<string>
const selectedRawContent = app.selectedRawContent as Ref<any>
const selectedRawContentIds = app.selectedRawContentIds as Ref<number[]>
const smartFilterAccountId = app.smartFilterAccountId as Ref<number>
const contentSelectionBusy = app.contentSelectionBusy as Ref<boolean>
const contentSelectionAgentId = app.contentSelectionAgentId as Ref<number>
const contentSelectionProfileReportId = app.contentSelectionProfileReportId as Ref<number>
const contentSelectionReviewReportId = app.contentSelectionReviewReportId as Ref<number>
const contentSelectionResult = app.contentSelectionResult as Ref<any>
const contentSelectionHistory = app.contentSelectionHistory as Ref<any[]>
const contentSelectionProfileReports = app.contentSelectionProfileReports as Ref<any[]>
const contentSelectionReviewReports = app.contentSelectionReviewReports as Ref<any[]>
const contentSelectionResultFilter = app.contentSelectionResultFilter as Ref<'all' | 'selected' | 'rejected'>
const contentSelectionStats = app.contentSelectionStats
const contentSelectionAgents = app.contentSelectionAgents
const canRunContentSelection = app.canRunContentSelection
const filteredContentSelectionResults = app.filteredContentSelectionResults
const contentSelectionRecommendedCount = app.contentSelectionRecommendedCount
const allRawContentsSelected = app.allRawContentsSelected
const pagination = app.pagination
const pageItems = app.pageItems
const shouldShowPagination = app.shouldShowPagination
const loadSmartFilterContext = app.loadSmartFilterContext
const selectionReviewLabel = app.selectionReviewLabel
const runContentSelection = app.runContentSelection
const selectContentSelectionRun = app.selectContentSelectionRun
const removeContentSelectionRun = app.removeContentSelectionRun
const removeSelectedRawContents = app.removeSelectedRawContents
const rawContentSourceLabel = app.rawContentSourceLabel
const rawContentStatusLabel = app.rawContentStatusLabel
const formatDate = app.formatDate
const rawContentTitle = app.rawContentTitle
const selectionResultClass = app.selectionResultClass
const selectionRiskLabel = app.selectionRiskLabel
</script>
