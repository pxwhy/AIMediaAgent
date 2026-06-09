<!--
实现逻辑：
1. 提供 H5 管理端的仪表盘、账号、模型、采集、发布任务等核心工作台页面。
2. 账号页负责平台登录态接入，模型页负责保存和测试 Agent 模型配置。
3. 账号页支持单个删除、批量删除和头条号作品同步，发布任务页根据任务状态展示可用操作。
-->

<template>
  <main class="shell">
    <aside class="sidebar">
      <div class="brand">AIMediaAgent</div>
      <button
        v-for="item in navItems"
        :key="item.key"
        class="nav"
        :class="{ active: activePage === item.key }"
        @click="activePage = item.key"
      >
        {{ item.label }}
      </button>
    </aside>

    <section class="content">
      <header class="topbar">
        <div>
          <h1>{{ currentNav.label }}</h1>
          <p>{{ currentNav.description }}</p>
        </div>
        <button class="primary" @click="refresh">刷新</button>
      </header>

      <template v-if="activePage === 'dashboard'">
        <section class="metrics">
          <article class="metric">
            <span>账号</span>
            <strong>{{ dashboard.accounts.length }}</strong>
          </article>
          <article class="metric">
            <span>采集内容</span>
            <strong>{{ dashboard.rawContents.length }}</strong>
          </article>
          <article class="metric">
            <span>草稿</span>
            <strong>{{ dashboard.drafts.length }}</strong>
          </article>
          <article class="metric">
            <span>发布任务</span>
            <strong>{{ dashboard.publishTasks.length }}</strong>
          </article>
        </section>

        <section class="panel">
          <div class="panel-title">
            <h2>业务流</h2>
            <span>{{ statusText }}</span>
          </div>
          <div class="flow">
            <div>数据采集</div>
            <div>Agent 草稿</div>
            <div>人工审核</div>
            <div>平台发布</div>
            <div>数据复盘</div>
          </div>
        </section>
      </template>

      <section v-else-if="activePage === 'accounts'" class="panel">
        <div class="panel-title">
          <h2>账号列表</h2>
          <span>{{ statusText }}</span>
        </div>
        <div class="login-card">
          <div>
            <h3>平台登录接入</h3>
            <p>打开平台登录页，手动完成登录后点击确认，系统会保存登录态。</p>
          </div>
          <div class="login-actions">
            <select v-model="loginPlatform">
              <option value="toutiao">头条号</option>
              <option value="baijiahao">百家号</option>
              <option value="weixin">微信公众号</option>
              <option value="qiehao">企鹅号</option>
              <option value="xiaohongshu">小红书</option>
            </select>
            <button class="secondary" @click="openLoginSession" :disabled="loginBusy">
              打开登录页
            </button>
            <button class="primary" @click="confirmLogin" :disabled="loginBusy || !loginSessionId">
              我已登录
            </button>
          </div>
        </div>
        <div v-if="dashboard.accounts.length === 0" class="empty">
          暂无账号
        </div>
        <div v-else class="table">
          <div class="bulk-actions">
            <span>已选择 {{ selectedAccountIds.length }} 个账号</span>
            <button
              class="text-button danger"
              @click="removeSelectedAccounts"
              :disabled="loginBusy || selectedAccountIds.length === 0"
            >
              批量删除
            </button>
          </div>
          <div class="table-row table-head account-table-row">
            <label class="checkbox-cell">
              <input
                v-model="allAccountsSelected"
                type="checkbox"
                :disabled="loginBusy || dashboard.accounts.length === 0"
              />
            </label>
            <span>平台</span>
            <span>昵称</span>
            <span>UID</span>
            <span>状态</span>
            <span>每日上限</span>
            <span>操作</span>
          </div>
          <div v-for="account in dashboard.accounts" :key="account.id" class="table-row account-table-row">
            <label class="checkbox-cell">
              <input
                v-model="selectedAccountIds"
                type="checkbox"
                :value="account.id"
                :disabled="loginBusy"
              />
            </label>
            <span>{{ account.platform }}</span>
            <span>{{ account.nickname || '-' }}</span>
            <span>{{ account.uid || '-' }}</span>
            <span>{{ account.status }}</span>
            <span>{{ account.daily_publish_limit }}</span>
            <span class="row-actions">
              <button class="text-button" @click="syncWorks(account)" :disabled="loginBusy || account.platform !== 'toutiao'">
                同步作品
              </button>
              <button class="text-button" @click="showAccountWorks(account)" :disabled="loginBusy">
                作品
              </button>
              <button class="text-button danger" @click="removeAccount(account)" :disabled="loginBusy">
                删除
              </button>
            </span>
          </div>
        </div>
        <section v-if="selectedWorkAccount" class="account-works-panel">
          <div class="account-works-header">
            <h3>{{ selectedWorkAccount.nickname || selectedWorkAccount.uid || selectedWorkAccount.platform }} 的作品</h3>
            <button class="text-button" @click="clearAccountWorks">关闭</button>
          </div>
          <div v-if="accountWorks.length === 0" class="empty compact-empty">
            暂无同步作品
          </div>
          <div v-else class="table">
            <div class="table-row account-work-row table-head">
              <span>标题</span>
              <span>状态</span>
              <span>阅读/播放</span>
              <span>点赞</span>
              <span>评论</span>
              <span>同步时间</span>
              <span>操作</span>
            </div>
            <div v-for="work in accountWorks" :key="work.id" class="table-row account-work-row">
              <span>
                <a v-if="work.url" :href="work.url" target="_blank" rel="noreferrer">{{ work.title }}</a>
                <template v-else>{{ work.title }}</template>
              </span>
              <span>{{ work.status || '-' }}</span>
              <span>{{ metricText(work.metrics, 'views') }}</span>
              <span>{{ metricText(work.metrics, 'likes') }}</span>
              <span>{{ metricText(work.metrics, 'comments') }}</span>
              <span>{{ formatDate(work.synced_at) }}</span>
              <span class="row-actions">
                <button class="text-button" @click="selectAccountWork(work)">内容</button>
              </span>
            </div>
          </div>
        </section>
      </section>

      <section v-else-if="activePage === 'collector'" class="panel">
        <div class="panel-title">
          <h2>热点预览</h2>
          <span>{{ statusText }}</span>
        </div>
        <div class="collector-toolbar">
          <label>
            <span>来源</span>
            <select v-model="collectorSourceKey" @change="syncCollectorCategory">
              <option v-for="source in collectorSources" :key="source.key" :value="source.key">
                {{ source.name }}
              </option>
            </select>
          </label>
          <label>
            <span>分类</span>
            <select v-model="collectorCategoryKey">
              <option v-for="category in collectorCategories" :key="category.key" :value="category.key">
                {{ category.name }}
              </option>
            </select>
          </label>
          <button class="primary" @click="previewCollector" :disabled="collectorBusy">
            {{ collectorBusy ? '刷新中' : '刷新热点' }}
          </button>
        </div>

        <div v-if="collectorItems.length === 0" class="empty">
          暂无热点数据
        </div>
        <div v-else class="collector-list">
          <article v-for="item in collectorItems" :key="item.url" class="collector-item">
            <div>
              <h3>{{ item.title }}</h3>
              <p>{{ item.summary || item.url }}</p>
            </div>
            <button
              class="secondary"
              @click="importCollector(item)"
              :disabled="importingUrl === item.url"
            >
              {{ importingUrl === item.url ? '导入中' : '导入素材库' }}
            </button>
          </article>
        </div>

        <div class="panel-title compact-title">
          <h2>素材库</h2>
          <span>{{ dashboard.rawContents.length }} 条</span>
        </div>
        <div v-if="dashboard.rawContents.length === 0" class="empty">
          暂无采集内容
        </div>
        <div v-else class="table">
          <div class="table-row collector-table-head">
            <span>来源</span>
            <span>标题</span>
            <span>状态</span>
            <span>时间</span>
            <span>操作</span>
          </div>
          <div v-for="content in dashboard.rawContents" :key="content.id" class="table-row collector-table-row">
            <span>{{ content.source }}</span>
            <span>{{ content.title }}</span>
            <span>{{ content.status }}</span>
            <span>{{ formatDate(content.created_at) }}</span>
            <span class="row-actions">
              <button class="text-button" @click="selectedRawContent = content">查看</button>
              <button class="text-button danger" @click="removeRawContent(content)">删除</button>
            </span>
          </div>
        </div>

        <div v-if="selectedRawContent" class="detail-drawer">
          <div class="detail-header">
            <div>
              <h2>{{ selectedRawContent.title }}</h2>
              <p>{{ selectedRawContent.source }} / {{ selectedRawContent.category || '-' }}</p>
            </div>
            <button class="secondary" @click="selectedRawContent = null">关闭</button>
          </div>
          <a
            v-if="selectedRawContent.source_url"
            class="source-link"
            :href="selectedRawContent.source_url"
            target="_blank"
            rel="noreferrer"
          >
            {{ selectedRawContent.source_url }}
          </a>
          <div v-if="selectedRawContent.images.length" class="image-grid">
            <a
              v-for="image in selectedRawContent.images"
              :key="image"
              :href="image"
              target="_blank"
              rel="noreferrer"
            >
              <img :src="image" :alt="selectedRawContent.title" />
            </a>
          </div>
          <div class="content-preview">
            {{ selectedRawContent.content || '暂无正文内容' }}
          </div>
        </div>
      </section>

      <section v-else-if="activePage === 'publisher'" class="panel">
        <div class="panel-title">
          <h2>发布工作台</h2>
          <span>{{ statusText }}</span>
        </div>

        <div class="publisher-grid">
          <section class="publisher-builder">
            <div class="form-grid">
              <label>
                <span>素材</span>
                <select v-model.number="publishForm.raw_content_id" @change="syncPublishDraftForm">
                  <option :value="0">请选择素材</option>
                  <option v-for="content in dashboard.rawContents" :key="content.id" :value="content.id">
                    {{ content.title }}
                  </option>
                </select>
              </label>
              <label>
                <span>账号</span>
                <select v-model.number="publishForm.account_id">
                  <option :value="0">请选择账号</option>
                  <option v-for="account in dashboard.accounts" :key="account.id" :value="account.id">
                    {{ account.nickname }} / {{ account.platform }}
                  </option>
                </select>
              </label>
            </div>
            <label class="stacked-field">
              <span>标题</span>
              <input v-model.trim="publishForm.title" placeholder="发布标题" />
            </label>
            <label class="stacked-field">
              <span>正文</span>
              <textarea v-model="publishForm.content" rows="12" placeholder="发布正文"></textarea>
            </label>
            <div class="row-actions end-actions">
              <button class="secondary" @click="syncPublishDraftForm">载入素材</button>
              <button class="primary" @click="createPublisherTask" :disabled="publisherBusy">
                {{ publisherBusy ? '创建中' : '创建发布任务' }}
              </button>
            </div>
          </section>

          <section class="publisher-preview">
            <h3>草稿预览</h3>
            <h2>{{ publishForm.title || '未选择素材' }}</h2>
            <p>{{ publishForm.content || '暂无正文' }}</p>
          </section>
        </div>

        <div class="panel-title compact-title">
          <h2>发布任务</h2>
          <span>{{ dashboard.publishTasks.length }} 条</span>
        </div>
        <div v-if="dashboard.publishTasks.length === 0" class="empty">
          暂无发布任务
        </div>
        <div v-else class="table">
          <div class="table-row publish-table-head">
            <span>平台</span>
            <span>草稿</span>
            <span>状态</span>
            <span>时间</span>
            <span>操作</span>
          </div>
          <div v-for="task in dashboard.publishTasks" :key="task.id" class="table-row publish-table-row">
            <span>{{ task.platform }}</span>
            <span>{{ draftTitle(task.draft_id) }}</span>
            <span class="status-badge" :class="taskStatusClass(task.status)">
              {{ taskStatusLabel(task.status) }}
            </span>
            <span>{{ formatDate(task.created_at) }}</span>
            <span class="row-actions task-actions">
              <button
                v-if="canShowOpenEditor(task.status)"
                class="text-button"
                @click="openEditor(task)"
                :disabled="publisherBusy"
              >
                打开
              </button>
              <button
                v-if="canShowAutoPublish(task)"
                class="text-button danger"
                @click="autoPublish(task)"
                :disabled="publisherBusy"
              >
                自动发布
              </button>
              <button
                v-if="canShowPublishingActions(task.status)"
                class="text-button"
                @click="markPublished(task.id)"
              >
                已发布
              </button>
              <button
                v-if="canShowPublishingActions(task.status)"
                class="text-button"
                @click="markFailed(task.id)"
              >
                失败
              </button>
              <button
                v-if="canShowPublishingActions(task.status)"
                class="text-button"
                @click="cancelTask(task.id)"
              >
                取消
              </button>
              <button class="text-button" @click="showTaskDiagnostics(task.id)" :disabled="publisherBusy">
                详情
              </button>
              <button class="text-button danger" @click="removeTask(task.id)">删除</button>
            </span>
          </div>
        </div>
        <section v-if="selectedDiagnostics" class="diagnostics-panel">
          <div class="diagnostics-header">
            <h3>任务 #{{ selectedDiagnostics.task_id }}</h3>
            <button class="text-button" @click="clearDiagnostics">关闭</button>
          </div>
          <div class="diagnostics-grid">
            <span>状态</span>
            <strong>{{ taskStatusLabel(selectedDiagnostics.status) }}</strong>
            <span>运行目录</span>
            <strong>{{ selectedDiagnostics.run_dir }}</strong>
            <span>平台链接</span>
            <strong>{{ selectedDiagnostics.result?.platform_url || '-' }}</strong>
            <span>失败原因</span>
            <strong>{{ selectedDiagnostics.result?.error_message || '-' }}</strong>
          </div>
          <div class="diagnostics-block">
            <h4>截图</h4>
            <div v-if="selectedDiagnostics.screenshots.length" class="screenshot-list">
              <span v-for="name in selectedDiagnostics.screenshots" :key="name">{{ name }}</span>
            </div>
            <div v-else class="diagnostics-empty">暂无截图</div>
          </div>
          <div class="diagnostics-block">
            <h4>Worker 日志</h4>
            <pre>{{ selectedDiagnostics.logs || '暂无日志' }}</pre>
          </div>
        </section>
      </section>

      <section v-else-if="activePage === 'models'" class="panel">
        <div class="panel-title">
          <h2>模型配置</h2>
          <span>{{ modelStatusText }}</span>
        </div>
        <div class="model-config-grid">
          <section class="model-config-block">
            <h3>默认模型</h3>
            <label>
              <span>当前模型</span>
              <select v-model="modelForm.provider">
                <option value="deepseek">DeepSeek</option>
                <option value="other">其他模型</option>
              </select>
            </label>
            <label>
              <span>Temperature</span>
              <input v-model.number="modelForm.temperature" type="number" min="0" max="2" step="0.1" />
            </label>
            <label>
              <span>Timeout 秒数</span>
              <input v-model.number="modelForm.timeout_seconds" type="number" min="5" max="300" />
            </label>
          </section>

          <section class="model-config-block">
            <h3>DeepSeek</h3>
            <label>
              <span>API Key</span>
              <input
                v-model.trim="modelForm.deepseek_api_key"
                type="password"
                :placeholder="modelKeyPlaceholders.deepseek"
              />
            </label>
            <label>
              <span>Base URL</span>
              <input v-model.trim="modelForm.deepseek_base_url" />
            </label>
            <label>
              <span>Model</span>
              <input v-model.trim="modelForm.deepseek_model" />
            </label>
          </section>

          <section class="model-config-block">
            <h3>其他模型</h3>
            <label>
              <span>API Key</span>
              <input
                v-model.trim="modelForm.other_api_key"
                type="password"
                :placeholder="modelKeyPlaceholders.other"
              />
            </label>
            <label>
              <span>Base URL</span>
              <input v-model.trim="modelForm.other_base_url" placeholder="https://example.com/v1" />
            </label>
            <label>
              <span>Model</span>
              <input v-model.trim="modelForm.other_model" />
            </label>
          </section>
        </div>
        <div class="model-test-panel">
          <textarea v-model="modelTestPrompt" rows="4" placeholder="输入测试提示词"></textarea>
          <div class="model-actions">
            <button class="primary" @click="saveModels" :disabled="modelBusy">保存配置</button>
            <button class="secondary" @click="runModelTest" :disabled="modelBusy">测试模型</button>
          </div>
          <pre v-if="modelTestResult">{{ modelTestResult }}</pre>
        </div>
      </section>

      <section v-else class="panel">
        <div class="panel-title">
          <h2>{{ currentNav.label }}</h2>
          <span>规划中</span>
        </div>
        <div class="empty">该模块页面正在接入，当前先完成账号和仪表盘。</div>
      </section>
    </section>
    <div v-if="selectedAccountWork" class="modal-backdrop" @click.self="selectedAccountWork = null">
      <section class="work-content-modal" role="dialog" aria-modal="true">
        <div class="work-content-header">
          <h4>{{ selectedAccountWork.title }}</h4>
          <button class="text-button" @click="selectedAccountWork = null">关闭</button>
        </div>
        <pre>{{ selectedAccountWork.content || '暂无正文，下次同步会继续尝试补全。' }}</pre>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import {
  autoPublishTask,
  cancelPublishTask,
  createDraftFromRawContent,
  createPublishTask,
  deleteRawContent,
  deleteAccount,
  deletePublishTask,
  importCollectorItem,
  confirmLoginSession,
  createLoginSession,
  loadAccountWorks,
  loadCollectorSources,
  loadDashboard,
  loadModelConfig,
  loadPublishTaskDiagnostics,
  markPublishTaskFailed,
  markPublishTaskPublished,
  openPublishEditor,
  type Account,
  type AccountWork,
  type ModelConfig,
  previewCollectorItems,
  saveModelConfig,
  testModel,
  type CollectorItem,
  type CollectorSource,
  type DashboardPayload,
  type PublishTaskDiagnostics,
  type PublishTask,
  type RawContent,
  syncAccountWorks
} from './api/client'

