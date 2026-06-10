<!--
实现逻辑：
1. 展示采集素材的来源、分类、图片和正文详情。
2. 图片和正文使用左右布局，避免查看内容时遮挡图片。
3. 通过 appContext 复用采集模块状态和格式化方法。
-->

<template>
  <div v-if="selectedRawContent" class="modal-backdrop" @click.self="selectedRawContent = null">
    <section class="work-content-modal detail-modal" role="dialog" aria-modal="true">
      <div class="work-content-header">
        <div class="modal-title-block">
          <h4>{{ selectedRawContent.title }}</h4>
          <p>
            {{ rawContentSourceLabel(selectedRawContent.source) }} / {{ selectedRawContent.category || '-' }} / {{ formatDate(selectedRawContent.created_at) }}
          </p>
        </div>
        <button class="text-button" @click="selectedRawContent = null">关闭</button>
      </div>
      <div class="detail-modal-body">
        <div class="detail-media-panel">
          <div v-if="selectedRawContent.images.length" class="detail-image-grid">
            <a v-for="image in selectedRawContent.images" :key="image" :href="image" target="_blank" rel="noreferrer">
              <img :src="image" :alt="selectedRawContent.title" />
            </a>
          </div>
          <div v-else class="empty compact-empty detail-media-empty">暂无图片</div>
        </div>
        <div class="detail-text-panel">
          <a v-if="selectedRawContent.source_url" class="source-link" :href="selectedRawContent.source_url" target="_blank" rel="noreferrer">
            {{ selectedRawContent.source_url }}
          </a>
          <div class="content-preview">{{ selectedRawContent.content || '暂无正文内容' }}</div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { inject, type Ref } from 'vue'
import { appContextKey } from '../appContext'

const app = inject(appContextKey)
if (!app) {
  throw new Error('RawContentDetailModal 缺少 appContext')
}

const selectedRawContent = app.selectedRawContent as Ref<any>
const rawContentSourceLabel = app.rawContentSourceLabel
const formatDate = app.formatDate
</script>
