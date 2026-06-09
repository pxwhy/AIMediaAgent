<!--
实现逻辑：
1. 作为 Agent 模块列表入口，负责 Agent 配置表格、工具栏操作和分页展示。
2. 新增和编辑表单按职责拆到 add/edit 弹框组件，列表页只保留操作入口。
-->

<template>
  <section class="panel">
    <div class="panel-title compact-title">
      <h2>Agent 列表</h2>
    </div>
    <div class="model-toolbar">
      <button class="primary" @click="openCreateAgentModal" :disabled="agentBusy">新增 Agent</button>
    </div>

    <div v-if="agentConfigs.length === 0" class="empty">
      暂无 Agent 配置
    </div>
    <table v-else class="agent-config-table">
      <thead>
        <tr>
          <th>名称</th>
          <th>类型</th>
          <th>模型</th>
          <th>Skills</th>
          <th>状态</th>
          <th>默认</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="config in pageItems(agentConfigs, 'agents')" :key="config.id">
          <td>{{ config.name }}</td>
          <td>{{ agentTypeLabel(config.agent_type) }}</td>
          <td>{{ config.model_config_name }}</td>
          <td>{{ config.skill_names.length ? config.skill_names.join('、') : '-' }}</td>
          <td>{{ config.enabled ? '启用' : '禁用' }}</td>
          <td>
            <span v-if="config.is_default" class="status-badge status-published">默认</span>
            <template v-else>-</template>
          </td>
          <td>
            <span class="row-actions model-row-actions">
              <button class="text-button" @click="openEditAgentModal(config)" :disabled="agentBusy">编辑</button>
              <button class="text-button" @click="setDefaultAgent(config.id)" :disabled="agentBusy || config.is_default">
                设默认
              </button>
              <button class="text-button danger" @click="removeAgent(config)" :disabled="agentBusy">删除</button>
            </span>
          </td>
        </tr>
      </tbody>
    </table>
    <PaginationBar
      v-if="shouldShowPagination(agentConfigs, 'agents')"
      v-model:page="pagination.agents.page"
      v-model:page-size="pagination.agents.pageSize"
      :total="agentConfigs.length"
    />

    <AgentAdd v-if="agentModalOpen && !agentForm.id" />
    <AgentEdit v-if="agentModalOpen && agentForm.id" />
  </section>
</template>

<script setup lang="ts">
import { inject, type Ref } from 'vue'
import PaginationBar from '../../components/PaginationBar.vue'
import { appContextKey } from '../appContext'
import AgentAdd from './add.vue'
import AgentEdit from './edit.vue'

const app = inject<any>(appContextKey)
if (!app) {
  throw new Error('AgentsIndex 缺少 appContext')
}

const agentBusy = app.agentBusy as Ref<boolean>
const agentConfigs = app.agentConfigs as Ref<any[]>
const agentModalOpen = app.agentModalOpen as Ref<boolean>
const agentForm = app.agentForm
const pagination = app.pagination
const pageItems = app.pageItems
const shouldShowPagination = app.shouldShowPagination
const openCreateAgentModal = app.openCreateAgentModal
const openEditAgentModal = app.openEditAgentModal
const setDefaultAgent = app.setDefaultAgent
const removeAgent = app.removeAgent
const agentTypeLabel = app.agentTypeLabel
</script>
