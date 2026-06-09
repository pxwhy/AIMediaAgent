/*
实现逻辑：
1. 统一封装 H5 管理端访问后端 API 的方法和类型。
2. 前端页面只依赖这里的契约，不直接拼散落的请求。
3. 账号登录、模型配置、Agent 配置、Skill 配置、账号作品同步、账号复盘、采集预览、素材导入和发布诊断都通过该客户端调用后端。
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

export type AccountWork = {
  id: number
  account_id: number
  platform: string
  platform_work_id: string
  title: string
  content: string
  url: string
  status: string
  metrics: Record<string, unknown>
  raw: Record<string, unknown>
  published_at: string | null
  synced_at: string
  created_at: string
  updated_at: string
}

export type AccountWorkSyncResult = {
  account_id: number
  platform: string
  synced_count: number
  total_count: number
  message: string
}

export type ModelConfig = {
  id: number
  name: string
  provider: 'deepseek' | 'other'
  base_url: string
  model: string
  api_key_configured: boolean
  temperature: number
  timeout_seconds: number
  is_default: boolean
}

export type ModelConfigPayload = {
  name: string
  provider: 'deepseek' | 'other'
  api_key: string
  base_url: string
  model: string
  temperature: number
  timeout_seconds: number
  is_default: boolean
}

export type ModelTestResult = {
  provider: string
  model: string
  content: string
  usage: Record<string, unknown>
}

export type AgentConfig = {
  id: number
  name: string
  agent_type: 'account_review' | 'content_selection' | 'account_profile'
  model_config_id: number | null
  model_config_name: string
  system_prompt: string
  user_prompt_template: string
  skill_ids: number[]
  skill_paths: string[]
  skill_names: string[]
  enabled: boolean
  is_default: boolean
}

export type AgentConfigPayload = {
  name: string
  agent_type: 'account_review' | 'content_selection' | 'account_profile'
  model_config_id: number | null
  system_prompt: string
  user_prompt_template: string
  skill_ids: number[]
  skill_paths: string[]
  enabled: boolean
  is_default: boolean
}

export type SkillConfig = {
  id: number
  name: string
  skill_type: 'prompt'
  description: string
  content: string
  enabled: boolean
}

export type SkillConfigPayload = {
  name: string
  skill_type: 'prompt'
  description: string
  content: string
  enabled: boolean
}

export type LocalSkill = {
  name: string
  description: string
  relative_path: string
  path: string
  content: string
}

export type LocalSkillPayload = {
  root: string
  skills: LocalSkill[]
}

export type AccountReviewResult = {
  account_id: number
  agent_id: number | null
  agent_name: string
  model_config_id: number | null
  provider: string
  model: string
  report: ReviewReport
  raw_report: string
  works_count: number
  usage: Record<string, unknown>
}

export type AccountReviewReportRecord = AccountReviewResult & {
  id: number
  created_at: string
}

export type ContentSelectionItem = {
  raw_content_id: number
  selected: boolean
  score: number
  reason: string
  risk: string
  suggested_angle: string
  suggested_title: string
  data_limits: string[]
}

export type ContentSelectionResult = {
  agent_id: number | null
  agent_name: string
  model_config_id: number | null
  provider: string
  model: string
  results: ContentSelectionItem[]
  raw_report: string
  usage: Record<string, unknown>
}

export type ProfileSourcePreference = {
  source: string
  category: string
  reason: string
  keywords: string[]
  priority: string
}

export type AccountProfile = {
  summary: string
  positioning: string
  audience_profile: string
  content_tracks: string[]
  title_style: string[]
  source_preferences: ProfileSourcePreference[]
  forbidden_topics: string[]
  risk_boundaries: string[]
  topic_keywords: string[]
  publishing_advice: string[]
  data_limits: string[]
}

export type AccountProfileResult = {
  account_id: number
  review_report_id: number | null
  agent_id: number | null
  agent_name: string
  model_config_id: number | null
  provider: string
  model: string
  profile: AccountProfile
  raw_report: string
  works_count: number
  usage: Record<string, unknown>
}

export type AccountProfileReportRecord = AccountProfileResult & {
  id: number
  created_at: string
}

export type ReviewReport = {
  summary: string
  positioning: {
    current_direction: string
    strengths: string[]
    risks: string[]
  }
  top_works: Array<{
    title: string
    reason: string
    evidence: string
  }>
  title_analysis: {
    patterns: string[]
    problems: string[]
    formulas: string[]
  }
  content_structure: {
    strengths: string[]
    problems: string[]
    template: string
  }
  audience: {
    profile: string
    interests: string[]
    unmet_needs: string[]
  }
  topic_suggestions: Array<{
    topic: string
    title_direction: string
    reason: string
    angle: string
    metric: string
  }>
  actions: Array<{
    action: string
    priority: string
    metric: string
    cycle: string
  }>
  data_limits: string[]
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

export type PublishTaskDiagnostics = {
  task_id: number
  status: string
  result: {
    success: boolean
    platform_url: string
    error_message: string
    raw_response: Record<string, unknown>
    published_at: string | null
  } | null
  run_dir: string
  logs: string
  screenshots: string[]
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

export async function loadModelConfigs(): Promise<ModelConfig[]> {
  const response = await api.get('/models/configs')
  return response.data
}

export async function createModelConfig(payload: ModelConfigPayload): Promise<ModelConfig> {
  const response = await api.post('/models/configs', payload)
  return response.data
}

export async function updateModelConfig(id: number, payload: ModelConfigPayload): Promise<ModelConfig> {
  const response = await api.put(`/models/configs/${id}`, payload)
  return response.data
}

export async function deleteModelConfig(id: number): Promise<void> {
  await api.delete(`/models/configs/${id}`)
}

export async function setDefaultModelConfig(id: number): Promise<ModelConfig> {
  const response = await api.post(`/models/configs/${id}/set-default`)
  return response.data
}

export async function testModel(prompt: string, modelConfigId: number | null): Promise<ModelTestResult> {
  const response = await api.post('/models/test', { prompt, model_config_id: modelConfigId }, { timeout: 180000 })
  return response.data
}

export async function loadAgentConfigs(): Promise<AgentConfig[]> {
  const response = await api.get('/agents/configs')
  return response.data
}

export async function createAgentConfig(payload: AgentConfigPayload): Promise<AgentConfig> {
  const response = await api.post('/agents/configs', payload)
  return response.data
}

export async function updateAgentConfig(id: number, payload: AgentConfigPayload): Promise<AgentConfig> {
  const response = await api.put(`/agents/configs/${id}`, payload)
  return response.data
}

export async function deleteAgentConfig(id: number): Promise<void> {
  await api.delete(`/agents/configs/${id}`)
}

export async function setDefaultAgentConfig(id: number): Promise<AgentConfig> {
  const response = await api.post(`/agents/configs/${id}/set-default`)
  return response.data
}

export async function loadSkillConfigs(): Promise<SkillConfig[]> {
  const response = await api.get('/skills/configs')
  return response.data
}

export async function createSkillConfig(payload: SkillConfigPayload): Promise<SkillConfig> {
  const response = await api.post('/skills/configs', payload)
  return response.data
}

export async function updateSkillConfig(id: number, payload: SkillConfigPayload): Promise<SkillConfig> {
  const response = await api.put(`/skills/configs/${id}`, payload)
  return response.data
}

export async function deleteSkillConfig(id: number): Promise<void> {
  await api.delete(`/skills/configs/${id}`)
}

export async function loadLocalSkills(): Promise<LocalSkillPayload> {
  const response = await api.get('/skills/local')
  return response.data
}

export async function reloadLocalSkills(): Promise<LocalSkillPayload> {
  const response = await api.post('/skills/local/reload')
  return response.data
}

export async function generateAccountReview(payload: {
  account_id: number
  agent_id?: number | null
  model_config_id?: number | null
}): Promise<AccountReviewResult> {
  const response = await api.post('/agents/account-review', payload, { timeout: 180000 })
  return response.data
}

export async function selectCollectedContent(payload: {
  raw_content_ids: number[]
  agent_id?: number | null
  model_config_id?: number | null
}): Promise<ContentSelectionResult> {
  const response = await api.post('/agents/content-selection', payload, { timeout: 180000 })
  return response.data
}

export async function generateAccountProfile(payload: {
  account_id: number
  review_report_id?: number | null
  agent_id?: number | null
  model_config_id?: number | null
}): Promise<AccountProfileResult> {
  const response = await api.post('/agents/account-profile', payload, { timeout: 180000 })
  return response.data
}

export async function loadAccountProfileReports(accountId?: number | null): Promise<AccountProfileReportRecord[]> {
  const response = await api.get('/agents/account-profile/reports', {
    params: accountId ? { account_id: accountId } : undefined
  })
  return response.data
}

export async function deleteAccountProfileReport(profileId: number): Promise<void> {
  await api.delete(`/agents/account-profile/reports/${profileId}`)
}

export async function loadAccountReviewReports(accountId?: number | null): Promise<AccountReviewReportRecord[]> {
  const response = await api.get('/agents/account-review/reports', {
    params: accountId ? { account_id: accountId } : undefined
  })
  return response.data
}

export async function deleteAccountReviewReport(reportId: number): Promise<void> {
  await api.delete(`/agents/account-review/reports/${reportId}`)
}

export async function createLoginSession(platform: string): Promise<LoginSession> {
  const response = await api.post('/login-sessions', { platform })
  return response.data
}

export async function confirmLoginSession(sessionId: string): Promise<LoginSession> {
  const response = await api.post(`/login-sessions/${sessionId}/confirm`)
  return response.data
}

export async function deleteAccount(accountId: number): Promise<void> {
  await api.delete(`/accounts/${accountId}`)
}

export async function syncAccountWorks(accountId: number): Promise<AccountWorkSyncResult> {
  const response = await api.post(`/accounts/${accountId}/sync-works`, {}, { timeout: 180000 })
  return response.data
}

export async function loadAccountWorks(accountId: number): Promise<AccountWork[]> {
  const response = await api.get(`/accounts/${accountId}/works`)
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

export async function loadPublishTaskDiagnostics(taskId: number): Promise<PublishTaskDiagnostics> {
  const response = await api.get(`/publish-tasks/${taskId}/diagnostics`)
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
