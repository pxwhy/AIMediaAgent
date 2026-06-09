/*
实现逻辑：
1. 统一提供前端工作台的页面状态、共享数据和事件处理函数，供业务模块组件注入使用。
2. 当前阶段先服务于 App.vue 业务拆分，避免在拆页面时重复传递大量 props 和 emits。
*/

import type { InjectionKey } from 'vue'

export const appContextKey: InjectionKey<any> = Symbol.for('aimedia-agent.app-context')
