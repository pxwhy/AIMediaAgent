<!--
实现逻辑：
1. 承载新增发布任务弹框，选择素材和账号后创建发布任务。
2. 素材载入、草稿同步和创建发布复用 publisher 模块方法。
3. 弹框关闭和提交状态从 appContext 注入，避免列表页内联大表单。
-->

<template>
  <div v-if="publishModalOpen" class="modal-backdrop" @click.self="closePublishModal">
    <section class="publish-config-modal" role="dialog" aria-modal="true">
      <div class="work-content-header sticky-modal-header">
        <div class="modal-title-block">
          <h4>新增发布</h4>
          <p>选择素材和账号后创建发布任务</p>
        </div>
        <button class="text-button" @click="closePublishModal">关闭</button>
      </div>
      <div class="publisher-grid">
        <section class="publisher-builder">
          <div class="form-grid">
            <label>
              <span>素材</span>
              <select v-model.number="publishForm.raw_content_id" @change="syncPublishDraftForm">
                <option :value="0">请选择素材</option>
                <option v-for="content in dashboard.rawContents" :key="content.id" :value="content.id">
                  {{ content.title }}
                </option>
              </select>
            </label>
            <label>
              <span>账号</span>
              <select v-model.number="publishForm.account_id">
                <option :value="0">请选择账号</option>
                <option v-for="account in dashboard.accounts" :key="account.id" :value="account.id">
                  {{ account.nickname }} / {{ platformLabel(account.platform) }}
                </option>
              </select>
            </label>
          </div>
          <label class="stacked-field">
            <span>标题</span>
            <input v-model.trim="publishForm.title" placeholder="发布标题" />
          </label>
          <label class="stacked-field">
            <span>正文</span>
            <textarea v-model="publishForm.content" rows="12" placeholder="发布正文"></textarea>
          </label>
          <div class="row-actions end-actions">
            <button class="secondary" @click="syncPublishDraftForm">载入素材</button>
            <button class="primary" @click="createPublisherTask" :disabled="publisherBusy">
              {{ publisherBusy ? '创建中' : '创建发布任务' }}
            </button>
          </div>
        </section>

        <section class="publisher-preview">
          <h3>草稿预览</h3>
          <h2>{{ publishForm.title || '未选择素材' }}</h2>
          <p>{{ publishForm.content || '暂无正文' }}</p>
        </section>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { inject, type Ref } from 'vue'
import { appContextKey } from '../appContext'

const app = inject(appContextKey)
if (!app) {
  throw new Error('PublishCreateModal 缺少 appContext')
}

const dashboard = app.dashboard
const publishModalOpen = app.publishModalOpen as Ref<boolean>
const closePublishModal = app.closePublishModal
const publishForm = app.publishForm
const syncPublishDraftForm = app.syncPublishDraftForm
const platformLabel = app.platformLabel
const createPublisherTask = app.createPublisherTask
const publisherBusy = app.publisherBusy as Ref<boolean>
</script>
