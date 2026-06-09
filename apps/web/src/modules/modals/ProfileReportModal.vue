<!--
实现逻辑：
1. 展示账号肖像 Agent 输出的结构化结果和原始报告。
2. 头部固定，长内容在弹框内容区滚动，避免关闭入口滚出视野。
3. 只读取 account-profile 模块结果，不负责触发生成。
-->

<template>
  <div v-if="profileResult" class="modal-backdrop" @click.self="closeProfileResult">
    <section class="work-content-modal report-modal" role="dialog" aria-modal="true">
      <div class="work-content-header sticky-modal-header">
        <div class="modal-title-block">
          <h4>账号肖像</h4>
          <p>{{ profileResult.agent_name || '默认 Agent' }} / {{ profileResult.provider }} / {{ profileResult.model }}</p>
        </div>
        <button class="text-button" @click="closeProfileResult">关闭</button>
      </div>
      <div class="review-result">
        <section class="review-section review-columns">
          <div>
            <h4>作品数</h4>
            <p>{{ profileResult.works_count }}</p>
          </div>
          <div>
            <h4>生成时间</h4>
            <p>{{ profileResultCreatedAt || '-' }}</p>
          </div>
        </section>
        <section class="review-section">
          <h3>账号概览</h3>
          <p>{{ profileResult.profile.summary || '-' }}</p>
          <div class="review-columns">
            <div>
              <h4>账号定位</h4>
              <p>{{ profileResult.profile.positioning || '-' }}</p>
            </div>
            <div>
              <h4>受众画像</h4>
              <p>{{ profileResult.profile.audience_profile || '-' }}</p>
            </div>
          </div>
        </section>
        <section class="review-section review-columns">
          <div>
            <h4>内容赛道</h4>
            <ul>
              <li v-for="track in profileResult.profile.content_tracks" :key="track">{{ track }}</li>
            </ul>
          </div>
          <div>
            <h4>标题风格</h4>
            <ul>
              <li v-for="style in profileResult.profile.title_style" :key="style">{{ style }}</li>
            </ul>
          </div>
          <div>
            <h4>选题关键词</h4>
            <ul>
              <li v-for="keyword in profileResult.profile.topic_keywords" :key="keyword">{{ keyword }}</li>
            </ul>
          </div>
        </section>
        <section class="review-section">
          <h3>来源偏好</h3>
          <div v-if="profileResult.profile.source_preferences.length === 0" class="empty compact-empty">
            暂无来源偏好
          </div>
          <div v-else class="review-columns">
            <div v-for="preference in profileResult.profile.source_preferences" :key="`${preference.source}-${preference.category}`" class="review-item">
              <strong>{{ preference.source }} / {{ preference.category || '-' }}</strong>
              <small>{{ priorityLabel(preference.priority) }}</small>
              <p>{{ preference.reason || '-' }}</p>
              <small>关键词：{{ preference.keywords.join('、') || '-' }}</small>
            </div>
          </div>
        </section>
        <section class="review-section review-columns">
          <div>
            <h4>禁区话题</h4>
            <ul>
              <li v-for="topic in profileResult.profile.forbidden_topics" :key="topic">{{ topic }}</li>
            </ul>
          </div>
          <div>
            <h4>风险边界</h4>
            <ul>
              <li v-for="boundary in profileResult.profile.risk_boundaries" :key="boundary">{{ boundary }}</li>
            </ul>
          </div>
          <div>
            <h4>发布建议</h4>
            <ul>
              <li v-for="advice in profileResult.profile.publishing_advice" :key="advice">{{ advice }}</li>
            </ul>
          </div>
        </section>
        <section class="review-section">
          <h3>数据边界</h3>
          <ul>
            <li v-for="limit in profileResult.profile.data_limits" :key="limit">{{ limit }}</li>
          </ul>
        </section>
        <section class="review-section">
          <h3>原始输出</h3>
          <pre>{{ profileResult.raw_report || '-' }}</pre>
        </section>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { inject } from 'vue'
import { appContextKey } from '../appContext'

const app = inject<any>(appContextKey)
if (!app) {
  throw new Error('ProfileReportModal 缺少 appContext')
}

const profileResult = app.profileResult
const profileResultCreatedAt = app.profileResultCreatedAt
const closeProfileResult = app.closeProfileResult
const priorityLabel = app.priorityLabel
</script>
