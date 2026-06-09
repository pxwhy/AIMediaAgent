/*
实现逻辑：
1. 统一创建工作台运行态，包括仪表盘数据、分页、导航和各业务模块 context。
2. App.vue 只负责渲染壳层和 provide，不再承载跨模块初始化细节。
3. 跨模块删除后的联动清理集中在这里，避免分散到页面组件。
*/

import { computed, onMounted, reactive, ref } from 'vue'
import { loadDashboard } from '../../api/client'
import { createAccountProfileContext } from '../account-profile/context'
import { createAccountsContext } from '../accounts/context'
import { createAgentsContext } from '../agents/context'
import { createCollectorContext } from '../collector/context'
import { createModelsContext } from '../models/context'
import { createPublisherContext } from '../publisher/context'
import { createSkillsContext } from '../skills/context'
import { createSmartFilterContext } from '../smart-filter/context'
import {
  createDashboardState,
  createPaginationState,
  navItems,
  type PageKey
} from './context'
import {
  createPaginationHelpers,
  formatDate,
  metricText,
  platformLabel,
  priorityLabel,
  readableError
} from './utils'

export function createWorkbench() {
  const dashboard = reactive(createDashboardState())
  const pagination = reactive(createPaginationState())
  const { pageItems, shouldShowPagination } = createPaginationHelpers(pagination)
  const statusText = ref('等待加载')
  const activePage = ref<PageKey>('dashboard')
  const currentNav = computed(() => navItems.find((item) => item.key === activePage.value) ?? navItems[0])

  const accountsContext = createAccountsContext({
    dashboard,
    statusText,
    refresh,
    onAccountsDeleted(accountIds) {
      if (accountIds.includes(publishForm.account_id)) {
        publishForm.account_id = 0
      }
      if (accountIds.includes(profileForm.account_id)) {
        profileForm.account_id = 0
        clearProfileContext()
      }
      if (accountIds.includes(smartFilterAccountId.value)) {
        clearSmartFilterAccount()
      }
    }
  })
  const { selectedAccountIds } = accountsContext

  const collectorContext = createCollectorContext({
    dashboard,
    statusText,
    refresh
  })
  const {
    selectedRawContentIds,
    collectorSources,
    loadCollectors
  } = collectorContext

  const modelsContext = createModelsContext({
    readableError
  })
  const { loadModels } = modelsContext

  const agentsContext = createAgentsContext({
    readableError,
    onAgentDeleted(agentId) {
      if (reviewForm.agent_id === agentId) {
        reviewForm.agent_id = 0
      }
      if (contentSelectionAgentId.value === agentId) {
        contentSelectionAgentId.value = 0
      }
      if (profileForm.agent_id === agentId) {
        profileForm.agent_id = 0
      }
    }
  })
  const {
    agentConfigs,
    loadAgents
  } = agentsContext

  const skillsContext = createSkillsContext({
    readableError,
    refreshAgents: loadAgents
  })
  const { loadSkills } = skillsContext

  const accountProfileContext = createAccountProfileContext({
    agentConfigs,
    readableError,
    formatDate
  })
  const {
    reviewForm,
    profileForm,
    loadReviewReports,
    clearProfileContext
  } = accountProfileContext

  const smartFilterContext = createSmartFilterContext({
    dashboard,
    statusText,
    selectedRawContentIds,
    collectorSources,
    agentConfigs,
    readableError,
    formatDate
  })
  const {
    smartFilterAccountId,
    contentSelectionAgentId,
    clearSmartFilterAccount
  } = smartFilterContext

  const publisherContext = createPublisherContext({
    dashboard,
    statusText,
    refresh,
    readableError,
    platformLabel
  })
  const { publishForm } = publisherContext

  async function refresh() {
    statusText.value = '加载中'
    try {
      const data = await loadDashboard()
      dashboard.accounts = data.accounts
      dashboard.rawContents = data.rawContents
      dashboard.drafts = data.drafts
      dashboard.publishTasks = data.publishTasks
      const accountIds = new Set(data.accounts.map((account) => account.id))
      const rawContentIds = new Set(data.rawContents.map((content) => content.id))
      selectedAccountIds.value = selectedAccountIds.value.filter((accountId) => accountIds.has(accountId))
      selectedRawContentIds.value = selectedRawContentIds.value.filter((rawContentId) => rawContentIds.has(rawContentId))
      statusText.value = '已同步'
    } catch (error) {
      console.error(error)
      statusText.value = 'API 未连接'
    }
  }

  onMounted(async () => {
    await Promise.all([refresh(), loadCollectors(), loadModels(), loadAgents(), loadSkills()])
    await loadReviewReports()
  })

  const providedContext = {
    dashboard,
    pagination,
    statusText,
    ...accountsContext,
    ...collectorContext,
    ...modelsContext,
    ...agentsContext,
    ...skillsContext,
    ...accountProfileContext,
    ...smartFilterContext,
    ...publisherContext,
    pageItems,
    shouldShowPagination,
    metricText,
    formatDate,
    priorityLabel,
    platformLabel
  }

  return {
    activePage,
    currentNav,
    navItems,
    refresh,
    providedContext
  }
}
