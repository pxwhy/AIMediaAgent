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
    <TableToolbar>
      <button class="primary" @click="openCreateModelModal" :disabled="modelBusy">新增模型</button>
    </TableToolbar>

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
          <td>
            <StatusBadge
              :label="config.api_key_configured ? '已配置' : '未配置'"
              :tone="config.api_key_configured ? 'success' : 'neutral'"
            />
          </td>
          <td>
            <StatusBadge :label="config.is_default ? '默认' : ''" tone="success" />
          </td>
          <td>
            <span class="row-actions model-row-actions">
              <button class="text-button" @click="openEditModelModal(config)" :disabled="modelBusy">编辑</button>
              <button class="text-button" @click="setDefaultModel(config.id)" :disabled="modelBusy || config.is_default">
                设默认
              </button>
              <button class="text-button danger" @click="openRemoveConfirm(config)" :disabled="modelBusy">删除</button>
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
    <ConfirmModal
      :open="Boolean(removingModel)"
      title="删除模型"
      :message="removeConfirmMessage"
      confirm-text="删除"
      busy-text="删除中"
      danger
      :busy="modelBusy"
      @cancel="closeRemoveConfirm"
      @confirm="confirmRemoveModel"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, inject, ref, type Ref } from 'vue'
import type { ModelConfig } from '../../api/client'
import ConfirmModal from '../../components/ConfirmModal.vue'
import PaginationBar from '../../components/PaginationBar.vue'
import StatusBadge from '../../components/StatusBadge.vue'
import TableToolbar from '../../components/TableToolbar.vue'
import { appContextKey } from '../appContext'
import ModelAdd from './add.vue'
import ModelEdit from './edit.vue'

const app = inject(appContextKey)
if (!app) {
  throw new Error('ModelsIndex 缺少 appContext')
}

const modelBusy = app.modelBusy as Ref<boolean>
const modelConfigs = app.modelConfigs as Ref<ModelConfig[]>
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
const removingModel = ref<ModelConfig | null>(null)
const removeConfirmMessage = computed(() =>
  removingModel.value ? `确认删除模型「${removingModel.value.name}」吗？` : ''
)

function openRemoveConfirm(config: ModelConfig) {
  removingModel.value = config
}

function closeRemoveConfirm() {
  removingModel.value = null
}

async function confirmRemoveModel() {
  if (!removingModel.value) {
    return
  }
  await removeModel(removingModel.value, { skipConfirm: true })
  closeRemoveConfirm()
}
</script>
