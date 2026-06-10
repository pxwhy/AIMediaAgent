/*
实现逻辑：
1. 统一提供前端工作台的页面状态、共享数据和事件处理函数，供业务模块组件注入使用。
2. AppContext 使用各业务 context 的返回类型组合，避免注入侧退化成 any 后遗漏字段只能运行时报错。
3. Symbol.for 保持运行时稳定，规避 HMR 或 .ts/.js 并存时的注入失配。
*/

import type { InjectionKey, Ref } from 'vue'
import type { DashboardPayload } from '../api/client'
import type { createAccountProfileContext } from './account-profile/context'
import type { createAccountsContext } from './accounts/context'
import type { createAgentsContext } from './agents/context'
import type { createCollectorContext } from './collector/context'
import type { createModelsContext } from './models/context'
import type { createPublisherContext } from './publisher/context'
import type { createSkillsContext } from './skills/context'
import type { createSmartFilterContext } from './smart-filter/context'
import type { PaginationKey } from './app-shell/context'
import type {
  createPaginationHelpers,
  formatDate,
  metricText,
  platformLabel,
  priorityLabel
} from './app-shell/utils'

type PaginationState = Record<PaginationKey, { page: number; pageSize: number }>
type PaginationHelpers = ReturnType<typeof createPaginationHelpers>

export type AppContext = ReturnType<typeof createAccountsContext>
  & ReturnType<typeof createCollectorContext>
  & ReturnType<typeof createModelsContext>
  & ReturnType<typeof createAgentsContext>
  & ReturnType<typeof createSkillsContext>
  & ReturnType<typeof createAccountProfileContext>
  & ReturnType<typeof createSmartFilterContext>
  & ReturnType<typeof createPublisherContext>
  & {
    dashboard: DashboardPayload
    pagination: PaginationState
    statusText: Ref<string>
    pageItems: PaginationHelpers['pageItems']
    shouldShowPagination: PaginationHelpers['shouldShowPagination']
    metricText: typeof metricText
    formatDate: typeof formatDate
    priorityLabel: typeof priorityLabel
    platformLabel: typeof platformLabel
  }

export const appContextKey: InjectionKey<AppContext> = Symbol.for('aimedia-agent.app-context')
