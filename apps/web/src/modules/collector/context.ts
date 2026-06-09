/*
实现逻辑：
1. 管理采集模块的来源分类、热点预览、素材导入、素材查看和删除状态。
2. 素材库选中状态作为采集域共享给智能筛选，但素材删除仍由采集模块负责。
3. 来源和状态展示统一转成中文，列表页只消费稳定的展示函数。
*/

import { computed, ref } from 'vue'
import {
  deleteRawContent,
  importCollectorItem,
  loadCollectorSources,
  previewCollectorItems,
  type CollectorItem,
  type CollectorSource,
  type DashboardPayload,
  type RawContent
} from '../../api/client'

type CollectorDependencies = {
  dashboard: DashboardPayload
  statusText: { value: string }
  refresh: () => Promise<void>
}

export function createCollectorContext(deps: CollectorDependencies) {
  const collectorBusy = ref(false)
  const importingUrl = ref('')
  const collectorSources = ref<CollectorSource[]>([])
  const collectorItems = ref<CollectorItem[]>([])
  const selectedRawContent = ref<RawContent | null>(null)
  const selectedRawContentIds = ref<number[]>([])
  const collectorSourceKey = ref('ithome')
  const collectorCategoryKey = ref('home')

  const collectorCategories = computed(() => {
    const source = collectorSources.value.find((item) => item.key === collectorSourceKey.value)
    return source?.categories ?? []
  })
  const allRawContentsSelected = computed({
    get() {
      return deps.dashboard.rawContents.length > 0 && selectedRawContentIds.value.length === deps.dashboard.rawContents.length
    },
    set(checked: boolean) {
      selectedRawContentIds.value = checked ? deps.dashboard.rawContents.map((content) => content.id) : []
    }
  })

  async function loadCollectors() {
    try {
      collectorSources.value = await loadCollectorSources()
      if (!collectorSources.value.some((source) => source.key === collectorSourceKey.value)) {
        collectorSourceKey.value = collectorSources.value[0]?.key ?? ''
      }
      syncCollectorCategory()
    } catch (error) {
      console.error(error)
      deps.statusText.value = '采集源加载失败'
    }
  }

  function syncCollectorCategory() {
    const firstCategory = collectorCategories.value[0]
    if (!collectorCategories.value.some((category) => category.key === collectorCategoryKey.value)) {
      collectorCategoryKey.value = firstCategory?.key ?? ''
    }
  }

  async function previewCollector() {
    if (!collectorSourceKey.value || !collectorCategoryKey.value) {
      deps.statusText.value = '请选择采集源'
      return
    }
    collectorBusy.value = true
    deps.statusText.value = '正在刷新热点'
    try {
      collectorItems.value = await previewCollectorItems({
        source: collectorSourceKey.value,
        category: collectorCategoryKey.value,
        limit: 20,
        with_detail: false
      })
      deps.statusText.value = collectorItems.value.length ? '热点已刷新' : '未获取到热点'
    } catch (error) {
      console.error(error)
      deps.statusText.value = '热点刷新失败'
    } finally {
      collectorBusy.value = false
    }
  }

  async function importCollector(item: CollectorItem) {
    const existing = deps.dashboard.rawContents.find((content) => content.source_url === item.url)
    if (existing) {
      selectedRawContent.value = existing
      deps.statusText.value = '素材已存在'
      return
    }

    importingUrl.value = item.url
    deps.statusText.value = '正在导入素材'
    try {
      await importCollectorItem(item)
      await deps.refresh()
      deps.statusText.value = '素材已导入'
    } catch (error) {
      console.error(error)
      deps.statusText.value = '素材导入失败'
    } finally {
      importingUrl.value = ''
    }
  }

  async function removeRawContent(content: RawContent) {
    if (!window.confirm(`确认删除「${content.title}」吗？`)) {
      return
    }

    deps.statusText.value = '正在删除素材'
    try {
      await deleteRawContent(content.id)
      selectedRawContentIds.value = selectedRawContentIds.value.filter((rawContentId) => rawContentId !== content.id)
      if (selectedRawContent.value?.id === content.id) {
        selectedRawContent.value = null
      }
      await deps.refresh()
      deps.statusText.value = '素材已删除'
    } catch (error) {
      console.error(error)
      deps.statusText.value = '素材删除失败'
    }
  }

  async function removeSelectedRawContents() {
    const rawContentIds = [...selectedRawContentIds.value]
    if (rawContentIds.length === 0) {
      return
    }
    if (!window.confirm(`确认删除已选中的 ${rawContentIds.length} 条素材吗？`)) {
      return
    }

    deps.statusText.value = '正在批量删除素材'
    try {
      await Promise.all(rawContentIds.map((rawContentId) => deleteRawContent(rawContentId)))
      if (selectedRawContent.value && rawContentIds.includes(selectedRawContent.value.id)) {
        selectedRawContent.value = null
      }
      selectedRawContentIds.value = []
      await deps.refresh()
      deps.statusText.value = `已删除 ${rawContentIds.length} 条素材`
    } catch (error) {
      console.error(error)
      deps.statusText.value = '批量删除素材失败'
    }
  }

  function rawContentSourceLabel(sourceKey: string) {
    const source = collectorSources.value.find((item) => item.key === sourceKey)
    if (source?.name) {
      return source.name
    }
    const labels: Record<string, string> = {
      toutiao: '头条号',
      xiaohongshu: '小红书',
      ithome: 'IT之家',
      jinritoutiao: '今日头条',
      weibo: '微博',
      zhihu: '知乎',
      baidu: '百度'
    }
    return labels[sourceKey] ?? sourceKey
  }

  function rawContentStatusLabel(status: string) {
    const labels: Record<string, string> = {
      collected: '已采集',
      pending: '待处理',
      generated: '已生成',
      approved: '已通过',
      publishing: '发布中',
      published: '已发布',
      failed: '失败',
      canceled: '已取消',
      draft: '草稿'
    }
    return labels[status.toLowerCase()] ?? status
  }

  return {
    collectorBusy,
    importingUrl,
    collectorSources,
    collectorItems,
    selectedRawContent,
    selectedRawContentIds,
    collectorSourceKey,
    collectorCategoryKey,
    collectorCategories,
    allRawContentsSelected,
    loadCollectors,
    syncCollectorCategory,
    previewCollector,
    importCollector,
    removeRawContent,
    removeSelectedRawContents,
    rawContentSourceLabel,
    rawContentStatusLabel
  }
}