type PageKey = 'dashboard' | 'accounts' | 'models' | 'collector' | 'drafts' | 'publisher' | 'analytics'

const navItems: Array<{ key: PageKey; label: string; description: string }> = [
  { key: 'dashboard', label: '仪表盘', description: '采集、Agent、审核、发布和复盘的轻量闭环。' },
  { key: 'accounts', label: '账号', description: '管理平台账号、登录态和每日发布限制。' },
  { key: 'models', label: '模型', description: '配置 DeepSeek 或其他兼容模型，供 Agent 统一调用。' },
  { key: 'collector', label: '采集', description: '查看热点采集结果和原始内容。' },
  { key: 'drafts', label: '草稿', description: '查看 Agent 生成草稿并进行人工审核。' },
  { key: 'publisher', label: '发布', description: '管理待发布、发布中和失败任务。' },
  { key: 'analytics', label: '复盘', description: '分析作品表现和账号定位。' }
]

const dashboard = reactive<DashboardPayload>({
  accounts: [],
  rawContents: [],
  drafts: [],
  publishTasks: []
})
const statusText = ref('等待加载')
const activePage = ref<PageKey>('dashboard')
const currentNav = computed(() => navItems.find((item) => item.key === activePage.value) ?? navItems[0])
const loginBusy = ref(false)
const loginPlatform = ref('toutiao')
const loginSessionId = ref('')
const selectedAccountIds = ref<number[]>([])
const selectedWorkAccount = ref<Account | null>(null)
const accountWorks = ref<AccountWork[]>([])
const selectedAccountWork = ref<AccountWork | null>(null)
const collectorBusy = ref(false)
const importingUrl = ref('')
const collectorSources = ref<CollectorSource[]>([])
const collectorItems = ref<CollectorItem[]>([])
const selectedRawContent = ref<RawContent | null>(null)
const collectorSourceKey = ref('ithome')
const collectorCategoryKey = ref('home')
const publisherBusy = ref(false)
const selectedDiagnostics = ref<PublishTaskDiagnostics | null>(null)
const modelBusy = ref(false)
const modelStatusText = ref('等待加载')
const modelTestPrompt = ref('')
const modelTestResult = ref('')
const modelForm = reactive({
  provider: 'deepseek' as 'deepseek' | 'other',
  deepseek_api_key: '',
  deepseek_base_url: 'https://api.deepseek.com',
  deepseek_model: 'deepseek-chat',
  other_api_key: '',
  other_base_url: '',
  other_model: '',
  temperature: 0.7,
  timeout_seconds: 60
})
const modelKeyPlaceholders = reactive({
  deepseek: '未配置',
  other: '未配置'
})
const publishForm = reactive({
  raw_content_id: 0,
  account_id: 0,
  title: '',
  content: ''
})
const collectorCategories = computed(() => {
  const source = collectorSources.value.find((item) => item.key === collectorSourceKey.value)
  return source?.categories ?? []
})
const allAccountsSelected = computed({
  get() {
    return dashboard.accounts.length > 0 && selectedAccountIds.value.length === dashboard.accounts.length
  },
  set(checked: boolean) {
    selectedAccountIds.value = checked ? dashboard.accounts.map((account) => account.id) : []
  }
})

