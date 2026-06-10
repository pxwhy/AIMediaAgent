<!--
实现逻辑：
1. 作为 Skills 模块列表入口，负责 Skill 配置表格、工具栏操作和分页展示。
2. 编辑表单按职责拆到 edit 弹框组件，同时保留本地 Skills 目录加载能力。
-->

<template>
  <section class="panel">
    <div class="panel-title compact-title">
      <h2>Skills 列表</h2>
    </div>
    <div class="skills-local-toolbar">
      <label>
        <span>目录</span>
        <input :value="localSkillsRoot || '-'" readonly />
      </label>
      <button class="secondary" @click="reloadSkillsDirectory" :disabled="skillBusy">
        {{ skillBusy ? '加载中' : '加载目录' }}
      </button>
    </div>

    <div v-if="skillConfigs.length === 0" class="empty">
      暂无 Skill 配置
    </div>
    <table v-else class="skill-config-table">
      <thead>
        <tr>
          <th>名称</th>
          <th>类型</th>
          <th>描述</th>
          <th>状态</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="config in pageItems(skillConfigs, 'skills')" :key="config.id">
          <td>{{ config.name }}</td>
          <td>{{ config.skill_type }}</td>
          <td>{{ config.description || '-' }}</td>
          <td>{{ config.enabled ? '启用' : '禁用' }}</td>
          <td>
            <span class="row-actions model-row-actions">
              <button class="text-button" @click="openEditSkillModal(config)" :disabled="skillBusy">编辑</button>
              <button class="text-button danger" @click="removeSkill(config)" :disabled="skillBusy">删除</button>
            </span>
          </td>
        </tr>
      </tbody>
    </table>
    <PaginationBar
      v-if="shouldShowPagination(skillConfigs, 'skills')"
      v-model:page="pagination.skills.page"
      v-model:page-size="pagination.skills.pageSize"
      :total="skillConfigs.length"
    />

    <section class="review-history">
      <div class="panel-title compact-title">
        <h2>本地目录</h2>
      </div>
      <div v-if="localSkills.length === 0" class="empty compact-empty">
        当前目录暂无 SKILL.md
      </div>
      <div v-else class="table">
        <div class="table-row skill-local-row table-head">
          <span>名称</span>
          <span>描述</span>
          <span>路径</span>
          <span>操作</span>
        </div>
        <div v-for="skill in pageItems(localSkills, 'localSkills')" :key="skill.path" class="table-row skill-local-row">
          <span>{{ skill.name }}</span>
          <span>{{ skill.description || '-' }}</span>
          <span>{{ skill.path }}</span>
          <span class="row-actions">
            <button class="text-button" @click="selectedLocalSkill = skill">查看</button>
          </span>
        </div>
      </div>
      <PaginationBar
        v-if="shouldShowPagination(localSkills, 'localSkills')"
        v-model:page="pagination.localSkills.page"
        v-model:page-size="pagination.localSkills.pageSize"
        :total="localSkills.length"
      />
    </section>

    <SkillEdit v-if="skillModalOpen && skillForm.id" />
  </section>
</template>

<script setup lang="ts">
import { inject, type Ref } from 'vue'
import PaginationBar from '../../components/PaginationBar.vue'
import { appContextKey } from '../appContext'
import SkillEdit from './edit.vue'

const app = inject(appContextKey)
if (!app) {
  throw new Error('SkillsIndex 缺少 appContext')
}

const skillBusy = app.skillBusy as Ref<boolean>
const skillConfigs = app.skillConfigs as Ref<any[]>
const skillModalOpen = app.skillModalOpen as Ref<boolean>
const skillForm = app.skillForm
const localSkillsRoot = app.localSkillsRoot as Ref<string>
const localSkills = app.localSkills as Ref<any[]>
const selectedLocalSkill = app.selectedLocalSkill as Ref<any>
const pagination = app.pagination
const pageItems = app.pageItems
const shouldShowPagination = app.shouldShowPagination
const reloadSkillsDirectory = app.reloadSkillsDirectory
const openEditSkillModal = app.openEditSkillModal
const removeSkill = app.removeSkill
</script>
