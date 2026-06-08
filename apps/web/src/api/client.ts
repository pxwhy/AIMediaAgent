/*
实现逻辑：
1. 统一封装 H5 管理端访问后端 API 的方法和类型。
2. 前端页面只依赖这里的契约，不直接拼散落的请求。
3. 账号登录、采集预览和素材导入都通过该客户端调用后端。
*/

import axios from 'axios'

export const api = axios.create({
  baseURL: '/api/v1',
  timeout: 10000
})

export type Account = {
  id: number
  platform: string
  nickname: string
  uid: string
  status: string
  daily_publish_limit: number
  created_at: string
}

export type LoginSession = {
  id: string
  platform: string
  status: string
  login_url: string
  state_path: string
  account_id: number | null
  error_message: string
  created_at: string
  updated_at: string
}

export type CollectorCategory = {
  key: string
  name: string
}

export type CollectorSource = {
  key: string
  name: string
  categories: CollectorCategory[]
}

export type CollectorItem = {
  source: string
  category: string
  title: string
  url: string
  published_at: string | null
  summary: string
  content: string
  images: string[]
  raw: Record<string, unknown>
}

export type RawContent = {
  id: number
  source: string
  category: string
  title: string
  content: string
  source_url: string
  images: string[]
  metrics: Record<string, unknown>
  status: string
  created_at: string
}

export type PublishDraft = {
  id: number
  raw_content_id: number | null
  account_id: number | null
  title: string
  content: string
  images: string[]
  status: string
  agent_notes: Record<string, unknown>
  risk_score: number
  created_at: string
  updated_at: string
}

export type PublishTask = {
  id: number
  draft_id: number
  platform: string
  scheduled_at: string | null
  status: string
  created_at: string
  updated_at: string
}

export type DashboardPayload = {
  accounts: Account[]
  rawContents: RawContent[]
  drafts: PublishDraft[]
  publishTasks: PublishTask[]
}

export async function loadDashboard(): Promise<DashboardPayload> {
  const [accounts, rawContents, drafts, publishTasks] = await Promise.all([
    api.get('/accounts'),
    api.get('/raw-contents'),
    api.get('/drafts'),
    api.get('/publish-tasks')
  ])

  return {
    accounts: accounts.data,
    rawContents: rawContents.data,
    drafts: drafts.data,
    publishTasks: publishTasks.data
  }
}

export async function createLoginSession(platform: string): Promise<LoginSession> {
  const response = await api.post('/login-sessions', { platform })
  return response.data
}

export async function confirmLoginSession(sessionId: string): Promise<LoginSession> {
  const response = await api.post(`/login-sessions/${sessionId}/confirm`)
  return response.data
}

export async function loadCollectorSources(): Promise<CollectorSource[]> {
  const response = await api.get('/collector/sources')
  return response.data
}

export async function previewCollectorItems(payload: {
  source: string
  category: string
  limit: number
  with_detail?: boolean
}): Promise<CollectorItem[]> {
  const response = await api.post('/collector/preview', payload)
  return response.data
}

export async function importCollectorItem(item: CollectorItem): Promise<RawContent> {
  const response = await api.post('/collector/import', {
    source: item.source,
    category: item.category,
    title: item.title,
    url: item.url
  })
  return response.data
}

export async function deleteRawContent(id: number): Promise<void> {
  await api.delete(`/raw-contents/${id}`)
}

export async function createDraftFromRawContent(payload: {
  raw_content_id: number
  account_id: number | null
  title?: string
  content?: string
  images?: string[]
}): Promise<PublishDraft> {
  const response = await api.post('/drafts/from-raw-content', payload)
  return response.data
}

export async function createPublishTask(payload: {
  draft_id: number
  platform: string
  scheduled_at?: string | null
}): Promise<PublishTask> {
  const response = await api.post('/publish-tasks', payload)
  return response.data
}

export async function openPublishEditor(taskId: number): Promise<PublishTask> {
  const response = await api.post(`/publish-tasks/${taskId}/open-editor`)
  return response.data
}

export async function autoPublishTask(taskId: number): Promise<PublishTask> {
  const response = await api.post(`/publish-tasks/${taskId}/auto-publish`)
  return response.data
}

export async function markPublishTaskPublished(taskId: number): Promise<PublishTask> {
  const response = await api.post(`/publish-tasks/${taskId}/mark-published`)
  return response.data
}

export async function markPublishTaskFailed(taskId: number, errorMessage = ''): Promise<PublishTask> {
  const response = await api.post(`/publish-tasks/${taskId}/mark-failed`, {
    error_message: errorMessage
  })
  return response.data
}

export async function cancelPublishTask(taskId: number): Promise<PublishTask> {
  const response = await api.post(`/publish-tasks/${taskId}/cancel`)
  return response.data
}

export async function deletePublishTask(taskId: number): Promise<void> {
  await api.delete(`/publish-tasks/${taskId}`)
}