async function refresh() {
  statusText.value = '加载中'
  try {
    const data = await loadDashboard()
    dashboard.accounts = data.accounts
    dashboard.rawContents = data.rawContents
    dashboard.drafts = data.drafts
    dashboard.publishTasks = data.publishTasks
    const accountIds = new Set(data.accounts.map((account) => account.id))
    selectedAccountIds.value = selectedAccountIds.value.filter((accountId) => accountIds.has(accountId))
    statusText.value = '已同步'
  } catch (error) {
    console.error(error)
    statusText.value = 'API 未连接'
  }
}

function applyModelConfig(config: ModelConfig) {
  modelForm.provider = config.provider
  modelForm.deepseek_api_key = ''
  modelForm.deepseek_base_url = config.deepseek_base_url
  modelForm.deepseek_model = config.deepseek_model
  modelForm.other_api_key = ''
  modelForm.other_base_url = config.other_base_url
  modelForm.other_model = config.other_model
  modelForm.temperature = config.temperature
  modelForm.timeout_seconds = config.timeout_seconds
  modelKeyPlaceholders.deepseek = config.deepseek_api_key_configured ? '已配置，留空则不修改' : '未配置'
  modelKeyPlaceholders.other = config.other_api_key_configured ? '已配置，留空则不修改' : '未配置'
}

