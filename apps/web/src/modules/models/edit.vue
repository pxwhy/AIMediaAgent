<!--
实现逻辑：
1. 承载编辑模型的弹框表单，展示当前模型配置并提交更新。
2. 编辑弹框和新增弹框职责分离，便于后续按模块独立维护表单交互。
-->

<template>
  <div class="modal-backdrop" @click.self="closeModelModal">
    <section class="model-config-modal" role="dialog" aria-modal="true">
      <div class="work-content-header">
        <h4>编辑模型</h4>
        <button class="text-button" @click="closeModelModal">关闭</button>
      </div>
      <div class="model-config-block modal-form-block">
        <label>
          <span>配置名称</span>
          <input v-model.trim="modelForm.name" />
        </label>
        <label>
          <span>模型类型</span>
          <select v-model="modelForm.provider" @change="syncModelDefaults">
            <option value="deepseek">DeepSeek</option>
            <option value="other">其他模型</option>
          </select>
        </label>
        <label>
          <span>API Key</span>
          <input v-model.trim="modelForm.api_key" type="password" :placeholder="modelKeyPlaceholder" />
        </label>
        <label>
          <span>Base URL</span>
          <input v-model.trim="modelForm.base_url" placeholder="https://api.deepseek.com" />
        </label>
        <label>
          <span>Model</span>
          <input v-model.trim="modelForm.model" placeholder="deepseek-chat" />
        </label>
        <label>
          <span>Temperature</span>
          <input v-model.number="modelForm.temperature" type="number" min="0" max="2" step="0.1" />
        </label>
        <label>
          <span>Timeout 秒数</span>
          <input v-model.number="modelForm.timeout_seconds" type="number" min="5" max="300" />
        </label>
        <label class="inline-check">
          <input v-model="modelForm.is_default" type="checkbox" />
          <span>设为全局默认</span>
        </label>
      </div>
      <div class="model-test-panel">
        <textarea v-model="modelTestPrompt" rows="4" placeholder="输入测试提示词"></textarea>
        <div class="model-actions">
          <button class="primary" @click="saveModels" :disabled="modelBusy">保存模型</button>
          <button class="secondary" @click="runModelTest" :disabled="modelBusy">测试模型</button>
        </div>
        <pre v-if="modelTestResult">{{ modelTestResult }}</pre>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { inject, type Ref } from 'vue'
import { appContextKey } from '../appContext'

const app = inject(appContextKey)
if (!app) {
  throw new Error('ModelEdit 缺少 appContext')
}

const modelBusy = app.modelBusy as Ref<boolean>
const modelForm = app.modelForm
const modelKeyPlaceholder = app.modelKeyPlaceholder
const modelTestPrompt = app.modelTestPrompt as Ref<string>
const modelTestResult = app.modelTestResult as Ref<string>
const closeModelModal = app.closeModelModal
const syncModelDefaults = app.syncModelDefaults
const saveModels = app.saveModels
const runModelTest = app.runModelTest
</script>
