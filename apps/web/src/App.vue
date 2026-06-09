<!--
实现逻辑：
1. 提供 H5 管理端的仪表盘、账号、模型、Agent、Skills、采集、发布任务等核心工作台页面。
2. 账号页负责平台登录态接入，模型页负责保存和测试模型配置，Agent 页负责绑定模型、Skills 和提示词。
3. 账号页支持单个删除、批量删除和头条号作品同步，智能筛选页可调用挑选 Agent，复盘页基于已同步作品调用对应 Agent。
4. 发布任务页根据任务状态展示可用操作。
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
          <div v-for="account in pageItems(dashboard.accounts, 'accounts')" :key="account.id" class="table-row account-table-row">
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
        <PaginationBar
          v-if="shouldShowPagination(dashboard.accounts, 'accounts')"
          v-model:page="pagination.accounts.page"
          v-model:page-size="pagination.accounts.pageSize"
          :total="dashboard.accounts.length"
        />
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
            <div v-for="work in pageItems(accountWorks, 'accountWorks')" :key="work.id" class="table-row account-work-row">
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
          <PaginationBar
            v-if="shouldShowPagination(accountWorks, 'accountWorks')"
            v-model:page="pagination.accountWorks.page"
            v-model:page-size="pagination.accountWorks.pageSize"
            :total="accountWorks.length"
          />
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
          <article v-for="item in pageItems(collectorItems, 'collectorItems')" :key="item.url" class="collector-item">
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
        <PaginationBar
          v-if="shouldShowPagination(collectorItems, 'collectorItems')"
          v-model:page="pagination.collectorItems.page"
          v-model:page-size="pagination.collectorItems.pageSize"
          :total="collectorItems.length"
        />

        <div class="panel-title compact-title">
          <h2>素材库</h2>
          <span>{{ dashboard.rawContents.length }} 条</span>
        </div>
        <div v-if="dashboard.rawContents.length === 0" class="empty">
          暂无采集内容
        </div>
        <template v-else>
          <div class="table">
            <div class="table-row collector-table-head">
              <span class="checkbox-cell">
                <input v-model="allRawContentsSelected" type="checkbox" />
              </span>
              <span>来源</span>
              <span>标题</span>
              <span>状态</span>
              <span>时间</span>
              <span>操作</span>
            </div>
            <div v-for="content in pageItems(dashboard.rawContents, 'rawContents')" :key="content.id" class="table-row collector-table-row">
              <span class="checkbox-cell">
                <input v-model="selectedRawContentIds" type="checkbox" :value="content.id" />
              </span>
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
          <PaginationBar
            v-if="shouldShowPagination(dashboard.rawContents, 'rawContents')"
            v-model:page="pagination.rawContents.page"
            v-model:page-size="pagination.rawContents.pageSize"
            :total="dashboard.rawContents.length"
          />
        </template>

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

      <section v-else-if="activePage === 'smart-filter'" class="panel">
        <div class="panel-title">
          <h2>智能筛选</h2>
          <span>{{ statusText }}</span>
        </div>
        <div class="collector-selection-toolbar smart-filter-toolbar">
          <span class="selection-count">已选 {{ selectedRawContentIds.length }} 条</span>
          <label class="selection-agent-field">
            <span>挑选 Agent</span>
            <select v-model.number="contentSelectionAgentId">
              <option :value="0">默认挑选 Agent</option>
              <option v-for="config in contentSelectionAgents" :key="config.id" :value="config.id">
                {{ config.name }}
              </option>
            </select>
          </label>
          <label class="selection-agent-field">
            <span>依据复盘</span>
            <select v-model.number="contentSelectionReviewReportId">
              <option :value="0">不使用复盘</option>
              <option v-for="report in reviewReports" :key="report.id" :value="report.id">
                {{ selectionReviewLabel(report) }}
              </option>
            </select>
          </label>
          <div class="selection-actions">
            <button
              class="primary"
              @click="runContentSelection"
              :disabled="contentSelectionBusy || !canRunContentSelection"
            >
              {{ contentSelectionBusy ? '筛选中' : '智能采集筛选' }}
            </button>
          </div>
        </div>

        <div class="panel-title compact-title">
          <h2>素材候选</h2>
          <span>{{ dashboard.rawContents.length }} 条</span>
        </div>
        <div v-if="dashboard.rawContents.length === 0" class="empty">
          暂无采集内容，选择复盘后可直接智能采集筛选。
        </div>
        <template v-else>
          <div class="table">
            <div class="table-row collector-table-head">
              <span class="checkbox-cell">
                <input v-model="allRawContentsSelected" type="checkbox" />
              </span>
              <span>来源</span>
              <span>标题</span>
              <span>状态</span>
              <span>时间</span>
              <span>操作</span>
            </div>
            <div v-for="content in pageItems(dashboard.rawContents, 'rawContents')" :key="content.id" class="table-row collector-table-row">
              <span class="checkbox-cell">
                <input v-model="selectedRawContentIds" type="checkbox" :value="content.id" />
              </span>
              <span>{{ content.source }}</span>
              <span>{{ content.title }}</span>
              <span>{{ content.status }}</span>
              <span>{{ formatDate(content.created_at) }}</span>
              <span class="row-actions">
                <button class="text-button" @click="selectedRawContent = content">查看</button>
              </span>
            </div>
          </div>
          <PaginationBar
            v-if="shouldShowPagination(dashboard.rawContents, 'rawContents')"
            v-model:page="pagination.rawContents.page"
            v-model:page-size="pagination.rawContents.pageSize"
            :total="dashboard.rawContents.length"
          />
        </template>

        <section v-if="contentSelectionResult" class="selection-result-panel">
          <div class="panel-title compact-title">
            <h2>筛选结果</h2>
            <span>{{ contentSelectionResult.agent_name || '默认 Agent' }} / {{ contentSelectionResult.model }}</span>
          </div>
          <div class="selection-result-list">
            <article
              v-for="item in pageItems(contentSelectionResult.results, 'selectionResults')"
              :key="item.raw_content_id"
              class="selection-result-item"
            >
              <div class="selection-result-main">
                <strong>{{ rawContentTitle(item.raw_content_id) }}</strong>
                <p>{{ item.reason || '-' }}</p>
                <small v-if="item.suggested_angle">角度：{{ item.suggested_angle }}</small>
                <small v-if="item.suggested_title">标题：{{ item.suggested_title }}</small>
                <small v-if="item.data_limits.length">限制：{{ item.data_limits.join('、') }}</small>
              </div>
              <div class="selection-result-meta">
                <span class="status-badge" :class="selectionResultClass(item)">
                  {{ item.selected ? '建议选择' : '不建议' }}
                </span>
                <strong>{{ item.score }}</strong>
                <small>{{ selectionRiskLabel(item.risk) }}</small>
              </div>
            </article>
          </div>
          <PaginationBar
            v-if="shouldShowPagination(contentSelectionResult.results, 'selectionResults')"
            v-model:page="pagination.selectionResults.page"
            v-model:page-size="pagination.selectionResults.pageSize"
            :total="contentSelectionResult.results.length"
          />
        </section>
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
          <div v-for="task in pageItems(dashboard.publishTasks, 'publishTasks')" :key="task.id" class="table-row publish-table-row">
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
        <PaginationBar
          v-if="shouldShowPagination(dashboard.publishTasks, 'publishTasks')"
          v-model:page="pagination.publishTasks.page"
          v-model:page-size="pagination.publishTasks.pageSize"
          :total="dashboard.publishTasks.length"
        />
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
        <div class="panel-title compact-title">
          <h2>模型列表</h2>
          <span>{{ modelConfigs.length }} 条</span>
        </div>
        <div class="model-toolbar">
          <span>{{ modelStatusText }}</span>
          <button class="primary" @click="openCreateModelModal" :disabled="modelBusy">新增模型</button>
        </div>

        <div v-if="modelConfigs.length === 0" class="empty">
          暂无模型配置
        </div>
        <table v-else class="model-config-table">
          <thead>
            <tr>
              <th>名称</th>
              <th>类型</th>
              <th>模型</th>
              <th>API Key</th>
              <th>默认</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="config in pageItems(modelConfigs, 'models')" :key="config.id">
              <td>{{ config.name }}</td>
              <td>{{ modelProviderLabel(config.provider) }}</td>
              <td>{{ config.model || '-' }}</td>
              <td>{{ config.api_key_configured ? '已配置' : '未配置' }}</td>
              <td>
                <span v-if="config.is_default" class="status-badge status-published">默认</span>
                <template v-else>-</template>
              </td>
              <td>
                <span class="row-actions model-row-actions">
                  <button class="text-button" @click="openEditModelModal(config)" :disabled="modelBusy">编辑</button>
                  <button class="text-button" @click="setDefaultModel(config.id)" :disabled="modelBusy || config.is_default">
                    设默认
                  </button>
                  <button class="text-button danger" @click="removeModel(config)" :disabled="modelBusy">删除</button>
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        <PaginationBar
          v-if="shouldShowPagination(modelConfigs, 'models')"
          v-model:page="pagination.models.page"
          v-model:page-size="pagination.models.pageSize"
          :total="modelConfigs.length"
        />
      </section>

      <section v-else-if="activePage === 'agents'" class="panel">
        <div class="panel-title compact-title">
          <h2>Agent 列表</h2>
          <span>{{ agentConfigs.length }} 条</span>
        </div>
        <div class="model-toolbar">
          <span>{{ agentStatusText }}</span>
          <button class="primary" @click="openCreateAgentModal" :disabled="agentBusy">新增 Agent</button>
        </div>

        <div v-if="agentConfigs.length === 0" class="empty">
          暂无 Agent 配置
        </div>
        <table v-else class="agent-config-table">
          <thead>
            <tr>
              <th>名称</th>
              <th>类型</th>
              <th>模型</th>
              <th>Skills</th>
              <th>状态</th>
              <th>默认</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="config in pageItems(agentConfigs, 'agents')" :key="config.id">
              <td>{{ config.name }}</td>
              <td>{{ agentTypeLabel(config.agent_type) }}</td>
              <td>{{ config.model_config_name }}</td>
              <td>{{ config.skill_names.length ? config.skill_names.join('、') : '-' }}</td>
              <td>{{ config.enabled ? '启用' : '禁用' }}</td>
              <td>
                <span v-if="config.is_default" class="status-badge status-published">默认</span>
                <template v-else>-</template>
              </td>
              <td>
                <span class="row-actions model-row-actions">
                  <button class="text-button" @click="openEditAgentModal(config)" :disabled="agentBusy">编辑</button>
                  <button class="text-button" @click="setDefaultAgent(config.id)" :disabled="agentBusy || config.is_default">
                    设默认
                  </button>
                  <button class="text-button danger" @click="removeAgent(config)" :disabled="agentBusy">删除</button>
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        <PaginationBar
          v-if="shouldShowPagination(agentConfigs, 'agents')"
          v-model:page="pagination.agents.page"
          v-model:page-size="pagination.agents.pageSize"
          :total="agentConfigs.length"
        />
      </section>

      <section v-else-if="activePage === 'skills'" class="panel">
        <div class="panel-title compact-title">
          <h2>本地 Skills</h2>
          <span>{{ localSkills.length }} 条</span>
        </div>
        <div class="skills-local-toolbar">
          <label>
            <span>目录</span>
            <input :value="localSkillsRoot || '-'" readonly />
          </label>
          <span>{{ skillStatusText }}</span>
          <button class="primary" @click="reloadSkillsDirectory" :disabled="skillBusy">
            {{ skillBusy ? '加载中' : '加载 Skills' }}
          </button>
        </div>

        <div v-if="localSkills.length === 0" class="empty">
          当前目录暂无 SKILL.md
        </div>
        <table v-else class="skill-config-table">
          <thead>
            <tr>
              <th>名称</th>
              <th>描述</th>
              <th>路径</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="config in pageItems(localSkills, 'skills')" :key="config.path">
              <td>{{ config.name }}</td>
              <td>{{ config.description || '-' }}</td>
              <td>{{ config.path }}</td>
              <td>
                <span class="row-actions model-row-actions">
                  <button class="text-button" @click="selectedLocalSkill = config">查看</button>
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        <PaginationBar
          v-if="shouldShowPagination(localSkills, 'skills')"
          v-model:page="pagination.skills.page"
          v-model:page-size="pagination.skills.pageSize"
          :total="localSkills.length"
        />
        <section v-if="selectedLocalSkill" class="local-skill-detail">
          <div class="work-content-header">
            <h4>{{ selectedLocalSkill.name }}</h4>
            <button class="text-button" @click="selectedLocalSkill = null">关闭</button>
          </div>
          <p>{{ selectedLocalSkill.description || selectedLocalSkill.path }}</p>
          <pre>{{ selectedLocalSkill.content || '暂无内容' }}</pre>
        </section>
      </section>

      <section v-else-if="activePage === 'account-profile'" class="panel">
        <div class="panel-title compact-title">
          <h2>账号肖像鉴定</h2>
          <span>{{ profileStatusText }}</span>
        </div>
        <div class="review-toolbar">
          <label>
            <span>账号</span>
            <select v-model.number="profileForm.account_id" @change="loadProfileContext">
              <option :value="0">请选择账号</option>
              <option v-for="account in dashboard.accounts" :key="account.id" :value="account.id">
                {{ account.nickname || account.uid || account.platform }} / {{ platformLabel(account.platform) }}
              </option>
            </select>
          </label>
          <label>
            <span>复盘报告</span>
            <select v-model.number="profileForm.review_report_id">
              <option :value="0">使用最近复盘</option>
              <option v-for="report in profileReviewReports" :key="report.id" :value="report.id">
                {{ formatDate(report.created_at) }} / {{ report.works_count }} 作品
              </option>
            </select>
          </label>
          <label>
            <span>肖像 Agent</span>
            <select v-model.number="profileForm.agent_id">
              <option :value="0">默认肖像 Agent</option>
              <option v-for="config in profileAgents" :key="config.id" :value="config.id">
                {{ config.name }}
              </option>
            </select>
          </label>
          <button class="primary" @click="generateProfile" :disabled="profileBusy">
            {{ profileBusy ? '鉴定中' : '生成肖像' }}
          </button>
        </div>
        <section class="review-history">
          <div class="panel-title compact-title">
            <h2>肖像历史</h2>
            <span>{{ profileReports.length }} 条</span>
          </div>
          <div v-if="profileReports.length === 0" class="empty compact-empty">
            暂无账号肖像历史
          </div>
          <div v-else class="table">
            <div class="table-row review-history-row table-head">
              <span>时间</span>
              <span>Agent</span>
              <span>模型</span>
              <span>作品数</span>
              <span>状态</span>
              <span>操作</span>
            </div>
            <div v-for="report in pageItems(profileReports, 'profileReports')" :key="report.id" class="table-row review-history-row">
              <span>{{ formatDate(report.created_at) }}</span>
              <span>{{ report.agent_name || '-' }}</span>
              <span>{{ report.provider }} / {{ report.model }}</span>
              <span>{{ report.works_count }}</span>
              <span>
                <span v-if="selectedProfileReportId === report.id" class="status-badge status-published">查看中</span>
                <template v-else>-</template>
              </span>
              <span class="row-actions">
                <button class="text-button" @click="selectProfileReport(report)">查看</button>
                <button class="text-button danger" @click="removeProfileReport(report)">删除</button>
              </span>
            </div>
          </div>
          <PaginationBar
            v-if="shouldShowPagination(profileReports, 'profileReports')"
            v-model:page="pagination.profileReports.page"
            v-model:page-size="pagination.profileReports.pageSize"
            :total="profileReports.length"
          />
        </section>
        <div v-if="dashboard.accounts.length === 0" class="empty">
          暂无账号，请先完成账号登录。
        </div>
        <div v-else-if="!profileResult" class="empty">
          选择账号后生成账号肖像。
        </div>
        <section v-else class="review-result">
          <div class="diagnostics-grid">
            <span>生成时间</span>
            <strong>{{ profileResultCreatedAt }}</strong>
            <span>Agent</span>
            <strong>{{ profileResult.agent_name || '-' }}</strong>
            <span>模型</span>
            <strong>{{ profileResult.provider }} / {{ profileResult.model }}</strong>
            <span>作品数</span>
            <strong>{{ profileResult.works_count }}</strong>
          </div>
          <div class="review-section">
            <h3>整体肖像</h3>
            <p>{{ profileResult.profile.summary || '-' }}</p>
          </div>
          <div class="review-section">
            <h3>定位与受众</h3>
            <p>{{ profileResult.profile.positioning || '-' }}</p>
            <p>{{ profileResult.profile.audience_profile || '-' }}</p>
          </div>
          <div class="review-section">
            <h3>内容赛道</h3>
            <ul>
              <li v-for="item in reviewList(profileResult.profile.content_tracks)" :key="item">{{ item }}</li>
            </ul>
          </div>
          <div class="review-section">
            <h3>标题风格</h3>
            <ul>
              <li v-for="item in reviewList(profileResult.profile.title_style)" :key="item">{{ item }}</li>
            </ul>
          </div>
          <div class="review-section">
            <h3>适合数据源</h3>
            <div v-for="source in profileResult.profile.source_preferences" :key="`${source.source}-${source.category}-${source.reason}`" class="review-item">
              <strong>{{ source.source || '-' }} / {{ source.category || '-' }} / {{ priorityLabel(source.priority) }}</strong>
              <p>{{ source.reason || '-' }}</p>
              <small>{{ source.keywords.join('、') || '-' }}</small>
            </div>
            <div v-if="profileResult.profile.source_preferences.length === 0" class="diagnostics-empty">暂无数据</div>
          </div>
          <div class="review-section">
            <h3>选题关键词</h3>
            <ul>
              <li v-for="item in reviewList(profileResult.profile.topic_keywords)" :key="item">{{ item }}</li>
            </ul>
          </div>
          <div class="review-section">
            <h3>边界与禁区</h3>
            <div class="review-columns">
              <div>
                <h4>禁止方向</h4>
                <ul>
                  <li v-for="item in reviewList(profileResult.profile.forbidden_topics)" :key="item">{{ item }}</li>
                </ul>
              </div>
              <div>
                <h4>风险边界</h4>
                <ul>
                  <li v-for="item in reviewList(profileResult.profile.risk_boundaries)" :key="item">{{ item }}</li>
                </ul>
              </div>
            </div>
          </div>
          <div class="review-section">
            <h3>发布建议</h3>
            <ul>
              <li v-for="item in reviewList(profileResult.profile.publishing_advice)" :key="item">{{ item }}</li>
            </ul>
          </div>
          <div v-if="profileResult.profile.data_limits.length" class="review-section">
            <h3>数据限制</h3>
            <ul>
              <li v-for="item in profileResult.profile.data_limits" :key="item">{{ item }}</li>
            </ul>
          </div>
        </section>
      </section>

      <section v-else-if="activePage === 'analytics'" class="panel">
        <div class="panel-title compact-title">
          <h2>账号复盘</h2>
          <span>{{ reviewStatusText }}</span>
        </div>
        <div class="review-toolbar">
          <label>
            <span>账号</span>
            <select v-model.number="reviewForm.account_id" @change="loadReviewReports">
              <option :value="0">请选择账号</option>
              <option v-for="account in dashboard.accounts" :key="account.id" :value="account.id">
                {{ account.nickname || account.uid || account.platform }} / {{ platformLabel(account.platform) }}
              </option>
            </select>
          </label>
          <label>
            <span>复盘 Agent</span>
            <select v-model.number="reviewForm.agent_id">
              <option :value="0">默认复盘 Agent</option>
              <option v-for="config in reviewAgents" :key="config.id" :value="config.id">
                {{ config.name }}
              </option>
            </select>
          </label>
          <button class="primary" @click="generateReview" :disabled="reviewBusy">
            {{ reviewBusy ? '生成中' : '生成复盘' }}
          </button>
        </div>
        <section class="review-history">
          <div class="panel-title compact-title">
            <h2>复盘历史</h2>
            <span>{{ reviewReports.length }} 条</span>
          </div>
          <div v-if="reviewReports.length === 0" class="empty compact-empty">
            暂无复盘历史
          </div>
          <div v-else class="table">
            <div class="table-row review-history-row table-head">
              <span>时间</span>
              <span>Agent</span>
              <span>模型</span>
              <span>作品数</span>
              <span>状态</span>
              <span>操作</span>
            </div>
            <div v-for="report in pageItems(reviewReports, 'reviewReports')" :key="report.id" class="table-row review-history-row">
              <span>{{ formatDate(report.created_at) }}</span>
              <span>{{ report.agent_name || '-' }}</span>
              <span>{{ report.provider }} / {{ report.model }}</span>
              <span>{{ report.works_count }}</span>
              <span>
                <span v-if="selectedReviewReportId === report.id" class="status-badge status-published">查看中</span>
                <template v-else>-</template>
              </span>
              <span class="row-actions">
                <button class="text-button" @click="selectReviewReport(report)">查看</button>
                <button class="text-button danger" @click="removeReviewReport(report)">删除</button>
              </span>
            </div>
          </div>
          <PaginationBar
            v-if="shouldShowPagination(reviewReports, 'reviewReports')"
            v-model:page="pagination.reviewReports.page"
            v-model:page-size="pagination.reviewReports.pageSize"
            :total="reviewReports.length"
          />
        </section>
        <div v-if="dashboard.accounts.length === 0" class="empty">
          暂无账号，请先完成账号登录。
        </div>
        <div v-else-if="!reviewResult" class="empty">
          选择已同步作品的账号后生成复盘。
        </div>
        <section v-else class="review-result">
          <div class="diagnostics-grid">
            <span>生成时间</span>
            <strong>{{ reviewResultCreatedAt }}</strong>
            <span>Agent</span>
            <strong>{{ reviewResult.agent_name || '-' }}</strong>
            <span>模型</span>
            <strong>{{ reviewResult.provider }} / {{ reviewResult.model }}</strong>
            <span>作品数</span>
            <strong>{{ reviewResult.works_count }}</strong>
          </div>
          <div class="review-section">
            <h3>整体判断</h3>
            <p>{{ reviewResult.report.summary || '-' }}</p>
          </div>
          <div class="review-section">
            <h3>内容定位</h3>
            <p>{{ reviewResult.report.positioning.current_direction || '-' }}</p>
            <div class="review-columns">
              <div>
                <h4>优势</h4>
                <ul>
                  <li v-for="item in reviewList(reviewResult.report.positioning.strengths)" :key="item">{{ item }}</li>
                </ul>
              </div>
              <div>
                <h4>风险</h4>
                <ul>
                  <li v-for="item in reviewList(reviewResult.report.positioning.risks)" :key="item">{{ item }}</li>
                </ul>
              </div>
            </div>
          </div>
          <div class="review-section">
            <h3>高表现作品</h3>
            <div v-for="work in reviewResult.report.top_works" :key="work.title" class="review-item">
              <strong>{{ work.title || '-' }}</strong>
              <p>{{ work.reason || '-' }}</p>
              <small>{{ work.evidence || '-' }}</small>
            </div>
            <div v-if="reviewResult.report.top_works.length === 0" class="diagnostics-empty">暂无数据</div>
          </div>
          <div class="review-section">
            <h3>标题分析</h3>
            <div class="review-columns">
              <div>
                <h4>规律</h4>
                <ul>
                  <li v-for="item in reviewList(reviewResult.report.title_analysis.patterns)" :key="item">{{ item }}</li>
                </ul>
              </div>
              <div>
                <h4>问题</h4>
                <ul>
                  <li v-for="item in reviewList(reviewResult.report.title_analysis.problems)" :key="item">{{ item }}</li>
                </ul>
              </div>
              <div>
                <h4>公式</h4>
                <ul>
                  <li v-for="item in reviewList(reviewResult.report.title_analysis.formulas)" :key="item">{{ item }}</li>
                </ul>
              </div>
            </div>
          </div>
          <div class="review-section">
            <h3>内容结构</h3>
            <p>{{ reviewResult.report.content_structure.template || '-' }}</p>
            <div class="review-columns">
              <div>
                <h4>优点</h4>
                <ul>
                  <li v-for="item in reviewList(reviewResult.report.content_structure.strengths)" :key="item">{{ item }}</li>
                </ul>
              </div>
              <div>
                <h4>问题</h4>
                <ul>
                  <li v-for="item in reviewList(reviewResult.report.content_structure.problems)" :key="item">{{ item }}</li>
                </ul>
              </div>
            </div>
          </div>
          <div class="review-section">
            <h3>受众洞察</h3>
            <p>{{ reviewResult.report.audience.profile || '-' }}</p>
            <div class="review-columns">
              <div>
                <h4>兴趣点</h4>
                <ul>
                  <li v-for="item in reviewList(reviewResult.report.audience.interests)" :key="item">{{ item }}</li>
                </ul>
              </div>
              <div>
                <h4>未满足需求</h4>
                <ul>
                  <li v-for="item in reviewList(reviewResult.report.audience.unmet_needs)" :key="item">{{ item }}</li>
                </ul>
              </div>
            </div>
          </div>
          <div class="review-section">
            <h3>选题建议</h3>
            <div v-for="topic in reviewResult.report.topic_suggestions" :key="topic.topic" class="review-item">
              <strong>{{ topic.topic || '-' }}</strong>
              <p>{{ topic.title_direction || '-' }}</p>
              <small>{{ topic.reason || '-' }} / {{ topic.angle || '-' }} / {{ topic.metric || '-' }}</small>
            </div>
            <div v-if="reviewResult.report.topic_suggestions.length === 0" class="diagnostics-empty">暂无数据</div>
          </div>
          <div class="review-section">
            <h3>优化动作</h3>
            <div v-for="action in reviewResult.report.actions" :key="action.action" class="review-item">
              <strong>{{ action.action || '-' }}</strong>
              <p>{{ priorityLabel(action.priority) }} / {{ action.metric || '-' }} / {{ action.cycle || '-' }}</p>
            </div>
            <div v-if="reviewResult.report.actions.length === 0" class="diagnostics-empty">暂无数据</div>
          </div>
          <div v-if="reviewResult.report.data_limits.length" class="review-section">
            <h3>数据限制</h3>
            <ul>
              <li v-for="item in reviewResult.report.data_limits" :key="item">{{ item }}</li>
            </ul>
          </div>
        </section>
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
    <div v-if="modelModalOpen" class="modal-backdrop" @click.self="closeModelModal">
      <section class="model-config-modal" role="dialog" aria-modal="true">
        <div class="work-content-header">
          <h4>{{ modelForm.id ? '编辑模型' : '新增模型' }}</h4>
          <button class="text-button" @click="closeModelModal">关闭</button>
        </div>
        <div class="model-config-block modal-form-block">
          <label>
            <span>配置名称</span>
            <input v-model.trim="modelForm.name" />
          </label>
          <label>
            <span>模型类型</span>
            <select v-model="modelForm.provider" @change="syncModelDefaults">
              <option value="deepseek">DeepSeek</option>
              <option value="other">其他模型</option>
            </select>
          </label>
          <label>
            <span>API Key</span>
            <input v-model.trim="modelForm.api_key" type="password" :placeholder="modelKeyPlaceholder" />
          </label>
          <label>
            <span>Base URL</span>
            <input v-model.trim="modelForm.base_url" placeholder="https://api.deepseek.com" />
          </label>
          <label>
            <span>Model</span>
            <input v-model.trim="modelForm.model" placeholder="deepseek-chat" />
          </label>
          <label>
            <span>Temperature</span>
            <input v-model.number="modelForm.temperature" type="number" min="0" max="2" step="0.1" />
          </label>
          <label>
            <span>Timeout 秒数</span>
            <input v-model.number="modelForm.timeout_seconds" type="number" min="5" max="300" />
          </label>
          <label class="inline-check">
            <input v-model="modelForm.is_default" type="checkbox" />
            <span>设为全局默认</span>
          </label>
        </div>
        <div class="model-test-panel">
          <textarea v-model="modelTestPrompt" rows="4" placeholder="输入测试提示词"></textarea>
          <div class="model-actions">
            <button class="primary" @click="saveModels" :disabled="modelBusy">
              {{ modelForm.id ? '保存模型' : '新增模型' }}
            </button>
            <button class="secondary" @click="runModelTest" :disabled="modelBusy">测试模型</button>
          </div>
          <pre v-if="modelTestResult">{{ modelTestResult }}</pre>
        </div>
      </section>
    </div>
    <div v-if="agentModalOpen" class="modal-backdrop" @click.self="closeAgentModal">
      <section class="agent-config-modal" role="dialog" aria-modal="true">
        <div class="work-content-header">
          <h4>{{ agentForm.id ? '编辑 Agent' : '新增 Agent' }}</h4>
          <button class="text-button" @click="closeAgentModal">关闭</button>
        </div>
        <div class="model-config-block modal-form-block">
          <label>
            <span>Agent 名称</span>
            <input v-model.trim="agentForm.name" />
          </label>
          <label>
            <span>Agent 类型</span>
            <select v-model="agentForm.agent_type" @change="syncAgentDefaults">
              <option value="account_review">账号复盘</option>
              <option value="content_selection">素材挑选</option>
              <option value="account_profile">账号肖像</option>
            </select>
          </label>
          <label>
            <span>绑定模型</span>
            <select v-model.number="agentForm.model_config_id">
              <option :value="0">全局默认模型</option>
              <option v-for="config in modelConfigs" :key="config.id" :value="config.id">
                {{ config.name }} / {{ config.model }}
              </option>
            </select>
          </label>
          <label class="inline-check">
            <input v-model="agentForm.enabled" type="checkbox" />
            <span>启用</span>
          </label>
          <label class="inline-check">
            <input v-model="agentForm.is_default" type="checkbox" />
            <span>设为默认</span>
          </label>
        </div>
        <section class="skill-picker">
          <div class="skill-picker-title">
            <span>绑定 Skills</span>
            <strong>{{ agentForm.skill_paths.length }} 个</strong>
          </div>
          <div v-if="localSkills.length === 0" class="empty compact-empty">
            暂无 Skills
          </div>
          <label v-for="skill in localSkills" v-else :key="skill.relative_path" class="skill-check">
            <input v-model="agentForm.skill_paths" type="checkbox" :value="skill.relative_path" />
            <span>{{ skill.name }}</span>
            <small>{{ skill.description || skill.relative_path }}</small>
          </label>
        </section>
        <div class="agent-prompt-block">
          <label class="stacked-field">
            <span>System Prompt</span>
            <textarea v-model="agentForm.system_prompt" rows="4"></textarea>
          </label>
          <label class="stacked-field">
            <span>User Prompt</span>
            <textarea v-model="agentForm.user_prompt_template" rows="8"></textarea>
          </label>
          <div class="model-actions">
            <button class="primary" @click="saveAgent" :disabled="agentBusy">
              {{ agentForm.id ? '保存 Agent' : '新增 Agent' }}
            </button>
          </div>
        </div>
      </section>
    </div>
    <div v-if="skillModalOpen" class="modal-backdrop" @click.self="closeSkillModal">
      <section class="skill-config-modal" role="dialog" aria-modal="true">
        <div class="work-content-header">
          <h4>{{ skillForm.id ? '编辑 Skill' : '新增 Skill' }}</h4>
          <button class="text-button" @click="closeSkillModal">关闭</button>
        </div>
        <div class="model-config-block modal-form-block">
          <label>
            <span>Skill 名称</span>
            <input v-model.trim="skillForm.name" />
          </label>
          <label>
            <span>Skill 类型</span>
            <select v-model="skillForm.skill_type">
              <option value="prompt">Prompt</option>
            </select>
          </label>
          <label>
            <span>描述</span>
            <input v-model.trim="skillForm.description" />
          </label>
          <label class="inline-check">
            <input v-model="skillForm.enabled" type="checkbox" />
            <span>启用</span>
          </label>
        </div>
        <div class="agent-prompt-block">
          <label class="stacked-field">
            <span>Skill 内容</span>
            <textarea v-model="skillForm.content" rows="10"></textarea>
          </label>
          <div class="model-actions">
            <button class="primary" @click="saveSkill" :disabled="skillBusy">
              {{ skillForm.id ? '保存 Skill' : '新增 Skill' }}
            </button>
          </div>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, reactive, ref } from 'vue'