async function loadModels() {
  modelStatusText.value = '加载中'
  try {
    applyModelConfig(await loadModelConfig())
    modelStatusText.value = '模型配置已加载'
  } catch (error) {
    console.error(error)
    modelStatusText.value = '模型配置加载失败'
  }
}

async function saveModels() {
  modelBusy.value = true
  modelStatusText.value = '正在保存模型配置'
  try {
    const config = await saveModelConfig({ ...modelForm })
    applyModelConfig(config)
    modelStatusText.value = '模型配置已保存'
  } catch (error) {
    console.error(error)
    modelStatusText.value = '模型配置保存失败'
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
    const result = await testModel(modelTestPrompt.value)
    modelTestResult.value = `${result.provider} / ${result.model}\n\n${result.content}`
    modelStatusText.value = '模型测试成功'
  } catch (error) {
    console.error(error)
    modelStatusText.value = '模型测试失败'
  } finally {
    modelBusy.value = false
  }
}

async function openLoginSession() {
  loginBusy.value = true
  statusText.value = '正在打开登录页'
  try {
    const session = await createLoginSession(loginPlatform.value)
    loginSessionId.value = session.id
    statusText.value = '请在弹出的浏览器中完成登录'
  } catch (error) {
    console.error(error)
    statusText.value = '打开登录页失败'
  } finally {
    loginBusy.value = false
  }
}

