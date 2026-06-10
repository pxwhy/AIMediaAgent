<!--
实现逻辑：
1. 承载发布任务列表、打开编辑器、自动发布和任务状态操作。
2. 新增发布入口由 App 层的发布弹框承接，本页只负责发布任务工作台主体。
-->

<template>
  <section class="panel">
    <div class="model-toolbar">
      <span>管理待发布、发布中和失败任务。</span>
      <button class="primary" @click="openCreatePublishModal" :disabled="publisherBusy">新增发布</button>
    </div>

    <div class="panel-title compact-title">
      <h2>发布任务</h2>
    </div>
    <div v-if="dashboard.publishTasks.length === 0" class="empty">
      暂无发布任务
    </div>
    <div v-else class="table">
      <div class="table-row publish-table-head">
        <span>平台</span>
        <span>草稿</span>
        <span>状态</span>
        <span>时间</span>
        <span>操作</span>
      </div>
      <div v-for="task in pageItems(dashboard.publishTasks, 'publishTasks')" :key="task.id" class="table-row publish-table-row">
        <span>{{ platformLabel(task.platform) }}</span>
        <span>{{ draftTitle(task.draft_id) }}</span>
        <span class="status-badge" :class="taskStatusClass(task.status)">
          {{ taskStatusLabel(task.status) }}
        </span>
        <span>{{ formatDate(task.created_at) }}</span>
        <span class="row-actions task-actions">
          <button
            v-if="canShowOpenEditor(task.status)"
            class="text-button"
            @click="openEditor(task)"
            :disabled="publisherBusy"
          >
            打开
          </button>
          <button
            v-if="canShowAutoPublish(task)"
            class="text-button danger"
            @click="autoPublish(task)"
            :disabled="publisherBusy"
          >
            自动发布
          </button>
          <button
            v-if="canShowPublishingActions(task.status)"
            class="text-button"
            @click="markPublished(task.id)"
          >
            已发布
          </button>
          <button
            v-if="canShowPublishingActions(task.status)"
            class="text-button"
            @click="markFailed(task.id)"
          >
            失败
          </button>
          <button
            v-if="canShowPublishingActions(task.status)"
            class="text-button"
            @click="cancelTask(task.id)"
          >
            取消
          </button>
          <button class="text-button" @click="showTaskDiagnostics(task.id)" :disabled="publisherBusy">
            详情
          </button>
          <button class="text-button danger" @click="removeTask(task.id)">删除</button>
        </span>
      </div>
    </div>
    <PaginationBar
      v-if="shouldShowPagination(dashboard.publishTasks, 'publishTasks')"
      v-model:page="pagination.publishTasks.page"
      v-model:page-size="pagination.publishTasks.pageSize"
      :total="dashboard.publishTasks.length"
    />
  </section>
</template>

<script setup lang="ts">
import { inject, type Ref } from 'vue'
import PaginationBar from '../../components/PaginationBar.vue'
import { appContextKey } from '../appContext'

const app = inject(appContextKey)
if (!app) {
  throw new Error('PublisherPage 缺少 appContext')
}

const dashboard = app.dashboard
const publisherBusy = app.publisherBusy as Ref<boolean>
const pagination = app.pagination
const pageItems = app.pageItems
const shouldShowPagination = app.shouldShowPagination
const openCreatePublishModal = app.openCreatePublishModal
const platformLabel = app.platformLabel
const draftTitle = app.draftTitle
const taskStatusClass = app.taskStatusClass
const taskStatusLabel = app.taskStatusLabel
const formatDate = app.formatDate
const canShowOpenEditor = app.canShowOpenEditor
const openEditor = app.openEditor
const canShowAutoPublish = app.canShowAutoPublish
const autoPublish = app.autoPublish
const canShowPublishingActions = app.canShowPublishingActions
const markPublished = app.markPublished
const markFailed = app.markFailed
const cancelTask = app.cancelTask
const showTaskDiagnostics = app.showTaskDiagnostics
const removeTask = app.removeTask
</script>