import {
  autoPublishTask,
  cancelPublishTask,
  createAgentConfig,
  createDraftFromRawContent,
  createModelConfig,
  createPublishTask,
  createSkillConfig,
  deleteAccountProfileReport,
  deleteAgentConfig,
  deleteAccountReviewReport,
  deleteRawContent,
  deleteAccount,
  deleteModelConfig,
  deletePublishTask,
  deleteSkillConfig,
  generateAccountReview,
  generateAccountProfile,
  importCollectorItem,
  confirmLoginSession,
  createLoginSession,
  loadAccountWorks,
  loadAgentConfigs,
  loadAccountProfileReports,
  loadAccountReviewReports,
  loadCollectorSources,
  loadDashboard,
  loadLocalSkills,
  loadModelConfigs,
  loadPublishTaskDiagnostics,
  loadSkillConfigs,
  markPublishTaskFailed,
  markPublishTaskPublished,
  openPublishEditor,
  reloadLocalSkills,
  selectCollectedContent,
  setDefaultAgentConfig,
  type Account,
  type AccountProfileReportRecord,
  type AccountProfileResult,
  type AgentConfig,
  type AccountReviewReportRecord,
  type AccountReviewResult,
  type AccountWork,
  type ContentSelectionItem,
  type ContentSelectionResult,
  type ModelConfig,
  previewCollectorItems,
  setDefaultModelConfig,
  testModel,
  type CollectorItem,
  type CollectorSource,
  type DashboardPayload,
  type LocalSkill,
  type PublishTaskDiagnostics,
  type PublishTask,
  type RawContent,
  type SkillConfig,
  syncAccountWorks,
  updateAgentConfig,
  updateModelConfig,
  updateSkillConfig
} from './api/client'

