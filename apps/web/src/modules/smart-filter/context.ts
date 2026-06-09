/*
实现逻辑：
1. 管理智能筛选页面的账号上下文、筛选历史、筛选结果和筛选执行流程。
2. 只接收跨模块共享依赖，避免智能筛选逻辑继续堆在 App.vue。
3. 智能筛选只处理已有素材和已落库筛选记录，不直接创建发布任务。
*/

import { computed, reactive, ref, type Ref } from 'vue'
import {
  deleteContentSelection,
  loadAccountProfileReports,
  loadAccountReviewReports,
  loadContentSelections,
  selectCollectedContent,
  type AccountProfileReportRecord,
  type AccountReviewReportRecord,
  type AgentConfig,
  type CollectorSource,
  type ContentSelectionItem,
  type ContentSelectionResult,
  type DashboardPayload
} from '../../api/client'

type SmartFilterDependencies = {
  dashboard: DashboardPayload
  statusText: Ref<string>
  selectedRawContentIds: Ref<number[]>
  collectorSources: Ref<CollectorSource[]>
  agentConfigs: Ref<AgentConfig[]>
  readableError: (error: unknown, fallback?: string) => string
  formatDate: (value: string) => string
}

export function createSmartFilterContext(deps: SmartFilterDependencies) {
  const smartFilterAccountId = ref(0)
  const contentSelectionBusy = ref(false)
  const contentSelectionAgentId = ref(0)
  const contentSelectionProfileReportId = ref(0)
  const contentSelectionReviewReportId = ref(0)
  const contentSelectionResult = ref<ContentSelectionResult | null>(null)
  const contentSelectionHistory = ref<ContentSelectionResult[]>([])
  const contentSelectionProfileReports = ref<AccountProfileReportRecord[]>([])
  const contentSelectionReviewReports = ref<AccountReviewReportRecord[]>([])
  const contentSelectionResultFilter = ref<'all' | 'selected' | 'rejected'>('all')
  const contentSelectionStats = reactive({
    started: false,
    basis: '',
    targets: '-',
    candidates: 0
  })

  const contentSelectionAgents = computed(() =>
    deps.agentConfigs.value.filter((agent) => agent.agent_type === 'content_selection' && agent.enabled)
  )
  const selectedContentSelectionProfile = computed(() =>
    contentSelectionProfileReports.value.find((report) => report.id === contentSelectionProfileReportId.value) ?? null
  )
  const selectedContentSelectionReview = computed(() =>
    contentSelectionReviewReports.value.find((report) => report.id === contentSelectionReviewReportId.value) ?? null
  )
  const canRunContentSelection = computed(() =>
    deps.selectedRawContentIds.value.length > 0 || Boolean(selectedContentSelectionProfile.value || selectedContentSelectionReview.value)
  )
  const filteredContentSelectionResults = computed(() => {
    const items = contentSelectionResult.value?.results ?? []
    if (contentSelectionResultFilter.value === 'selected') {
      return items.filter((item) => item.selected)
    }
    if (contentSelectionResultFilter.value === 'rejected') {
      return items.filter((item) => !item.selected)
    }
    return items
  })
  const contentSelectionRecommendedCount = computed(
    () => contentSelectionResult.value?.results.filter((item) => item.selected).length ?? 0
  )

  async function loadSmartFilterContext() {
    if (!smartFilterAccountId.value) {
      clearSmartFilterAccount()
      return
    }
    deps.statusText.value = '正在加载智能筛选上下文'
    try {
      const [profiles, reviews] = await Promise.all([
        loadAccountProfileReports(smartFilterAccountId.value),
        loadAccountReviewReports(smartFilterAccountId.value)
      ])
      contentSelectionProfileReports.value = profiles
      contentSelectionReviewReports.value = reviews
      contentSelectionHistory.value = await loadContentSelections(smartFilterAccountId.value)
      if (!profiles.some((profile) => profile.id === contentSelectionProfileReportId.value)) {
        contentSelectionProfileReportId.value = 0
      }
      if (!reviews.some((report) => report.id === contentSelectionReviewReportId.value)) {
        contentSelectionReviewReportId.value = 0
      }
      deps.statusText.value = '智能筛选上下文已加载'
    } catch (error) {
      console.error(error)
      deps.statusText.value = deps.readableError(error, '智能筛选上下文加载失败')
    }
  }

  async function loadContentSelectionHistory() {
    try {
      contentSelectionHistory.value = await loadContentSelections(smartFilterAccountId.value || null)
    } catch (error) {
      console.error(error)
      deps.statusText.value = deps.readableError(error, '智能筛选历史加载失败')
    }
  }

  function clearSmartFilterAccount() {
    smartFilterAccountId.value = 0
    contentSelectionProfileReports.value = []
    contentSelectionReviewReports.value = []
    contentSelectionHistory.value = []
    contentSelectionProfileReportId.value = 0
    contentSelectionReviewReportId.value = 0
    resetContentSelectionStats()
  }

  async function runContentSelection() {
    contentSelectionBusy.value = true
    contentSelectionResult.value = null
    contentSelectionResultFilter.value = 'all'
    resetContentSelectionStats()
    try {
      const candidateIds = deps.selectedRawContentIds.value.length
        ? [...deps.selectedRawContentIds.value]
        : await collectRawContentsByStrategy()
      if (candidateIds.length === 0) {
        deps.statusText.value = smartFilterAccountId.value
          ? '账号肖像或复盘未命中已有素材'
          : '请选择采集内容或账号'
        return
      }
      deps.statusText.value = deps.selectedRawContentIds.value.length
        ? '正在智能挑选已选素材'
        : '正在分析已命中素材'
      contentSelectionResult.value = await selectCollectedContent({
        raw_content_ids: candidateIds,
        agent_id: contentSelectionAgentId.value || null,
        account_id: smartFilterAccountId.value || null,
        profile_report_id: contentSelectionProfileReportId.value || selectedContentSelectionProfile.value?.id || null,
        review_report_id: contentSelectionReviewReportId.value || selectedContentSelectionReview.value?.id || null,
        basis: contentSelectionStats.basis,
        targets: contentSelectionStats.targets
      })
      await loadContentSelectionHistory()
      deps.statusText.value = `素材挑选完成，共 ${candidateIds.length} 条候选`
    } catch (error) {
      console.error(error)
      deps.statusText.value = deps.readableError(error, '素材挑选失败')
    } finally {
      contentSelectionBusy.value = false
    }
  }

  function selectContentSelectionRun(run: ContentSelectionResult) {
    contentSelectionResult.value = run
    contentSelectionResultFilter.value = 'all'
    contentSelectionStats.started = true
    contentSelectionStats.basis = run.basis || '-'
    contentSelectionStats.targets = run.targets || '-'
    contentSelectionStats.candidates = run.candidates_count || run.results.length
    deps.statusText.value = '已载入智能筛选记录'
  }

  async function removeContentSelectionRun(run: ContentSelectionResult) {
    if (!run.id) {
      return
    }
    if (!window.confirm(`确认删除 ${deps.formatDate(run.created_at || '')} 的智能筛选记录吗？`)) {
      return
    }
    contentSelectionBusy.value = true
    deps.statusText.value = '正在删除智能筛选记录'
    try {
      await deleteContentSelection(run.id)
      if (contentSelectionResult.value?.id === run.id) {
        contentSelectionResult.value = null
      }
      await loadContentSelectionHistory()
      deps.statusText.value = '智能筛选记录已删除'
    } catch (error) {
      console.error(error)
      deps.statusText.value = deps.readableError(error, '智能筛选记录删除失败')
    } finally {
      contentSelectionBusy.value = false
    }
  }

  async function collectRawContentsByStrategy() {
    const profile = selectedContentSelectionProfile.value
    const review = selectedContentSelectionReview.value
    const targets = profile
      ? matchCollectorTargetsByProfile(profile).slice(0, 3)
      : review
        ? matchCollectorTargetsByReview(review).slice(0, 3)
        : []
    if (targets.length === 0) {
      return []
    }
    contentSelectionStats.started = true
    contentSelectionStats.basis = profile ? '账号肖像' : '复盘报告'
    contentSelectionStats.targets = targets.map((target) => `${target.sourceName}/${target.categoryName}`).join('、')
    const matchedContents = filterExistingRawContentsByTargets(targets)
    const rawContentIds = matchedContents.map((content) => content.id)
    deps.selectedRawContentIds.value = rawContentIds
    contentSelectionStats.candidates = rawContentIds.length
    deps.statusText.value = `已按${contentSelectionStats.basis}命中 ${rawContentIds.length} 条已有素材`
    return rawContentIds
  }

  function resetContentSelectionStats() {
    contentSelectionStats.started = false
    contentSelectionStats.basis = ''
    contentSelectionStats.targets = '-'
    contentSelectionStats.candidates = 0
  }

  function matchCollectorTargetsByProfile(profile: AccountProfileReportRecord) {
    const explicitTargets = profile.profile.source_preferences
      .map((item) => {
        const source = deps.collectorSources.value.find((sourceItem) => sourceItem.key === item.source)
        const category = source?.categories.find((categoryItem) => categoryItem.key === item.category)
        if (!source || !category) {
          return null
        }
        return {
          source: source.key,
          sourceName: source.name,
          category: category.key,
          categoryName: category.name,
          score: profilePriorityScore(item.priority) + Math.max(0, item.keywords.length)
        }
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
    if (explicitTargets.length > 0) {
      return explicitTargets.sort((a, b) => b.score - a.score)
    }
    const keywords = extractProfileKeywords(profile)
    if (keywords.length === 0) {
      return []
    }
    return matchCollectorTargetsByKeywords(keywords)
  }

  function matchCollectorTargetsByReview(report: AccountReviewReportRecord) {
    const keywords = extractReviewKeywords(report)
    if (keywords.length === 0) {
      return []
    }
    return matchCollectorTargetsByKeywords(keywords)
  }

  function matchCollectorTargetsByKeywords(keywords: string[]) {
    return deps.collectorSources.value
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

  function filterExistingRawContentsByTargets(targets: Array<{ source: string; category: string }>) {
    return deps.dashboard.rawContents.filter((content) =>
      targets.some((target) => content.source === target.source && content.category === target.category)
    )
  }

  function extractProfileKeywords(profile: AccountProfileReportRecord) {
    const values = [
      profile.profile.summary,
      profile.profile.positioning,
      profile.profile.audience_profile,
      ...profile.profile.content_tracks,
      ...profile.profile.title_style,
      ...profile.profile.topic_keywords,
      ...profile.profile.publishing_advice,
      ...profile.profile.source_preferences.flatMap((item) => [
        item.reason,
        ...item.keywords
      ])
    ]
    return collectKeywords(values)
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
    return collectKeywords(values)
  }

  function collectKeywords(values: string[]) {
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

  function profilePriorityScore(priority: string) {
    if (priority === 'high') return 12
    if (priority === 'medium') return 8
    if (priority === 'low') return 4
    return 0
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
    const account = deps.dashboard.accounts.find((item) => item.id === report.account_id)
    const accountName = account?.nickname || account?.uid || `账号 ${report.account_id}`
    return `${accountName} / ${deps.formatDate(report.created_at)}`
  }

  function rawContentTitle(rawContentId: number) {
    const content = deps.dashboard.rawContents.find((item) => item.id === rawContentId)
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

  return {
    smartFilterAccountId,
    contentSelectionBusy,
    contentSelectionAgentId,
    contentSelectionProfileReportId,
    contentSelectionReviewReportId,
    contentSelectionResult,
    contentSelectionHistory,
    contentSelectionProfileReports,
    contentSelectionReviewReports,
    contentSelectionResultFilter,
    contentSelectionStats,
    contentSelectionAgents,
    canRunContentSelection,
    filteredContentSelectionResults,
    contentSelectionRecommendedCount,
    loadSmartFilterContext,
    loadContentSelectionHistory,
    clearSmartFilterAccount,
    runContentSelection,
    selectContentSelectionRun,
    removeContentSelectionRun,
    selectionReviewLabel,
    rawContentTitle,
    selectionResultClass,
    selectionRiskLabel
  }
}
