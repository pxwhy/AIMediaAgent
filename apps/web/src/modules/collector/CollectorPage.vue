<!--
实现逻辑：
1. 承载热点预览、素材导入和素材库管理两段采集业务。
2. 复用共享上下文中的采集状态、素材勾选状态、分页和删除动作。
-->

<template>
  <section class="panel">
    <div class="panel-title">
      <h2>热点预览</h2>
      <span>{{ statusText }}</span>
    </div>
    <div class="collector-toolbar">
      <label>
        <span>来源</span>
        <select v-model="collectorSourceKey" @change="syncCollectorCategory">
          <option v-for="source in collectorSources" :key="source.key" :value="source.key">
            {{ source.name }}
          </option>
        </select>
      </label>
      <label>
        <span>分类</span>
        <select v-model="collectorCategoryKey">
          <option v-for="category in collectorCategories" :key="category.key" :value="category.key">
            {{ category.name }}
          </option>
        </select>
      </label>
      <button class="primary" @click="previewCollector" :disabled="collectorBusy">
        {{ collectorBusy ? '刷新中' : '刷新热点' }}
      </button>
    </div>

    <div v-if="collectorItems.length === 0" class="empty">
      暂无热点数据
    </div>
    <div v-else class="collector-list">
      <article v-for="item in pageItems(collectorItems, 'collectorItems')" :key="item.url" class="collector-item">
        <div>
          <h3>{{ item.title }}</h3>
          <p>{{ item.summary || item.url }}</p>
        </div>
        <button
          class="secondary"
          @click="importCollector(item)"
          :disabled="importingUrl === item.url"
        >
          {{ importingUrl === item.url ? '导入中' : '导入素材库' }}
        </button>
      </article>
    </div>
    <PaginationBar
      v-if="shouldShowPagination(collectorItems, 'collectorItems')"
      v-model:page="pagination.collectorItems.page"
      v-model:page-size="pagination.collectorItems.pageSize"
      :total="collectorItems.length"
    />

    <div class="panel-title compact-title">
      <h2>素材库</h2>
    </div>
    <div v-if="dashboard.rawContents.length === 0" class="empty">
      暂无采集内容
    </div>
    <template v-else>
      <div class="collector-selection-toolbar raw-content-toolbar">
        <span class="selection-count">已选 {{ selectedRawContentIds.length }} 条素材</span>
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
            <button class="text-button danger" @click="removeRawContent(content)">删除</button>
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
  </section>
</template>

<script setup lang="ts">
import { inject, type Ref } from 'vue'
import PaginationBar from '../../components/PaginationBar.vue'
import { appContextKey } from '../appContext'

const app = inject<any>(appContextKey)
if (!app) {
  throw new Error('CollectorPage 缺少 appContext')
}

const dashboard = app.dashboard
const statusText = app.statusText as Ref<string>
const collectorBusy = app.collectorBusy as Ref<boolean>
const importingUrl = app.importingUrl as Ref<string>
const collectorSources = app.collectorSources as Ref<any[]>
const collectorItems = app.collectorItems as Ref<any[]>
const selectedRawContent = app.selectedRawContent as Ref<any>
const selectedRawContentIds = app.selectedRawContentIds as Ref<number[]>
const collectorSourceKey = app.collectorSourceKey as Ref<string>
const collectorCategoryKey = app.collectorCategoryKey as Ref<string>
const collectorCategories = app.collectorCategories
const pagination = app.pagination
const allRawContentsSelected = app.allRawContentsSelected
const pageItems = app.pageItems
const shouldShowPagination = app.shouldShowPagination
const syncCollectorCategory = app.syncCollectorCategory
const previewCollector = app.previewCollector
const importCollector = app.importCollector
const removeSelectedRawContents = app.removeSelectedRawContents
const rawContentSourceLabel = app.rawContentSourceLabel
const rawContentStatusLabel = app.rawContentStatusLabel
const formatDate = app.formatDate
const removeRawContent = app.removeRawContent
</script>
