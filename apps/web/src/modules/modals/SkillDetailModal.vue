<!--
实现逻辑：
1. 展示本地 Skill 的描述、目录和 SKILL.md 内容。
2. Skill 不在这里新增或编辑，只提供只读详情弹框。
3. 关闭时清空当前选中的本地 Skill。
-->

<template>
  <div v-if="selectedLocalSkill" class="modal-backdrop" @click.self="selectedLocalSkill = null">
    <section class="work-content-modal skill-detail-modal" role="dialog" aria-modal="true">
      <div class="work-content-header">
        <div class="modal-title-block">
          <h4>{{ selectedLocalSkill.name }}</h4>
          <p>{{ selectedLocalSkill.relative_path }}</p>
        </div>
        <button class="text-button" @click="selectedLocalSkill = null">关闭</button>
      </div>
      <div class="review-section">
        <h4>说明</h4>
        <p>{{ selectedLocalSkill.description || '暂无描述' }}</p>
        <h4>目录</h4>
        <p>{{ selectedLocalSkill.path }}</p>
      </div>
      <pre>{{ selectedLocalSkill.content }}</pre>
    </section>
  </div>
</template>

<script setup lang="ts">
import { inject, type Ref } from 'vue'
import { appContextKey } from '../appContext'

const app = inject(appContextKey)
if (!app) {
  throw new Error('SkillDetailModal 缺少 appContext')
}

const selectedLocalSkill = app.selectedLocalSkill as Ref<any>
</script>