async function confirmLogin() {
  if (!loginSessionId.value) {
    statusText.value = '请先打开登录页'
    return
  }
  loginBusy.value = true
  statusText.value = '正在保存登录态'
  try {
    const session = await confirmLoginSession(loginSessionId.value)
    if (session.status === 'completed') {
      loginSessionId.value = ''
      await refresh()
      statusText.value = '登录态已保存，账号已同步'
    } else {
      statusText.value = session.error_message || '登录确认失败'
    }
  } catch (error) {
    console.error(error)
    statusText.value = '登录确认失败'
  } finally {
    loginBusy.value = false
  }
}

async function removeAccount(account: Account) {
  if (!window.confirm(`确认删除「${account.nickname || account.uid || account.platform}」吗？`)) {
    return
  }

  loginBusy.value = true
  statusText.value = '正在删除账号'
  try {
    await deleteAccount(account.id)
    selectedAccountIds.value = selectedAccountIds.value.filter((accountId) => accountId !== account.id)
    if (selectedWorkAccount.value?.id === account.id) {
      clearAccountWorks()
    }
    if (publishForm.account_id === account.id) {
      publishForm.account_id = 0
    }
    await refresh()
    statusText.value = '账号已删除'
  } catch (error) {
    console.error(error)
    statusText.value = '账号删除失败'
  } finally {
    loginBusy.value = false
  }
}

