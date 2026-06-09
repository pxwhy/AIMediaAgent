<!--
实现逻辑：
1. 承载编辑 Skill 的弹框表单，展示当前 Skill 配置并提交更新。
2. 编辑弹框和新增弹框职责分离，便于后续独立维护 Skill 表单交互。
-->

<template>
  <div class="modal-backdrop" @click.self="closeSkillModal">
    <section class="skill-config-modal" role="dialog" aria-modal="true">
      <div class="work-content-header">
        <h4>编辑 Skill</h4>
        <button class="text-button" @click="closeSkillModal">关闭</button>
      </div>
      <div class="model-config-block modal-form-block">
        <label>
          <span>Skill 名称</span>
          <input v-model.trim="skillForm.name" />
        </label>
        <label>
          <span>Skill 类型</span>
          <select v-model="skillForm.skill_type">
            <option value="prompt">Prompt</option>
          </select>
        </label>
        <label>
          <span>描述</span>
          <input v-model.trim="skillForm.description" />
        </label>
        <label class="inline-check">
          <input v-model="skillForm.enabled" type="checkbox" />
          <span>启用</span>
        </label>
      </div>
      <div class="agent-prompt-block">
        <label class="stacked-field">
          <span>Skill 内容</span>
          <textarea v-model="skillForm.content" rows="10"></textarea>
        </label>
        <div class="model-actions">
          <button class="primary" @click="saveSkill" :disabled="skillBusy">保存 Skill</button>
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
  throw new Error('SkillEdit 缺少 appContext')
}

const skillBusy = app.skillBusy as Ref<boolean>
const skillForm = app.skillForm
const closeSkillModal = app.closeSkillModal
const saveSkill = app.saveSkill
</script>
