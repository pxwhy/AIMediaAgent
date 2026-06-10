<!--
实现逻辑：
1. 展示账号复盘 Agent 输出的结构化报告。
2. 按总结、定位、标题、结构、受众、选题和行动建议分区。
3. 弹框只消费复盘结果和关闭方法，不承担复盘生成逻辑。
-->

<template>
  <div v-if="reviewResult" class="modal-backdrop" @click.self="closeReviewResult">
    <section class="work-content-modal report-modal" role="dialog" aria-modal="true">
      <div class="work-content-header">
        <div class="modal-title-block">
          <h4>账号复盘</h4>
          <p>{{ reviewResult.agent_name || '默认 Agent' }} / {{ reviewResult.provider }} / {{ reviewResult.model }}</p>
        </div>
        <button class="text-button" @click="closeReviewResult">关闭</button>
      </div>
      <div class="review-result">
        <section class="review-section review-columns">
          <div>
            <h4>作品数</h4>
            <p>{{ reviewResult.works_count }}</p>
          </div>
          <div>
            <h4>生成时间</h4>
            <p>{{ reviewResultCreatedAt || '-' }}</p>
          </div>
        </section>
        <section class="review-section">
          <h3>复盘总结</h3>
          <p>{{ reviewResult.report.summary || '-' }}</p>
        </section>
        <section class="review-section review-columns">
          <div>
            <h4>当前方向</h4>
            <p>{{ reviewResult.report.positioning.current_direction || '-' }}</p>
          </div>
          <div>
            <h4>优势</h4>
            <ul>
              <li v-for="strength in reviewResult.report.positioning.strengths" :key="strength">{{ strength }}</li>
            </ul>
          </div>
          <div>
            <h4>风险</h4>
            <ul>
              <li v-for="risk in reviewResult.report.positioning.risks" :key="risk">{{ risk }}</li>
            </ul>
          </div>
        </section>
        <section class="review-section">
          <h3>优质作品</h3>
          <div class="review-columns">
            <div v-for="work in reviewResult.report.top_works" :key="work.title" class="review-item">
              <strong>{{ work.title }}</strong>
              <p>{{ work.reason }}</p>
              <small>{{ work.evidence }}</small>
            </div>
          </div>
        </section>
        <section class="review-section review-columns">
          <div>
            <h4>标题模式</h4>
            <ul>
              <li v-for="pattern in reviewResult.report.title_analysis.patterns" :key="pattern">{{ pattern }}</li>
            </ul>
          </div>
          <div>
            <h4>标题问题</h4>
            <ul>
              <li v-for="problem in reviewResult.report.title_analysis.problems" :key="problem">{{ problem }}</li>
            </ul>
          </div>
          <div>
            <h4>标题公式</h4>
            <ul>
              <li v-for="formula in reviewResult.report.title_analysis.formulas" :key="formula">{{ formula }}</li>
            </ul>
          </div>
        </section>
        <section class="review-section review-columns">
          <div>
            <h4>结构优势</h4>
            <ul>
              <li v-for="strength in reviewResult.report.content_structure.strengths" :key="strength">{{ strength }}</li>
            </ul>
          </div>
          <div>
            <h4>结构问题</h4>
            <ul>
              <li v-for="problem in reviewResult.report.content_structure.problems" :key="problem">{{ problem }}</li>
            </ul>
          </div>
          <div>
            <h4>结构模板</h4>
            <p>{{ reviewResult.report.content_structure.template || '-' }}</p>
          </div>
        </section>
        <section class="review-section review-columns">
          <div>
            <h4>受众画像</h4>
            <p>{{ reviewResult.report.audience.profile || '-' }}</p>
          </div>
          <div>
            <h4>关注点</h4>
            <ul>
              <li v-for="interest in reviewResult.report.audience.interests" :key="interest">{{ interest }}</li>
            </ul>
          </div>
          <div>
            <h4>未满足需求</h4>
            <ul>
              <li v-for="need in reviewResult.report.audience.unmet_needs" :key="need">{{ need }}</li>
            </ul>
          </div>
        </section>
        <section class="review-section">
          <h3>选题建议</h3>
          <div class="review-columns">
            <div v-for="topic in reviewResult.report.topic_suggestions" :key="topic.topic" class="review-item">
              <strong>{{ topic.topic }}</strong>
              <small>{{ topic.title_direction }}</small>
              <p>{{ topic.angle }}</p>
              <small>{{ topic.reason }} / 关注指标：{{ topic.metric }}</small>
            </div>
          </div>
        </section>
        <section class="review-section">
          <h3>行动建议</h3>
          <div class="review-columns">
            <div v-for="action in reviewResult.report.actions" :key="action.action" class="review-item">
              <strong>{{ action.action }}</strong>
              <small>{{ priorityLabel(action.priority) }}</small>
              <p>周期：{{ action.cycle }}</p>
              <small>指标：{{ action.metric }}</small>
            </div>
          </div>
        </section>
        <section class="review-section">
          <h3>数据边界</h3>
          <ul>
            <li v-for="limit in reviewResult.report.data_limits" :key="limit">{{ limit }}</li>
          </ul>
        </section>
        <section class="review-section">
          <h3>原始输出</h3>
          <pre>{{ reviewResult.raw_report || '-' }}</pre>
        </section>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { inject } from 'vue'
import { appContextKey } from '../appContext'

const app = inject(appContextKey)
if (!app) {
  throw new Error('ReviewReportModal 缺少 appContext')
}

const reviewResult = app.reviewResult
const reviewResultCreatedAt = app.reviewResultCreatedAt
const closeReviewResult = app.closeReviewResult
const priorityLabel = app.priorityLabel
</script>