async function removeSelectedAccounts() {
  const accountIds = [...selectedAccountIds.value]
  if (accountIds.length === 0) {
    return
  }
  if (!window.confirm(`确认删除已选中的 ${accountIds.length} 个账号吗？`)) {
    return
  }

  loginBusy.value = true
  statusText.value = '正在批量删除账号'
  try {
    await Promise.all(accountIds.map((accountId) => deleteAccount(accountId)))
    if (accountIds.includes(publishForm.account_id)) {
      publishForm.account_id = 0
    }
    if (selectedWorkAccount.value && accountIds.includes(selectedWorkAccount.value.id)) {
      clearAccountWorks()
    }
    selectedAccountIds.value = []
    await refresh()
    statusText.value = `已删除 ${accountIds.length} 个账号`
  } catch (error) {
    console.error(error)
    statusText.value = '批量删除账号失败'
  } finally {
    loginBusy.value = false
  }
}

async function syncWorks(account: Account) {
  loginBusy.value = true
  statusText.value = '正在同步作品'
  try {
    const result = await syncAccountWorks(account.id)
    selectedWorkAccount.value = account
    accountWorks.value = await loadAccountWorks(account.id)
    selectedAccountWork.value = null
    statusText.value = result.message || `已同步 ${result.synced_count} 条作品`
  } catch (error) {
    console.error(error)
    statusText.value = '同步作品失败'
  } finally {
    loginBusy.value = false
  }
}

