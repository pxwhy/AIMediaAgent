<!--
实现逻辑：
1. 统一挂载工作台跨模块弹框，具体展示交给各弹框子组件。
2. App.vue 只引用一个全局弹框入口，避免壳层感知每个弹框细节。
3. 子组件继续通过稳定的 appContext 读取业务状态，减少跨层传参。
-->

<template>
  <AccountWorkModal />
  <RawContentDetailModal />
  <DiagnosticsModal />
  <SkillDetailModal />
  <ProfileReportModal />
  <ReviewReportModal />
  <PublishCreateModal />
</template>

<script setup lang="ts">
import AccountWorkModal from './AccountWorkModal.vue'
import RawContentDetailModal from './RawContentDetailModal.vue'
import DiagnosticsModal from './DiagnosticsModal.vue'
import SkillDetailModal from './SkillDetailModal.vue'
import ProfileReportModal from './ProfileReportModal.vue'
import ReviewReportModal from './ReviewReportModal.vue'
import PublishCreateModal from './PublishCreateModal.vue'
</script>
