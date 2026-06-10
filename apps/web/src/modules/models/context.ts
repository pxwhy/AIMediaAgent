/*
实现逻辑：
1. 管理模型配置列表、新增编辑弹框、模型测试和默认模型设置。
2. 页面只负责展示和触发操作，模型配置的保存、删除、测试请求统一收敛在本模块。
3. API Key 不从隐藏环境变量读取，只按页面显式配置状态展示和提交。
*/

import { computed, reactive, ref } from 'vue'
import {
  createModelConfig,
  deleteModelConfig,
  loadModelConfigs,
  setDefaultModelConfig,
  testModel,
  updateModelConfig,
  type ModelConfig
} from '../../api/client'

type ModelsDependencies = {
  readableError: (error: unknown, fallback?: string) => string
}

export function createModelsContext(deps: ModelsDependencies) {
  const modelBusy = ref(false)
  const modelStatusText = ref('等待加载')
  const modelTestPrompt = ref('')
  const modelTestResult = ref('')
  const modelConfigs = ref<ModelConfig[]>([])
  const modelModalOpen = ref(false)
  const modelForm = reactive({
    id: 0,
    name: '',
    provider: 'deepseek' as 'deepseek' | 'other',
    api_key: '',
    base_url: 'https://api.deepseek.com',
    model: 'deepseek-chat',
    temperature: 0.7,
    timeout_seconds: 60,
    is_default: false,
    api_key_configured: false
  })

  const modelKeyPlaceholder = computed(() =>
    modelForm.api_key_configured ? '已配置，留空则不修改' : '未配置'
  )

  async function loadModels() {
    modelStatusText.value = '加载中'
    try {
      modelConfigs.value = await loadModelConfigs()
      modelStatusText.value = '模型列表已加载'
    } catch (error) {
      console.error(error)
      modelStatusText.value = '模型列表加载失败'
    }
  }

  async function saveModels() {
    modelBusy.value = true
    modelStatusText.value = '正在保存模型'
    try {
      const payload = {
        name: modelForm.name,
        provider: modelForm.provider,
        api_key: modelForm.api_key,
        base_url: modelForm.base_url,
        model: modelForm.model,
        temperature: modelForm.temperature,
        timeout_seconds: modelForm.timeout_seconds,
        is_default: modelForm.is_default
      }
      const config = modelForm.id
        ? await updateModelConfig(modelForm.id, payload)
        : await createModelConfig(payload)
      await loadModels()
      editModel(config)
      closeModelModal()
      modelStatusText.value = '模型已保存'
    } catch (error) {
      console.error(error)
      modelStatusText.value = '模型保存失败'
    } finally {
      modelBusy.value = false
    }
  }

  function openCreateModelModal() {
    resetModelForm()
    modelModalOpen.value = true
  }

  function openEditModelModal(config: ModelConfig) {
    editModel(config)
    modelModalOpen.value = true
  }

  function closeModelModal() {
    modelModalOpen.value = false
  }

  function editModel(config: ModelConfig) {
    modelForm.id = config.id
    modelForm.name = config.name
    modelForm.provider = config.provider
    modelForm.api_key = ''
    modelForm.base_url = config.base_url
    modelForm.model = config.model
    modelForm.temperature = config.temperature
    modelForm.timeout_seconds = config.timeout_seconds
    modelForm.is_default = config.is_default
    modelForm.api_key_configured = config.api_key_configured
    modelTestResult.value = ''
  }

  function resetModelForm() {
    modelForm.id = 0
    modelForm.name = ''
    modelForm.provider = 'deepseek'
    modelForm.api_key = ''
    modelForm.base_url = 'https://api.deepseek.com'
    modelForm.model = 'deepseek-chat'
    modelForm.temperature = 0.7
    modelForm.timeout_seconds = 60
    modelForm.is_default = modelConfigs.value.length === 0
    modelForm.api_key_configured = false
    modelTestResult.value = ''
  }

  function syncModelDefaults() {
    if (modelForm.provider === 'deepseek') {
      if (!modelForm.base_url) {
        modelForm.base_url = 'https://api.deepseek.com'
      }
      if (!modelForm.model) {
        modelForm.model = 'deepseek-chat'
      }
    }
  }

  async function setDefaultModel(modelConfigId: number) {
    modelBusy.value = true
    modelStatusText.value = '正在设置默认模型'
    try {
      await setDefaultModelConfig(modelConfigId)
      await loadModels()
      modelStatusText.value = '默认模型已更新'
    } catch (error) {
      console.error(error)
      modelStatusText.value = '设置默认模型失败'
    } finally {
      modelBusy.value = false
    }
  }

  async function removeModel(config: ModelConfig, options: { skipConfirm?: boolean } = {}) {
    if (!options.skipConfirm && !window.confirm(`确认删除模型「${config.name}」吗？`)) {
      return
    }
    modelBusy.value = true
    modelStatusText.value = '正在删除模型'
    try {
      await deleteModelConfig(config.id)
      if (modelForm.id === config.id) {
        resetModelForm()
      }
      await loadModels()
      modelStatusText.value = '模型已删除'
    } catch (error) {
      console.error(error)
      modelStatusText.value = '模型删除失败'
    } finally {
      modelBusy.value = false
    }
  }

  async function runModelTest() {
    if (!modelTestPrompt.value.trim()) {
      modelStatusText.value = '请输入测试提示词'
      return
    }
    modelBusy.value = true
    modelStatusText.value = '正在测试模型'
    modelTestResult.value = ''
    try {
      const result = await testModel(modelTestPrompt.value, modelForm.id || null)
      modelTestResult.value = `${result.provider} / ${result.model}\n\n${result.content}`
      modelStatusText.value = '模型测试成功'
    } catch (error) {
      console.error(error)
      modelStatusText.value = '模型测试失败'
      modelTestResult.value = deps.readableError(error, '模型测试失败，请检查模型配置')
    } finally {
      modelBusy.value = false
    }
  }

  function modelProviderLabel(provider: string) {
    return provider === 'other' ? '其他模型' : 'DeepSeek'
  }

  return {
    modelBusy,
    modelStatusText,
    modelTestPrompt,
    modelTestResult,
    modelConfigs,
    modelModalOpen,
    modelForm,
    modelKeyPlaceholder,
    loadModels,
    saveModels,
    openCreateModelModal,
    openEditModelModal,
    closeModelModal,
    syncModelDefaults,
    setDefaultModel,
    removeModel,
    runModelTest,
    modelProviderLabel
  }
}
