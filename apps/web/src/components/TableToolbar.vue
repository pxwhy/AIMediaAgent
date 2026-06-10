<!--
实现逻辑：
1. 提供列表页统一工具栏容器，只承载操作按钮和必要筛选控件。
2. 不展示总数、已选数量等说明计数，保持表格底部只负责分页。
3. 左侧用于筛选类控件，右侧用于新增、批量删除、刷新等操作。
-->

<template>
  <div class="table-toolbar">
    <div class="table-toolbar-filters">
      <slot name="filters" />
    </div>
    <div class="table-toolbar-actions">
      <slot />
    </div>
  </div>
</template>