async function showAccountWorks(account: Account) {
  loginBusy.value = true
  statusText.value = '正在加载作品'
  try {
    selectedWorkAccount.value = account
    accountWorks.value = await loadAccountWorks(account.id)
    selectedAccountWork.value = null
    statusText.value = '作品已加载'
  } catch (error) {
    console.error(error)
    statusText.value = '作品加载失败'
  } finally {
    loginBusy.value = false
  }
}

function clearAccountWorks() {
  selectedWorkAccount.value = null
  accountWorks.value = []
  selectedAccountWork.value = null
}

function selectAccountWork(work: AccountWork) {
  selectedAccountWork.value = work
}

async function loadCollectors() {
  try {
    collectorSources.value = await loadCollectorSources()
    if (!collectorSources.value.some((source) => source.key === collectorSourceKey.value)) {
      collectorSourceKey.value = collectorSources.value[0]?.key ?? ''
    }
    syncCollectorCategory()
  } catch (error) {
    console.error(error)
    statusText.value = '采集源加载失败'
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
    statusText.value = '请选择采集源'
    return
  }
  collectorBusy.value = true
  statusText.value = '正在刷新热点'
  try {
    collectorItems.value = await previewCollectorItems({
      source: collectorSourceKey.value,
      category: collectorCategoryKey.value,
      limit: 20,
      with_detail: false
    })
    statusText.value = collectorItems.value.length ? '热点已刷新' : '未获取到热点'
  } catch (error) {
    console.error(error)
    statusText.value = '热点刷新失败'
  } finally {
    collectorBusy.value = false
  }
}

async function importCollector(item: CollectorItem) {
  const existing = dashboard.rawContents.find((content) => content.source_url === item.url)
  if (existing) {
    selectedRawContent.value = existing
    statusText.value = '素材已存在'
    return
  }

  importingUrl.value = item.url
  statusText.value = '正在导入素材'
  try {
    await importCollectorItem(item)
    await refresh()
    statusText.value = '素材已导入'
  } catch (error) {
    console.error(error)
    statusText.value = '素材导入失败'
  } finally {
    importingUrl.value = ''
  }
}

async function removeRawContent(content: RawContent) {
  if (!window.confirm(`确认删除「${content.title}」吗？`)) {
    return
  }

  statusText.value = '正在删除素材'
  try {
    await deleteRawContent(content.id)
    if (selectedRawContent.value?.id === content.id) {
      selectedRawContent.value = null
    }
    await refresh()
    statusText.value = '素材已删除'
  } catch (error) {
    console.error(error)
    statusText.value = '素材删除失败'
  }
}

function formatDate(value: string) {
  return value ? new Date(value).toLocaleString('zh-CN', { hour12: false }) : '-'
}

function metricText(metrics: Record<string, unknown>, key: string) {
  const value = metrics[key]
  if (value === undefined || value === null || value === '') {
    return '-'
  }
  return String(value)
}

function syncPublishDraftForm() {
  const rawContent = dashboard.rawContents.find((content) => content.id === publishForm.raw_content_id)
  if (!rawContent) {
    publishForm.title = ''
    publishForm.content = ''
    return
  }
  publishForm.title = rawContent.title
  publishForm.content = rawContent.content
}

