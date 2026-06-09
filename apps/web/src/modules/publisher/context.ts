/*
实现逻辑：
1. 管理发布任务模块的新增弹框、草稿表单、任务操作和诊断详情状态。
2. 发布模块只接收仪表盘数据、状态提示和刷新函数，避免发布业务逻辑散落在 App.vue。
3. 自动发布、打开编辑器、标记状态和删除任务统一在这里处理，页面组件只负责展示与触发。
*/

import { reactive, ref } from 'vue'
import {
  autoPublishTask,
  cancelPublishTask,
  createDraftFromRawContent,
  createPublishTask,
  deletePublishTask,
  loadPublishTaskDiagnostics,
  markPublishTaskFailed,
  markPublishTaskPublished,
  openPublishEditor,
  type DashboardPayload,
  type PublishTask,
  type PublishTaskDiagnostics
} from '../../api/client'

type PublisherDependencies = {
  dashboard: DashboardPayload
  statusText: { value: string }
  refresh: () => Promise<void>
  readableError: (error: unknown, fallback?: string) => string
  platformLabel: (platform: string) => string
}

export function createPublisherContext(deps: PublisherDependencies) {
  const publisherBusy = ref(false)
  const publishModalOpen = ref(false)
  const selectedDiagnostics = ref<PublishTaskDiagnostics | null>(null)
  const publishForm = reactive({
    raw_content_id: 0,
    account_id: 0,
    title: '',
    content: ''
  })

  function syncPublishDraftForm() {
    const rawContent = deps.dashboard.rawContents.find((content) => content.id === publishForm.raw_content_id)
    if (!rawContent) {
      publishForm.title = ''
      publishForm.content = ''
      return
    }
    publishForm.title = rawContent.title
    publishForm.content = rawContent.content
  }

  function openCreatePublishModal() {
    publishModalOpen.value = true
  }

  function closePublishModal() {
    publishModalOpen.value = false
  }

  async function createPublisherTask() {
    if (!publishForm.raw_content_id || !publishForm.account_id) {
      deps.statusText.value = '请选择素材和账号'
      return
    }
    if (!publishForm.title || !publishForm.content) {
      deps.statusText.value = '请填写标题和正文'
      return
    }

    publisherBusy.value = true
    deps.statusText.value = '正在创建发布任务'
    try {
      const draft = await createDraftFromRawContent({
        raw_content_id: publishForm.raw_content_id,
        account_id: publishForm.account_id,
        title: publishForm.title,
        content: publishForm.content
      })
      await createPublishTask({
        draft_id: draft.id,
        platform: accountPlatform(publishForm.account_id)
      })
      await deps.refresh()
      closePublishModal()
      deps.statusText.value = '发布任务已创建'
    } catch (error) {
      console.error(error)
      deps.statusText.value = deps.readableError(error, '创建发布任务失败')
    } finally {
      publisherBusy.value = false
    }
  }

  async function openEditor(task: PublishTask) {
    publisherBusy.value = true
    deps.statusText.value = '正在打开编辑器'
    try {
      await openPublishEditor(task.id)
      await deps.refresh()
      deps.statusText.value = '编辑器已打开'
    } catch (error) {
      console.error(error)
      deps.statusText.value = '打开编辑器失败'
    } finally {
      publisherBusy.value = false
    }
  }

  async function autoPublish(task: PublishTask) {
    const platformName = deps.platformLabel(task.platform)
    if (!window.confirm(
      `确认要自动发布「${draftTitle(task.draft_id)}」到${platformName}吗？\n\n系统会自动点击发布按钮，请确认标题、正文和图片已经检查无误。`
    )) {
      return
    }

    publisherBusy.value = true
    deps.statusText.value = `正在自动发布到${platformName}`
    try {
      await autoPublishTask(task.id)
      await deps.refresh()
      deps.statusText.value = '自动发布完成'
    } catch (error) {
      console.error(error)
      deps.statusText.value = deps.readableError(error, '自动发布失败')
    } finally {
      publisherBusy.value = false
    }
  }

  async function markPublished(taskId: number) {
    if (!window.confirm('确认将该任务标记为已发布吗？')) {
      return
    }
    deps.statusText.value = '正在标记发布成功'
    try {
      await markPublishTaskPublished(taskId)
      await deps.refresh()
      deps.statusText.value = '任务已标记为已发布'
    } catch (error) {
      console.error(error)
      deps.statusText.value = '标记失败'
    }
  }

  async function markFailed(taskId: number) {
    const reason = window.prompt('请输入失败原因', '人工标记失败')
    if (reason === null) {
      return
    }
    deps.statusText.value = '正在标记失败'
    try {
      await markPublishTaskFailed(taskId, reason)
      await deps.refresh()
      deps.statusText.value = '任务已标记失败'
    } catch (error) {
      console.error(error)
      deps.statusText.value = '标记失败'
    }
  }

  async function cancelTask(taskId: number) {
    if (!window.confirm('确认取消该发布任务吗？')) {
      return
    }
    deps.statusText.value = '正在取消任务'
    try {
      await cancelPublishTask(taskId)
      await deps.refresh()
      deps.statusText.value = '任务已取消'
    } catch (error) {
      console.error(error)
      deps.statusText.value = '取消任务失败'
    }
  }

  async function showTaskDiagnostics(taskId: number) {
    publisherBusy.value = true
    deps.statusText.value = '正在加载任务详情'
    try {
      selectedDiagnostics.value = await loadPublishTaskDiagnostics(taskId)
      deps.statusText.value = '任务详情已加载'
    } catch (error) {
      console.error(error)
      deps.statusText.value = deps.readableError(error, '任务详情加载失败')
    } finally {
      publisherBusy.value = false
    }
  }

  function clearDiagnostics() {
    selectedDiagnostics.value = null
  }

  async function removeTask(taskId: number) {
    if (!window.confirm('确认删除该发布任务吗？')) {
      return
    }
    deps.statusText.value = '正在删除任务'
    try {
      await deletePublishTask(taskId)
      await deps.refresh()
      deps.statusText.value = '任务已删除'
    } catch (error) {
      console.error(error)
      deps.statusText.value = '删除任务失败'
    }
  }

  function accountPlatform(accountId: number) {
    return deps.dashboard.accounts.find((account) => account.id === accountId)?.platform ?? 'toutiao'
  }

  function canAutoPublish(platform: string) {
    return ['toutiao', 'xiaohongshu'].includes(platform)
  }

  function draftTitle(draftId: number) {
    return deps.dashboard.drafts.find((draft) => draft.id === draftId)?.title ?? `草稿 #${draftId}`
  }

  function normalizeStatus(status: string) {
    return status.toLowerCase()
  }

  function taskStatusLabel(status: string) {
    const labels: Record<string, string> = {
      pending: '待发布',
      publishing: '编辑中',
      published: '已发布',
      failed: '失败',
      canceled: '已取消'
    }
    return labels[normalizeStatus(status)] ?? status
  }

  function taskStatusClass(status: string) {
    return `status-${normalizeStatus(status)}`
  }

  function canShowOpenEditor(status: string) {
    return ['pending'].includes(normalizeStatus(status))
  }

  function canShowAutoPublish(task: PublishTask) {
    const status = normalizeStatus(task.status)
    return ['pending', 'failed'].includes(status) && canAutoPublish(task.platform)
  }

  function canShowPublishingActions(status: string) {
    return normalizeStatus(status) === 'publishing'
  }

  return {
    publisherBusy,
    publishModalOpen,
    selectedDiagnostics,
    publishForm,
    syncPublishDraftForm,
    openCreatePublishModal,
    closePublishModal,
    createPublisherTask,
    openEditor,
    autoPublish,
    markPublished,
    markFailed,
    cancelTask,
    showTaskDiagnostics,
    clearDiagnostics,
    removeTask,
    draftTitle,
    taskStatusLabel,
    taskStatusClass,
    canShowOpenEditor,
    canShowAutoPublish,
    canShowPublishingActions
  }
}
