<!--
实现逻辑：
1. 展示发布任务诊断信息，包括状态、运行目录、截图、平台返回和日志。
2. 关闭弹框时调用发布模块的清理方法，避免残留旧任务详情。
3. 只负责诊断展示，不改变发布任务执行状态。
-->

<template>
  <div v-if="selectedDiagnostics" class="modal-backdrop" @click.self="clearDiagnostics">
    <section class="work-content-modal diagnostics-modal" role="dialog" aria-modal="true">
      <div class="work-content-header">
        <div class="modal-title-block">
          <h4>任务详情</h4>
          <p>任务 ID {{ selectedDiagnostics.task_id }}</p>
        </div>
        <button class="text-button" @click="clearDiagnostics">关闭</button>
      </div>
      <div class="diagnostics-grid">
        <span>状态</span>
        <strong>{{ taskStatusLabel(selectedDiagnostics.status) }}</strong>
        <span>运行目录</span>
        <strong>{{ selectedDiagnostics.run_dir || '-' }}</strong>
        <span>执行结果</span>
        <strong>{{ selectedDiagnostics.result?.success ? '成功' : '失败或未返回' }}</strong>
        <span>发布时间</span>
        <strong>{{ selectedDiagnostics.result?.published_at ? formatDate(selectedDiagnostics.result.published_at) : '-' }}</strong>
        <span>平台链接</span>
        <strong>
          <a
            v-if="selectedDiagnostics.result?.platform_url"
            class="source-link inline-source-link"
            :href="selectedDiagnostics.result.platform_url"
            target="_blank"
            rel="noreferrer"
          >
            {{ selectedDiagnostics.result.platform_url }}
          </a>
          <template v-else>-</template>
        </strong>
        <span>截图</span>
        <strong class="screenshot-list">
          <span v-if="selectedDiagnostics.screenshots.length === 0">无</span>
          <template v-else>
            <a
              v-for="screenshot in selectedDiagnostics.screenshots"
              :key="screenshot"
              :href="screenshot"
              target="_blank"
              rel="noreferrer"
            >
              {{ screenshot.split('/').pop() || screenshot }}
            </a>
          </template>
        </strong>
      </div>
      <div v-if="selectedDiagnostics.result?.error_message" class="diagnostics-block">
        <h4>错误信息</h4>
        <pre>{{ selectedDiagnostics.result.error_message }}</pre>
      </div>
      <div v-if="selectedDiagnostics.result?.raw_response" class="diagnostics-block">
        <h4>平台返回</h4>
        <pre>{{ JSON.stringify(selectedDiagnostics.result.raw_response, null, 2) }}</pre>
      </div>
      <div class="diagnostics-block">
        <h4>运行日志</h4>
        <pre>{{ selectedDiagnostics.logs || '暂无日志' }}</pre>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { inject, type Ref } from 'vue'
import { appContextKey } from '../appContext'

const app = inject(appContextKey)
if (!app) {
  throw new Error('DiagnosticsModal 缺少 appContext')
}

const selectedDiagnostics = app.selectedDiagnostics as Ref<any>
const clearDiagnostics = app.clearDiagnostics
const taskStatusLabel = app.taskStatusLabel
const formatDate = app.formatDate
</script>