async function createPublisherTask() {
  if (!publishForm.raw_content_id || !publishForm.account_id) {
    statusText.value = '请选择素材和账号'
    return
  }
  if (!publishForm.title || !publishForm.content) {
    statusText.value = '请补全标题和正文'
    return
  }

  publisherBusy.value = true
  statusText.value = '正在创建发布任务'
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
    await refresh()
    statusText.value = '发布任务已创建'
  } catch (error) {
    console.error(error)
    statusText.value = '发布任务创建失败'
  } finally {
    publisherBusy.value = false
  }
}

async function openEditor(task: PublishTask) {
  publisherBusy.value = true
  statusText.value = '正在打开发布编辑页'
  try {
    await openPublishEditor(task.id)
    await refresh()
    statusText.value = '编辑页已打开，请人工确认后发布'
  } catch (error) {
    console.error(error)
    statusText.value = '打开编辑页失败'
  } finally {
    publisherBusy.value = false
  }
}

async function autoPublish(task: PublishTask) {
  const platformName = platformLabel(task.platform)
  const confirmed = window.confirm(
    `确认要自动发布「${draftTitle(task.draft_id)}」到${platformName}吗？\n\n系统会自动点击发布按钮，请确认标题、正文和图片已经检查无误。`
  )
  if (!confirmed) {
    return
  }

  publisherBusy.value = true
  statusText.value = '正在自动发布'
  try {
    await autoPublishTask(task.id)
    await refresh()
    statusText.value = '自动发布已完成'
  } catch (error) {
    console.error(error)
    statusText.value = '自动发布失败'
  } finally {
    publisherBusy.value = false
  }
}

async function markPublished(taskId: number) {
  statusText.value = '正在标记发布成功'
  try {
    await markPublishTaskPublished(taskId)
    await refresh()
    statusText.value = '任务已标记发布'
  } catch (error) {
    console.error(error)
    statusText.value = '状态更新失败'
  }
}

async function markFailed(taskId: number) {
  const reason = window.prompt('失败原因', '人工标记失败') ?? ''
  statusText.value = '正在标记失败'
  try {
    await markPublishTaskFailed(taskId, reason)
    await refresh()
    statusText.value = '任务已标记失败'
  } catch (error) {
    console.error(error)
    statusText.value = '状态更新失败'
  }
}

async function cancelTask(taskId: number) {
  statusText.value = '正在取消任务'
  try {
    await cancelPublishTask(taskId)
    await refresh()
    statusText.value = '任务已取消'
  } catch (error) {
    console.error(error)
    statusText.value = '取消任务失败'
  }
}

async function showTaskDiagnostics(taskId: number) {
  publisherBusy.value = true
  statusText.value = '正在加载任务详情'
  try {
    selectedDiagnostics.value = await loadPublishTaskDiagnostics(taskId)
    statusText.value = '任务详情已加载'
  } catch (error) {
    console.error(error)
    statusText.value = '任务详情加载失败'
  } finally {
    publisherBusy.value = false
  }
}

function clearDiagnostics() {
  selectedDiagnostics.value = null
}

async function removeTask(taskId: number) {
  if (!window.confirm('确认删除这个发布任务吗？')) {
    return
  }
  statusText.value = '正在删除任务'
  try {
    await deletePublishTask(taskId)
    await refresh()
    statusText.value = '任务已删除'
  } catch (error) {
    console.error(error)
    statusText.value = '删除任务失败'
  }
}

function accountPlatform(accountId: number) {
  return dashboard.accounts.find((account) => account.id === accountId)?.platform ?? 'toutiao'
}

function canAutoPublish(platform: string) {
  return ['toutiao', 'xiaohongshu'].includes(platform)
}

function platformLabel(platform: string) {
  const labels: Record<string, string> = {
    toutiao: '头条号',
    xiaohongshu: '小红书'
  }
  return labels[platform] ?? platform
}

function draftTitle(draftId: number) {
  return dashboard.drafts.find((draft) => draft.id === draftId)?.title ?? `草稿 #${draftId}`
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

function isPublishedTask(status: string) {
  return normalizeStatus(status) === 'published'
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

function isTerminalTask(status: string) {
  return ['published', 'failed', 'canceled'].includes(normalizeStatus(status))
}

onMounted(async () => {
  await Promise.all([refresh(), loadCollectors(), loadModels()])
})
</script>