type PageKey =
  | 'dashboard'
  | 'accounts'
  | 'models'
  | 'agents'
  | 'skills'
  | 'collector'
  | 'smart-filter'
  | 'account-profile'
  | 'drafts'
  | 'publisher'
  | 'analytics'
type PaginationKey =
  | 'accounts'
  | 'accountWorks'
  | 'collectorItems'
  | 'rawContents'
  | 'selectionResults'
  | 'publishTasks'
  | 'models'
  | 'agents'
  | 'skills'
  | 'reviewReports'
  | 'profileReports'

const pageSizeOptions = [10, 20, 50]

const PaginationBar = defineComponent({
  name: 'PaginationBar',
  props: {
    total: { type: Number, required: true },
    page: { type: Number, required: true },
    pageSize: { type: Number, required: true }
  },
  emits: ['update:page', 'update:pageSize'],
  setup(props, { emit }) {
    const totalPages = () => Math.max(1, Math.ceil(props.total / props.pageSize))
    const currentPage = () => Math.min(Math.max(1, props.page), totalPages())
    return () =>
      h('div', { class: 'pagination-bar' }, [
        h('span', `共 ${props.total} 条`),
        h('label', [
          h('span', '每页'),
          h(
            'select',
            {
              value: props.pageSize,
              onChange: (event: Event) => {
                emit('update:pageSize', Number((event.target as HTMLSelectElement).value))
                emit('update:page', 1)
              }
            },
            pageSizeOptions.map((size) => h('option', { value: size }, String(size)))
          )
        ]),
        h(
          'button',
          {
            class: 'text-button',
            disabled: currentPage() <= 1,
            onClick: () => emit('update:page', currentPage() - 1)
          },
          '上一页'
        ),
        h('strong', `${currentPage()} / ${totalPages()}`),
        h(
          'button',
          {
            class: 'text-button',
            disabled: currentPage() >= totalPages(),
            onClick: () => emit('update:page', currentPage() + 1)
          },
          '下一页'
        )
      ])
  }
})

