<!--
实现逻辑：
1. 作为模型模块列表入口，负责模型配置表格、工具栏操作和分页展示。
2. 新增和编辑表单按职责拆到 add/edit 弹框组件，列表页只保留操作入口。
-->

<template>
  <section class="panel">
    <div class="panel-title compact-title">
      <h2>模型列表</h2>
    </div>
    <div class="model-toolbar">
      <button class="primary" @click="openCreateModelModal" :disabled="modelBusy">新增模型</button>
    </div>

    <div v-if="modelConfigs.length === 0" class="empty">
      暂无模型配置
    </div>
    <table v-else class="model-config-table">
      <thead>
        <tr>
          <th>名称</th>
          <th>类型</th>
          <th>模型</th>
          <th>API Key</th>
          <th>默认</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="config in pageItems(modelConfigs, 'models')" :key="config.id">
          <td>{{ config.name }}</td>
          <td>{{ modelProviderLabel(config.provider) }}</td>
          <td>{{ config.model || '-' }}</td>
          <td>{{ config.api_key_configured ? '已配置' : '未配置' }}</td>
          <td>
            <span v-if="config.is_default" class="status-badge status-published">默认</span>
            <template v-else>-</template>
          </td>
          <td>
            <span class="row-actions model-row-actions">
              <button class="text-button" @click="openEditModelModal(config)" :disabled="modelBusy">编辑</button>
              <button class="text-button" @click="setDefaultModel(config.id)" :disabled="modelBusy || config.is_default">
                设默认
              </button>
              <button class="text-button danger" @click="removeModel(config)" :disabled="modelBusy">删除</button>
            </span>
          </td>
        </tr>
      </tbody>
    </table>
    <PaginationBar
      v-if="shouldShowPagination(modelConfigs, 'models')"
      v-model:page="pagination.models.page"
      v-model:page-size="pagination.models.pageSize"
      :total="modelConfigs.length"
    />

    <ModelAdd v-if="modelModalOpen && !modelForm.id" />
    <ModelEdit v-if="modelModalOpen && modelForm.id" />
  </section>
</template>

<script setup lang="ts">
import { inject, type Ref } from 'vue'
import PaginationBar from '../../components/PaginationBar.vue'
import { appContextKey } from '../appContext'
import ModelAdd from './add.vue'
import ModelEdit from './edit.vue'

const app = inject<any>(appContextKey)
if (!app) {
  throw new Error('ModelsIndex 缺少 appContext')
}

const modelBusy = app.modelBusy as Ref<boolean>
const modelConfigs = app.modelConfigs as Ref<any[]>
const modelModalOpen = app.modelModalOpen as Ref<boolean>
const modelForm = app.modelForm
const pagination = app.pagination
const pageItems = app.pageItems
const shouldShowPagination = app.shouldShowPagination
const openCreateModelModal = app.openCreateModelModal
const openEditModelModal = app.openEditModelModal
const setDefaultModel = app.setDefaultModel
const removeModel = app.removeModel
const modelProviderLabel = app.modelProviderLabel
</script>
