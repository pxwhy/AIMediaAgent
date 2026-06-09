/*
实现逻辑：
1. 管理 Skills 配置列表、本地目录读取、编辑弹框和删除操作。
2. Skills 是独立能力模块，页面只负责查看目录、编辑配置和触发同步，不直接参与账号登录态或发布任务。
3. Skill 删除后通过回调刷新 Agent 列表，保证绑定关系展示保持最新。
*/

import { reactive, ref } from 'vue'
import {
  deleteSkillConfig,
  loadLocalSkills,
  loadSkillConfigs,
  reloadLocalSkills,
  updateSkillConfig,
  type LocalSkill,
  type SkillConfig
} from '../../api/client'

type SkillsDependencies = {
  readableError: (error: unknown, fallback?: string) => string
  refreshAgents: () => Promise<void>
}

export function createSkillsContext(deps: SkillsDependencies) {
  const skillBusy = ref(false)
  const skillStatusText = ref('等待加载')
  const skillConfigs = ref<SkillConfig[]>([])
  const skillModalOpen = ref(false)
  const localSkillsRoot = ref('')
  const localSkills = ref<LocalSkill[]>([])
  const selectedLocalSkill = ref<LocalSkill | null>(null)
  const skillForm = reactive({
    id: 0,
    name: '',
    skill_type: 'prompt' as 'prompt',
    description: '',
    content: '',
    enabled: true
  })

  async function loadSkills() {
    skillStatusText.value = '加载中'
    try {
      skillConfigs.value = await loadSkillConfigs()
      const payload = await loadLocalSkills()
      localSkillsRoot.value = payload.root
      localSkills.value = payload.skills
      skillStatusText.value = 'Skills 已加载'
    } catch (error) {
      console.error(error)
      skillStatusText.value = 'Skills 列表加载失败'
    }
  }

  async function reloadSkillsDirectory() {
    skillBusy.value = true
    skillStatusText.value = '正在读取目录'
    try {
      const payload = await reloadLocalSkills()
      localSkillsRoot.value = payload.root
      localSkills.value = payload.skills
      selectedLocalSkill.value = null
      skillStatusText.value = `已读取 ${payload.skills.length} 个 Skill`
    } catch (error) {
      console.error(error)
      skillStatusText.value = deps.readableError(error, '读取 Skills 目录失败')
    } finally {
      skillBusy.value = false
    }
  }

  async function saveSkill() {
    if (!skillForm.id) {
      skillStatusText.value = '请选择要编辑的 Skill'
      return
    }
    skillBusy.value = true
    skillStatusText.value = '正在保存 Skill'
    try {
      const payload = {
        name: skillForm.name,
        skill_type: skillForm.skill_type,
        description: skillForm.description,
        content: skillForm.content,
        enabled: skillForm.enabled
      }
      const config = await updateSkillConfig(skillForm.id, payload)
      await loadSkills()
      editSkill(config)
      closeSkillModal()
      skillStatusText.value = 'Skill 已保存'
    } catch (error) {
      console.error(error)
      skillStatusText.value = deps.readableError(error, 'Skill 保存失败')
    } finally {
      skillBusy.value = false
    }
  }

  function openEditSkillModal(config: SkillConfig) {
    editSkill(config)
    skillModalOpen.value = true
  }

  function closeSkillModal() {
    skillModalOpen.value = false
  }

  function editSkill(config: SkillConfig) {
    skillForm.id = config.id
    skillForm.name = config.name
    skillForm.skill_type = config.skill_type
    skillForm.description = config.description
    skillForm.content = config.content
    skillForm.enabled = config.enabled
  }

  function resetSkillForm() {
    skillForm.id = 0
    skillForm.name = ''
    skillForm.skill_type = 'prompt'
    skillForm.description = ''
    skillForm.content = ''
    skillForm.enabled = true
  }

  async function removeSkill(config: SkillConfig) {
    if (!window.confirm(`确认删除 Skill「${config.name}」吗？`)) {
      return
    }
    skillBusy.value = true
    skillStatusText.value = '正在删除 Skill'
    try {
      await deleteSkillConfig(config.id)
      if (skillForm.id === config.id) {
        resetSkillForm()
      }
      await Promise.all([loadSkills(), deps.refreshAgents()])
      skillStatusText.value = 'Skill 已删除'
    } catch (error) {
      console.error(error)
      skillStatusText.value = deps.readableError(error, 'Skill 删除失败')
    } finally {
      skillBusy.value = false
    }
  }

  return {
    skillBusy,
    skillStatusText,
    skillConfigs,
    skillModalOpen,
    localSkillsRoot,
    localSkills,
    selectedLocalSkill,
    skillForm,
    loadSkills,
    reloadSkillsDirectory,
    saveSkill,
    openEditSkillModal,
    closeSkillModal,
    removeSkill
  }
}