const navItems: Array<{ key: PageKey; label: string; description: string }> = [
  { key: 'dashboard', label: '仪表盘', description: '采集、Agent、审核、发布和复盘的轻量闭环。' },
  { key: 'accounts', label: '账号', description: '管理平台账号、登录态和每日发布限制。' },
  { key: 'models', label: '模型', description: '配置 DeepSeek 或其他兼容模型，供 Agent 统一调用。' },
  { key: 'agents', label: 'Agent', description: '配置 Agent 类型、绑定模型和执行提示词。' },
  { key: 'skills', label: 'Skills', description: '配置可复用 Skill，供 Agent 执行时注入。' },
  { key: 'collector', label: '采集', description: '手动预览热点、导入素材并管理原始内容。' },
  { key: 'smart-filter', label: '智能筛选', description: '根据复盘选择数据源、采集文章并调用 Agent 筛选素材。' },
  { key: 'account-profile', label: '账号肖像', description: '基于作品和复盘鉴定账号定位、受众、赛道和采集边界。' },
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
const pagination = reactive<Record<PaginationKey, { page: number; pageSize: number }>>({
  accounts: { page: 1, pageSize: 10 },
  accountWorks: { page: 1, pageSize: 10 },
  collectorItems: { page: 1, pageSize: 10 },
  rawContents: { page: 1, pageSize: 10 },
  selectionResults: { page: 1, pageSize: 10 },
  publishTasks: { page: 1, pageSize: 10 },
  models: { page: 1, pageSize: 10 },
  agents: { page: 1, pageSize: 10 },
  skills: { page: 1, pageSize: 10 },
  reviewReports: { page: 1, pageSize: 10 },
  profileReports: { page: 1, pageSize: 10 }
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
const selectedRawContentIds = ref<number[]>([])
const contentSelectionBusy = ref(false)
const contentSelectionAgentId = ref(0)
const contentSelectionReviewReportId = ref(0)
const contentSelectionResult = ref<ContentSelectionResult | null>(null)
const collectorSourceKey = ref('ithome')
const collectorCategoryKey = ref('home')
const publisherBusy = ref(false)
const selectedDiagnostics = ref<PublishTaskDiagnostics | null>(null)
const modelBusy = ref(false)
const modelStatusText = ref('等待加载')
const modelTestPrompt = ref('')
const modelTestResult = ref('')
const modelConfigs = ref<ModelConfig[]>([])
const modelModalOpen = ref(false)
const agentBusy = ref(false)
const agentStatusText = ref('等待加载')
const agentConfigs = ref<AgentConfig[]>([])
const agentModalOpen = ref(false)
const skillBusy = ref(false)
const skillStatusText = ref('等待加载')
const skillConfigs = ref<SkillConfig[]>([])
const skillModalOpen = ref(false)
const localSkillsRoot = ref('')
const localSkills = ref<LocalSkill[]>([])
const selectedLocalSkill = ref<LocalSkill | null>(null)
const reviewBusy = ref(false)
const reviewStatusText = ref('等待生成')
const reviewResult = ref<AccountReviewResult | null>(null)
const reviewReports = ref<AccountReviewReportRecord[]>([])
const selectedReviewReportId = ref<number | null>(null)
const profileBusy = ref(false)
const profileStatusText = ref('等待鉴定')
const profileResult = ref<AccountProfileResult | null>(null)
const profileReports = ref<AccountProfileReportRecord[]>([])
const profileReviewReports = ref<AccountReviewReportRecord[]>([])
const selectedProfileReportId = ref<number | null>(null)
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
const agentForm = reactive({
  id: 0,
  name: '',
  agent_type: 'account_review' as 'account_review' | 'content_selection' | 'account_profile',
  model_config_id: 0,
  system_prompt: '',
  user_prompt_template: '',
  skill_ids: [] as number[],
  skill_paths: [] as string[],
  enabled: true,
  is_default: false
})
const skillForm = reactive({
  id: 0,
  name: '',
  skill_type: 'prompt' as 'prompt',
  description: '',
  content: '',
  enabled: true
})
const modelKeyPlaceholder = computed(() =>
  modelForm.api_key_configured ? '已配置，留空则不修改' : '未配置'
)
const publishForm = reactive({
  raw_content_id: 0,
  account_id: 0,
  title: '',
  content: ''
})
const reviewForm = reactive({
  account_id: 0,
  agent_id: 0
})
const profileForm = reactive({
  account_id: 0,
  review_report_id: 0,
  agent_id: 0
})
const collectorCategories = computed(() => {
  const source = collectorSources.value.find((item) => item.key === collectorSourceKey.value)
  return source?.categories ?? []
})
const reviewAgents = computed(() =>
  agentConfigs.value.filter((agent) => agent.agent_type === 'account_review' && agent.enabled)
)
const contentSelectionAgents = computed(() =>
  agentConfigs.value.filter((agent) => agent.agent_type === 'content_selection' && agent.enabled)
)
const profileAgents = computed(() =>
  agentConfigs.value.filter((agent) => agent.agent_type === 'account_profile' && agent.enabled)
)
const selectedContentSelectionReview = computed(() =>
  reviewReports.value.find((report) => report.id === contentSelectionReviewReportId.value) ?? null
)
const canRunContentSelection = computed(() =>
  selectedRawContentIds.value.length > 0 || Boolean(selectedContentSelectionReview.value)
)
const reviewResultCreatedAt = computed(() => {
  const value = (reviewResult.value as AccountReviewReportRecord | null)?.created_at
  return value ? formatDate(value) : '刚刚生成'
})
const profileResultCreatedAt = computed(() => {
  const value = (profileResult.value as AccountProfileReportRecord | null)?.created_at
  return value ? formatDate(value) : '刚刚生成'
})
const allAccountsSelected = computed({
  get() {
    return dashboard.accounts.length > 0 && selectedAccountIds.value.length === dashboard.accounts.length
  },
  set(checked: boolean) {
    selectedAccountIds.value = checked ? dashboard.accounts.map((account) => account.id) : []
  }
})
const allRawContentsSelected = computed({
  get() {
    return dashboard.rawContents.length > 0 && selectedRawContentIds.value.length === dashboard.rawContents.length
  },
  set(checked: boolean) {
    selectedRawContentIds.value = checked ? dashboard.rawContents.map((content) => content.id) : []
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
    const rawContentIds = new Set(data.rawContents.map((content) => content.id))
    selectedAccountIds.value = selectedAccountIds.value.filter((accountId) => accountIds.has(accountId))
    selectedRawContentIds.value = selectedRawContentIds.value.filter((rawContentId) => rawContentIds.has(rawContentId))
    statusText.value = '已同步'
  } catch (error) {
    console.error(error)
    statusText.value = 'API 未连接'
  }
}

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

async function loadAgents() {
  agentStatusText.value = '加载中'
  try {
    agentConfigs.value = await loadAgentConfigs()
    agentStatusText.value = 'Agent 列表已加载'
  } catch (error) {
    console.error(error)
    agentStatusText.value = 'Agent 列表加载失败'
  }
}

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
    skillStatusText.value = readableError(error, '读取 Skills 目录失败')
  } finally {
    skillBusy.value = false
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

async function removeModel(config: ModelConfig) {
  if (!window.confirm(`确认删除模型「${config.name}」吗？`)) {
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
    modelTestResult.value = readableError(error, '模型测试失败，请检查模型配置')
  } finally {
    modelBusy.value = false
  }
}

function modelProviderLabel(provider: string) {
  return provider === 'other' ? '其他模型' : 'DeepSeek'
}

function agentTypeLabel(agentType: string) {
  const labels: Record<string, string> = {
    account_review: '账号复盘',
    content_selection: '素材挑选',
    account_profile: '账号肖像'
  }
  return labels[agentType] ?? agentType
}

async function saveAgent() {
  agentBusy.value = true
  agentStatusText.value = '正在保存 Agent'
  try {
    const payload = {
      name: agentForm.name,
      agent_type: agentForm.agent_type,
      model_config_id: agentForm.model_config_id || null,
      system_prompt: agentForm.system_prompt,
      user_prompt_template: agentForm.user_prompt_template,
      skill_ids: agentForm.skill_ids,
      skill_paths: agentForm.skill_paths,
      enabled: agentForm.enabled,
      is_default: agentForm.is_default
    }
    const config = agentForm.id
      ? await updateAgentConfig(agentForm.id, payload)
      : await createAgentConfig(payload)
    await loadAgents()
    editAgent(config)
    closeAgentModal()
    agentStatusText.value = 'Agent 已保存'
  } catch (error) {
    console.error(error)
    agentStatusText.value = readableError(error, 'Agent 保存失败')
  } finally {
    agentBusy.value = false
  }
}

function openCreateAgentModal() {
  resetAgentForm()
  agentModalOpen.value = true
}

function openEditAgentModal(config: AgentConfig) {
  editAgent(config)
  agentModalOpen.value = true
}

function closeAgentModal() {
  agentModalOpen.value = false
}

function editAgent(config: AgentConfig) {
  agentForm.id = config.id
  agentForm.name = config.name
  agentForm.agent_type = config.agent_type
  agentForm.model_config_id = config.model_config_id || 0
  agentForm.system_prompt = config.system_prompt
  agentForm.user_prompt_template = config.user_prompt_template
  agentForm.skill_ids = [...config.skill_ids]
  agentForm.skill_paths = [...config.skill_paths]
  agentForm.enabled = config.enabled
  agentForm.is_default = config.is_default
}

function resetAgentForm() {
  agentForm.id = 0
  agentForm.name = '账号复盘 Agent'
  agentForm.agent_type = 'account_review'
  agentForm.model_config_id = 0
  agentForm.system_prompt = '你是一个中文自媒体运营复盘 Agent，擅长从作品数据中提炼内容方向、标题规律和下一步选题建议。'
  agentForm.user_prompt_template = [
    '请基于这些作品做一份中文复盘报告，要求：',
    '1. 先总结账号当前内容表现和整体方向。',
    '2. 找出表现较好的作品，并解释可能原因。',
    '3. 分析标题规律、内容结构和受众兴趣点。',
    '4. 指出当前内容存在的问题或数据短板。',
    '5. 给出 5 个下一步选题建议，每个建议附带推荐标题方向。',
    '6. 给出 3 条可执行优化建议。',
    '',
    '输出要结构清晰，避免空泛套话。'
  ].join('\n')
  agentForm.skill_ids = []
  agentForm.skill_paths = []
  agentForm.enabled = true
  agentForm.is_default = agentConfigs.value.length === 0
}

function syncAgentDefaults() {
  if (agentForm.agent_type === 'content_selection') {
    if (!agentForm.name || agentForm.name.includes('复盘')) {
      agentForm.name = '素材挑选 Agent'
    }
    if (!agentForm.system_prompt || agentForm.system_prompt.includes('复盘')) {
      agentForm.system_prompt = '你是一个中文自媒体素材挑选 Agent，擅长判断采集内容是否适合进入创作和发布流程。'
    }
    if (!agentForm.user_prompt_template || agentForm.user_prompt_template.includes('复盘')) {
      agentForm.user_prompt_template = [
        '请根据采集内容的选题价值、账号适配度、时效性、风险和可改写空间做素材挑选。',
        '优先选择具备讨论度、信息增量、可解释性和可持续创作角度的内容。',
        '不要自动选择风险高、信息不足、标题党明显或无法形成有效观点的内容。'
      ].join('\n')
    }
    return
  }
  if (agentForm.agent_type === 'account_profile') {
    if (!agentForm.name || agentForm.name.includes('复盘') || agentForm.name.includes('挑选')) {
      agentForm.name = '账号肖像 Agent'
    }
    if (!agentForm.system_prompt || agentForm.system_prompt.includes('复盘') || agentForm.system_prompt.includes('挑选')) {
      agentForm.system_prompt = '你是一个中文自媒体账号肖像鉴定 Agent，擅长基于作品和复盘报告提炼长期稳定的账号画像。'
    }
    if (!agentForm.user_prompt_template || agentForm.user_prompt_template.includes('复盘') || agentForm.user_prompt_template.includes('采集内容')) {
      agentForm.user_prompt_template = [
        '请基于账号作品和复盘信息生成账号肖像。',
        '重点提炼长期稳定的账号定位、目标受众、内容赛道、标题风格、适合采集的数据源方向、禁止内容方向和风险边界。',
        '结论要能指导后续智能筛选和内容创作，不要只复述单次复盘。'
      ].join('\n')
    }
    return
  }
  if (!agentForm.name || agentForm.name.includes('挑选') || agentForm.name.includes('肖像')) {
    agentForm.name = '账号复盘 Agent'
    agentForm.system_prompt = '你是一个中文自媒体运营复盘 Agent，擅长从作品数据中提炼内容方向、标题规律和下一步选题建议。'
    agentForm.user_prompt_template = [
      '请基于这些作品做一份中文复盘报告，要求：',
      '1. 先总结账号当前内容表现和整体方向。',
      '2. 找出表现较好的作品，并解释可能原因。',
      '3. 分析标题规律、内容结构和受众兴趣点。',
      '4. 指出当前内容存在的问题或数据短板。',
      '5. 给出 5 个下一步选题建议，每个建议附带推荐标题方向。',
      '6. 给出 3 条可执行优化建议。',
      '',
      '输出要结构清晰，避免空泛套话。'
    ].join('\n')
  }
}

async function saveSkill() {
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
    const config = skillForm.id
      ? await updateSkillConfig(skillForm.id, payload)
      : await createSkillConfig(payload)
    await loadSkills()
    editSkill(config)
    closeSkillModal()
    skillStatusText.value = 'Skill 已保存'
  } catch (error) {
    console.error(error)
    skillStatusText.value = readableError(error, 'Skill 保存失败')
  } finally {
    skillBusy.value = false
  }
}

function openCreateSkillModal() {
  resetSkillForm()
  skillModalOpen.value = true
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
    await Promise.all([loadSkills(), loadAgents()])
    skillStatusText.value = 'Skill 已删除'
  } catch (error) {
    console.error(error)
    skillStatusText.value = readableError(error, 'Skill 删除失败')
  } finally {
    skillBusy.value = false
  }
}

async function setDefaultAgent(agentId: number) {
  agentBusy.value = true
  agentStatusText.value = '正在设置默认 Agent'
  try {
    await setDefaultAgentConfig(agentId)
    await loadAgents()
    agentStatusText.value = '默认 Agent 已更新'
  } catch (error) {
    console.error(error)
    agentStatusText.value = readableError(error, '设置默认 Agent 失败')
  } finally {
    agentBusy.value = false
  }
}

async function removeAgent(config: AgentConfig) {
  if (!window.confirm(`确认删除 Agent「${config.name}」吗？`)) {
    return
  }
  agentBusy.value = true
  agentStatusText.value = '正在删除 Agent'
  try {
    await deleteAgentConfig(config.id)
    if (agentForm.id === config.id) {
      resetAgentForm()
    }
    if (reviewForm.agent_id === config.id) {
      reviewForm.agent_id = 0
    }
    if (contentSelectionAgentId.value === config.id) {
      contentSelectionAgentId.value = 0
    }
    if (profileForm.agent_id === config.id) {
      profileForm.agent_id = 0
    }
    await loadAgents()
    agentStatusText.value = 'Agent 已删除'
  } catch (error) {
    console.error(error)
    agentStatusText.value = readableError(error, 'Agent 删除失败')
  } finally {
    agentBusy.value = false
  }
}

function readableError(error: unknown, fallback = '操作失败，请稍后重试') {
  const response = (error as { response?: { data?: { detail?: string } } }).response
  return response?.data?.detail || fallback
}

function pageItems<T>(items: T[], key: PaginationKey) {
  const state = pagination[key]
  const pageSize = state.pageSize
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const page = Math.min(Math.max(1, state.page), totalPages)
  const start = (page - 1) * pageSize
  return items.slice(start, start + pageSize)
}

function shouldShowPagination<T>(items: T[], key: PaginationKey) {
  return items.length > pagination[key].pageSize
}

function reviewList(items: string[]) {
  return items.length ? items : ['-']
}

function priorityLabel(priority: string) {
  const labels: Record<string, string> = {
    high: '高优先级',
    medium: '中优先级',
    low: '低优先级'
  }
  return labels[priority] ?? (priority || '-')
}

async function generateReview() {
  if (!reviewForm.account_id) {
    reviewStatusText.value = '请选择账号'
    return
  }
  reviewBusy.value = true
  reviewStatusText.value = '正在生成复盘'
  reviewResult.value = null
  try {
    reviewResult.value = await generateAccountReview({
      account_id: reviewForm.account_id,
      agent_id: reviewForm.agent_id || null
    })
    selectedReviewReportId.value = (reviewResult.value as AccountReviewReportRecord).id ?? null
    await loadReviewReports()
    reviewStatusText.value = '复盘已生成'
  } catch (error) {
    console.error(error)
    reviewStatusText.value = readableError(error)
  } finally {
    reviewBusy.value = false
  }
}

async function loadReviewReports() {
  try {
    reviewReports.value = await loadAccountReviewReports(reviewForm.account_id || null)
  } catch (error) {
    console.error(error)
    reviewStatusText.value = readableError(error, '复盘历史加载失败')
  }
}

async function loadProfileContext() {
  if (!profileForm.account_id) {
    profileReports.value = []
    profileReviewReports.value = []
    profileResult.value = null
    selectedProfileReportId.value = null
    return
  }
  profileStatusText.value = '正在加载账号上下文'
  try {
    const [reports, reviews] = await Promise.all([
      loadAccountProfileReports(profileForm.account_id),
      loadAccountReviewReports(profileForm.account_id)
    ])
    profileReports.value = reports
    profileReviewReports.value = reviews
    if (!reviews.some((report) => report.id === profileForm.review_report_id)) {
      profileForm.review_report_id = 0
    }
    profileStatusText.value = '账号上下文已加载'
  } catch (error) {
    console.error(error)
    profileStatusText.value = readableError(error, '账号肖像上下文加载失败')
  }
}

async function generateProfile() {
  if (!profileForm.account_id) {
    profileStatusText.value = '请选择账号'
    return
  }
  profileBusy.value = true
  profileStatusText.value = '正在生成账号肖像'
  profileResult.value = null
  try {
    profileResult.value = await generateAccountProfile({
      account_id: profileForm.account_id,
      review_report_id: profileForm.review_report_id || null,
      agent_id: profileForm.agent_id || null
    })
    selectedProfileReportId.value = (profileResult.value as AccountProfileReportRecord).id ?? null
    await loadProfileContext()
    profileStatusText.value = '账号肖像已生成'
  } catch (error) {
    console.error(error)
    profileStatusText.value = readableError(error, '账号肖像生成失败')
  } finally {
    profileBusy.value = false
  }
}

function selectProfileReport(report: AccountProfileReportRecord) {
  profileResult.value = report
  selectedProfileReportId.value = report.id
  profileStatusText.value = '已载入历史肖像'
}

async function removeProfileReport(report: AccountProfileReportRecord) {
  if (!window.confirm(`确认删除 ${formatDate(report.created_at)} 的账号肖像记录吗？`)) {
    return
  }
  profileBusy.value = true
  profileStatusText.value = '正在删除账号肖像记录'
  try {
    await deleteAccountProfileReport(report.id)
    if (selectedProfileReportId.value === report.id) {
      profileResult.value = null
      selectedProfileReportId.value = null
    }
    await loadProfileContext()
    profileStatusText.value = '账号肖像记录已删除'
  } catch (error) {
    console.error(error)
    profileStatusText.value = readableError(error, '账号肖像记录删除失败')
  } finally {
    profileBusy.value = false
  }
}

function selectReviewReport(report: AccountReviewReportRecord) {
  reviewResult.value = report
  selectedReviewReportId.value = report.id
  reviewStatusText.value = '已载入历史复盘'
}

async function removeReviewReport(report: AccountReviewReportRecord) {
  if (!window.confirm(`确认删除 ${formatDate(report.created_at)} 的复盘记录吗？`)) {
    return
  }
  reviewBusy.value = true
  reviewStatusText.value = '正在删除复盘记录'
  try {
    await deleteAccountReviewReport(report.id)
    if (selectedReviewReportId.value === report.id) {
      reviewResult.value = null
      selectedReviewReportId.value = null
    }
    await loadReviewReports()
    reviewStatusText.value = '复盘记录已删除'
  } catch (error) {
    console.error(error)
    reviewStatusText.value = readableError(error, '复盘记录删除失败')
  } finally {
    reviewBusy.value = false
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
    if (profileForm.account_id === account.id) {
      profileForm.account_id = 0
      profileReports.value = []
      profileReviewReports.value = []
      profileResult.value = null
      selectedProfileReportId.value = null
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
    if (accountIds.includes(profileForm.account_id)) {
      profileForm.account_id = 0
      profileReports.value = []
      profileReviewReports.value = []
      profileResult.value = null
      selectedProfileReportId.value = null
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
    selectedRawContentIds.value = selectedRawContentIds.value.filter((rawContentId) => rawContentId !== content.id)
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

async function runContentSelection() {
  contentSelectionBusy.value = true
  contentSelectionResult.value = null
  try {
    const candidateIds = selectedRawContentIds.value.length
      ? [...selectedRawContentIds.value]
      : await collectRawContentsByReview()
    if (candidateIds.length === 0) {
      statusText.value = selectedContentSelectionReview.value
        ? '复盘方向暂无匹配的数据源分类'
        : '请选择采集内容或复盘报告'
      return
    }
    statusText.value = selectedRawContentIds.value.length
      ? '正在智能挑选已选素材'
      : '正在分析智能采集素材'
    contentSelectionResult.value = await selectCollectedContent({
      raw_content_ids: candidateIds,
      agent_id: contentSelectionAgentId.value || null
    })
    statusText.value = `素材挑选完成，共 ${candidateIds.length} 条候选`
  } catch (error) {
    console.error(error)
    statusText.value = readableError(error, '素材挑选失败')
  } finally {
    contentSelectionBusy.value = false
  }
}

async function collectRawContentsByReview() {
  const report = selectedContentSelectionReview.value
  if (!report) {
    return []
  }
  const targets = matchCollectorTargetsByReview(report).slice(0, 3)
  if (targets.length === 0) {
    return []
  }
  const rawContentIds: number[] = []
  const previewItems: CollectorItem[] = []
  for (const target of targets) {
    statusText.value = `正在预览 ${target.sourceName} / ${target.categoryName}`
    const items = await previewCollectorItems({
      source: target.source,
      category: target.category,
      limit: 20,
      with_detail: false
    })
    previewItems.push(...items)
    for (const item of items) {
      const rawContent = await importCollectorForSelection(item)
      if (rawContent && !rawContentIds.includes(rawContent.id)) {
        rawContentIds.push(rawContent.id)
      }
    }
  }
  collectorItems.value = previewItems
  await refresh()
  statusText.value = `已按复盘导入 ${rawContentIds.length} 条素材`
  return rawContentIds
}

async function importCollectorForSelection(item: CollectorItem) {
  const existing = dashboard.rawContents.find((content) => content.source_url === item.url)
  if (existing) {
    return existing
  }
  try {
    return await importCollectorItem(item)
  } catch (error) {
    console.error(error)
    return null
  }
}

function matchCollectorTargetsByReview(report: AccountReviewReportRecord) {
  const keywords = extractReviewKeywords(report)
  if (keywords.length === 0) {
    return []
  }
  return collectorSources.value
    .flatMap((source) =>
      source.categories.map((category) => ({
        source: source.key,
        sourceName: source.name,
        category: category.key,
        categoryName: category.name,
        score: scoreCollectorTargetByKeywords(source, category, keywords)
      }))
    )
    .filter((target) => target.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score
      }
      return `${a.sourceName}${a.categoryName}`.localeCompare(`${b.sourceName}${b.categoryName}`, 'zh-CN')
    })
}

function extractReviewKeywords(report: AccountReviewReportRecord) {
  const values = [
    report.report.positioning.current_direction,
    ...report.report.positioning.strengths,
    ...report.report.audience.interests,
    ...report.report.audience.unmet_needs,
    ...report.report.topic_suggestions.flatMap((item) => [
      item.topic,
      item.title_direction,
      item.reason,
      item.angle
    ]),
    ...report.report.actions.map((item) => item.action)
  ]
  const keywords: string[] = []
  for (const value of values) {
    for (const keyword of splitKeywordText(value)) {
      if (!keywords.includes(keyword)) {
        keywords.push(keyword)
      }
    }
    for (const keyword of extractDomainKeywords(value)) {
      if (!keywords.includes(keyword)) {
        keywords.push(keyword)
      }
    }
  }
  return keywords.slice(0, 40)
}

function splitKeywordText(value: string) {
  return String(value || '')
    .split(/[\s,，。；;、：:（）()【】[\]《》"'“”‘’/\\|]+/)
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item.length >= 2 && item.length <= 24)
}

function extractDomainKeywords(value: string) {
  const text = String(value || '').toLowerCase()
  const domainKeywords = [
    'ai',
    '人工智能',
    '科技',
    '数码',
    '互联网',
    '手机',
    '通信',
    '财经',
    '经济',
    '商业',
    '金融',
    '股票',
    '基金',
    'ipo',
    '教育',
    '高考',
    '考研',
    '留学',
    '国际',
    '全球',
    '外交',
    '社会',
    '时政',
    '政策',
    '民生',
    '文化',
    '历史',
    '艺术',
    '文旅',
    '健康',
    '生活',
    '亲子',
    '母婴',
    '体育',
    '娱乐',
    '游戏',
    '汽车',
    '房产'
  ]
  return domainKeywords.filter((keyword) => text.includes(keyword))
}

function scoreCollectorTargetByKeywords(source: CollectorSource, category: { key: string; name: string }, keywords: string[]) {
  const text = `${source.key} ${source.name} ${category.key} ${category.name}`.toLowerCase()
  const expandedText = `${text} ${collectorTargetAliasText(source, category)}`.toLowerCase()
  let score = 0
  for (const keyword of keywords) {
    if (expandedText.includes(keyword)) {
      score += 4
    }
  }
  return score
}

function collectorTargetAliasText(source: CollectorSource, category: { key: string; name: string }) {
  const text = `${source.name} ${category.name}`
  const aliases: string[] = []
  if (/it|科技|数码|互联网|通信|智能|硬件|ai|5g/i.test(text)) {
    aliases.push('科技 数码 互联网 ai 人工智能 产品 手机 通信 智能硬件')
  }
  if (/财经|经济|股票|基金|ipo|公司|地产|商业|金融/i.test(text)) {
    aliases.push('财经 经济 公司 商业 金融 投资 股票 基金 ipo 地产')
  }
  if (/教育|高考|考研|学校|高校|留学/i.test(text)) {
    aliases.push('教育 学习 学校 高考 考研 留学 老师 学生')
  }
  if (/国际|世界|外交|全球|海外/i.test(text)) {
    aliases.push('国际 世界 全球 海外 外交')
  }
  if (/时政|政|社会|法治|热点|要闻|舆论/i.test(text)) {
    aliases.push('时政 社会 热点 舆论 政策 民生 新闻')
  }
  if (/文化|历史|艺术|读书|文旅|旅游/i.test(text)) {
    aliases.push('文化 历史 艺术 读书 文旅 旅游')
  }
  if (/健康|生活|亲子|母婴|时尚|美容/i.test(text)) {
    aliases.push('健康 生活 亲子 母婴 时尚 美容')
  }
  if (/体育|运动|赛事/i.test(text)) {
    aliases.push('体育 运动 赛事')
  }
  if (/娱乐|明星|影视|音乐|综艺/i.test(text)) {
    aliases.push('娱乐 明星 影视 音乐 综艺')
  }
  if (/游戏|电竞|手游|网游/i.test(text)) {
    aliases.push('游戏 电竞 手游 网游')
  }
  if (/汽车|车/i.test(text)) {
    aliases.push('汽车 新能源车 车')
  }
  if (/房产|房地产|地产/i.test(text)) {
    aliases.push('房产 房地产 地产')
  }
  return aliases.join(' ')
}

function selectionReviewLabel(report: AccountReviewReportRecord) {
  const account = dashboard.accounts.find((item) => item.id === report.account_id)
  const accountName = account?.nickname || account?.uid || `账号 ${report.account_id}`
  return `${accountName} / ${formatDate(report.created_at)}`
}

function rawContentTitle(rawContentId: number) {
  const content = dashboard.rawContents.find((item) => item.id === rawContentId)
  return content?.title || `素材 ${rawContentId}`
}

function selectionResultClass(item: ContentSelectionItem) {
  return item.selected ? 'status-published' : 'status-failed'
}

function selectionRiskLabel(risk: string) {
  const labels: Record<string, string> = {
    high: '高风险',
    medium: '中风险',
    low: '低风险'
  }
  return labels[risk] ?? risk
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
  await Promise.all([refresh(), loadCollectors(), loadModels(), loadAgents(), loadSkills()])
  await loadReviewReports()
})
</script>
