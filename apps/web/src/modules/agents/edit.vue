<!--
实现逻辑：
1. 承载编辑 Agent 的弹框表单，展示当前 Agent 配置并提交更新。
2. 编辑弹框和新增弹框职责分离，便于后续独立维护 Agent 表单交互。
-->

<template>
  <div class="modal-backdrop" @click.self="closeAgentModal">
    <section class="agent-config-modal" role="dialog" aria-modal="true">
      <div class="work-content-header">
        <h4>编辑 Agent</h4>
        <button class="text-button" @click="closeAgentModal">关闭</button>
      </div>
      <div class="model-config-block modal-form-block">
        <label>
          <span>Agent 名称</span>
          <input v-model.trim="agentForm.name" />
        </label>
        <label>
          <span>Agent 类型</span>
          <select v-model="agentForm.agent_type" @change="syncAgentDefaults">
            <option value="account_review">账号复盘</option>
            <option value="content_selection">素材挑选</option>
            <option value="account_profile">账号肖像</option>
          </select>
        </label>
        <label>
          <span>绑定模型</span>
          <select v-model.number="agentForm.model_config_id">
            <option :value="0">全局默认模型</option>
            <option v-for="config in modelConfigs" :key="config.id" :value="config.id">
              {{ config.name }} / {{ config.model }}
            </option>
          </select>
        </label>
        <label class="inline-check">
          <input v-model="agentForm.enabled" type="checkbox" />
          <span>启用</span>
        </label>
        <label class="inline-check">
          <input v-model="agentForm.is_default" type="checkbox" />
          <span>设为默认</span>
        </label>
      </div>
      <section class="skill-picker">
        <div class="skill-picker-title">
          <span>绑定 Skills</span>
          <strong>{{ agentForm.skill_paths.length }} 个</strong>
        </div>
        <div v-if="localSkills.length === 0" class="empty compact-empty">
          暂无 Skills
        </div>
        <label v-for="skill in localSkills" v-else :key="skill.relative_path" class="skill-check">
          <input v-model="agentForm.skill_paths" type="checkbox" :value="skill.relative_path" />
          <span>{{ skill.name }}</span>
          <small>{{ skill.description || skill.relative_path }}</small>
        </label>
      </section>
      <div class="agent-prompt-block">
        <label class="stacked-field">
          <span>System Prompt</span>
          <textarea v-model="agentForm.system_prompt" rows="4"></textarea>
        </label>
        <label class="stacked-field">
          <span>User Prompt</span>
          <textarea v-model="agentForm.user_prompt_template" rows="8"></textarea>
        </label>
        <div class="model-actions">
          <button class="primary" @click="saveAgent" :disabled="agentBusy">保存 Agent</button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { inject, type Ref } from 'vue'
import { appContextKey } from '../appContext'

const app = inject<any>(appContextKey)
if (!app) {
  throw new Error('AgentEdit 缺少 appContext')
}

const agentBusy = app.agentBusy as Ref<boolean>
const agentForm = app.agentForm
const modelConfigs = app.modelConfigs as Ref<any[]>
const localSkills = app.localSkills as Ref<any[]>
const closeAgentModal = app.closeAgentModal
const syncAgentDefaults = app.syncAgentDefaults
const saveAgent = app.saveAgent
</script>
