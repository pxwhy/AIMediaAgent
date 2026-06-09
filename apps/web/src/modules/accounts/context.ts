/*
实现逻辑：
1. 管理账号模块的登录接入、账号删除、批量删除、作品同步和作品内容弹框状态。
2. 账号删除后的发布、肖像、智能筛选等跨模块清理通过回调完成，账号模块不直接操作其他业务模块内部状态。
3. 作品同步只保存和展示账号作品，不参与复盘、筛选或发布任务创建。
*/

import { computed, ref } from 'vue'
import {
  confirmLoginSession,
  createLoginSession,
  deleteAccount,
  loadAccountWorks,
  syncAccountWorks,
  type Account,
  type AccountWork,
  type DashboardPayload
} from '../../api/client'

type AccountsDependencies = {
  dashboard: DashboardPayload
  statusText: { value: string }
  refresh: () => Promise<void>
  onAccountsDeleted: (accountIds: number[]) => void
}

export function createAccountsContext(deps: AccountsDependencies) {
  const loginBusy = ref(false)
  const loginPlatform = ref('toutiao')
  const loginSessionId = ref('')
  const selectedAccountIds = ref<number[]>([])
  const selectedWorkAccount = ref<Account | null>(null)
  const accountWorks = ref<AccountWork[]>([])
  const selectedAccountWork = ref<AccountWork | null>(null)

  const allAccountsSelected = computed({
    get() {
      return deps.dashboard.accounts.length > 0 && selectedAccountIds.value.length === deps.dashboard.accounts.length
    },
    set(checked: boolean) {
      selectedAccountIds.value = checked ? deps.dashboard.accounts.map((account) => account.id) : []
    }
  })

  async function openLoginSession() {
    loginBusy.value = true
    deps.statusText.value = '正在打开登录页'
    try {
      const session = await createLoginSession(loginPlatform.value)
      loginSessionId.value = session.id
      deps.statusText.value = '请在浏览器完成登录'
    } catch (error) {
      console.error(error)
      deps.statusText.value = '打开登录页失败'
    } finally {
      loginBusy.value = false
    }
  }

  async function confirmLogin() {
    if (!loginSessionId.value) {
      return
    }
    loginBusy.value = true
    deps.statusText.value = '正在确认登录'
    try {
      const session = await confirmLoginSession(loginSessionId.value)
      if (session.status === 'completed') {
        loginSessionId.value = ''
        await deps.refresh()
        deps.statusText.value = '登录态已保存，账号已同步'
      } else {
        deps.statusText.value = session.error_message || '登录确认失败'
      }
    } catch (error) {
      console.error(error)
      deps.statusText.value = '登录确认失败'
    } finally {
      loginBusy.value = false
    }
  }

  async function removeAccount(account: Account) {
    if (!window.confirm(`确认删除「${account.nickname || account.uid || account.platform}」吗？`)) {
      return
    }

    loginBusy.value = true
    deps.statusText.value = '正在删除账号'
    try {
      await deleteAccount(account.id)
      selectedAccountIds.value = selectedAccountIds.value.filter((accountId) => accountId !== account.id)
      if (selectedWorkAccount.value?.id === account.id) {
        clearAccountWorks()
      }
      deps.onAccountsDeleted([account.id])
      await deps.refresh()
      deps.statusText.value = '账号已删除'
    } catch (error) {
      console.error(error)
      deps.statusText.value = '账号删除失败'
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
    deps.statusText.value = '正在批量删除账号'
    try {
      await Promise.all(accountIds.map((accountId) => deleteAccount(accountId)))
      if (selectedWorkAccount.value && accountIds.includes(selectedWorkAccount.value.id)) {
        clearAccountWorks()
      }
      deps.onAccountsDeleted(accountIds)
      selectedAccountIds.value = []
      await deps.refresh()
      deps.statusText.value = `已删除 ${accountIds.length} 个账号`
    } catch (error) {
      console.error(error)
      deps.statusText.value = '批量删除账号失败'
    } finally {
      loginBusy.value = false
    }
  }

  async function syncWorks(account: Account) {
    loginBusy.value = true
    deps.statusText.value = '正在同步作品'
    try {
      const result = await syncAccountWorks(account.id)
      selectedWorkAccount.value = account
      accountWorks.value = await loadAccountWorks(account.id)
      selectedAccountWork.value = null
      deps.statusText.value = result.message || `已同步 ${result.synced_count} 条作品`
    } catch (error) {
      console.error(error)
      deps.statusText.value = '同步作品失败'
    } finally {
      loginBusy.value = false
    }
  }

  async function showAccountWorks(account: Account) {
    loginBusy.value = true
    deps.statusText.value = '正在加载作品'
    try {
      selectedWorkAccount.value = account
      accountWorks.value = await loadAccountWorks(account.id)
      selectedAccountWork.value = null
      deps.statusText.value = '作品已加载'
    } catch (error) {
      console.error(error)
      deps.statusText.value = '作品加载失败'
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

  return {
    loginBusy,
    loginPlatform,
    loginSessionId,
    selectedAccountIds,
    selectedWorkAccount,
    accountWorks,
    selectedAccountWork,
    allAccountsSelected,
    openLoginSession,
    confirmLogin,
    removeAccount,
    removeSelectedAccounts,
    syncWorks,
    showAccountWorks,
    clearAccountWorks,
    selectAccountWork
  }
}
