import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, reactive, ref, type EffectScope } from 'vue'
import { useListQueryState, queryField } from './useListQueryState'
import { queryDates, queryPage, querySize, queryStrings, queryText } from '@/utils/listQuery'
const mocks = vi.hoisted(() => ({ route: undefined as unknown, replace: vi.fn(), warning: vi.fn() }))
vi.mock('vue-router', () => ({ useRoute: () => mocks.route, useRouter: () => ({ replace: mocks.replace }) }))
vi.mock('element-plus', () => ({ ElMessage: { warning: mocks.warning } }))
vi.mock('@/i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
const scopes: EffectScope[] = []
async function flush() { for (let i = 0; i < 10; i++) { await Promise.resolve(); await nextTick() } }
function setup(filters?: string) {
  const route = reactive({ path: '/users', query: { filters, userId: 'selected' } })
  mocks.route = route
  mocks.replace.mockImplementation(async ({ query }) => { route.query = query })
  const search = ref(''), page = ref(0), size = ref(20), roles = ref<string[]>([]), reload = vi.fn().mockResolvedValue(undefined)
  const scope = effectScope(); scopes.push(scope)
  const state = scope.run(() => useListQueryState({ search: queryField(search, queryText), page: queryField(page, queryPage), size: queryField(size, querySize), roles: queryField(roles, queryStrings) }, reload))!
  return { route, search, page, size, roles, reload, ...state }
}
beforeEach(() => { mocks.replace.mockReset(); mocks.warning.mockReset() })
afterEach(() => scopes.splice(0).forEach((scope) => scope.stop()))
describe('list URL state', () => {
  it('restores initial filters, page, and size before loading', async () => {
    const state = setup(JSON.stringify({ search: 'ACME', page: 3, size: 40, roles: ['manager'] }))
    await state.restoreInitial()
    expect(state.search.value).toBe('ACME'); expect(state.page.value).toBe(3); expect(state.size.value).toBe(40)
    expect(state.roles.value).toEqual(['manager']); expect(mocks.replace).not.toHaveBeenCalled()
  })
  it('stores changes without dropping the selected detail link or triggering a second load', async () => {
    const state = setup(); await state.restoreInitial()
    state.search.value = 'Alice'; state.page.value = 2; await flush()
    expect(state.route.query.userId).toBe('selected')
    expect(JSON.parse(state.route.query.filters!)).toMatchObject({ search: 'Alice', page: 2 })
    expect(state.reload).not.toHaveBeenCalled()
  })
  it('restores history navigation and resets omitted filters to defaults', async () => {
    const state = setup(JSON.stringify({ search: 'ACME', page: 2, roles: ['manager'] })); await state.restoreInitial()
    state.route.query.filters = JSON.stringify({ page: 1, size: 50 }); await flush()
    expect(state.search.value).toBe(''); expect(state.roles.value).toEqual([])
    expect(state.page.value).toBe(1); expect(state.size.value).toBe(50); expect(state.reload).toHaveBeenCalledTimes(1)
  })
  it('ignores malformed values and prevents unsafe pagination parameters', async () => {
    const state = setup(JSON.stringify({ search: {}, page: -2, size: 999999, roles: ['admin', null, 'admin'] })); await state.restoreInitial()
    expect(state.page.value).toBe(0); expect(state.size.value).toBe(20); expect(state.search.value).toBe('')
    expect(state.roles.value).toEqual(['admin'])
    state.route.query.filters = '{invalid'; await flush()
    expect(state.roles.value).toEqual([])
  })
  it('finishes an older hydration before applying the latest history entry', async () => {
    const route = reactive({ path: '/purchases', query: { filters: undefined as string | undefined } })
    mocks.route = route
    const selected = ref(''), reload = vi.fn().mockResolvedValue(undefined)
    let finishOld!: () => void
    const scope = effectScope(); scopes.push(scope)
    const state = scope.run(() => useListQueryState({ selected: {
      read: () => selected.value,
      async restore(value) {
        if (value === 'old') await new Promise<void>((resolve) => { finishOld = resolve })
        selected.value = queryText(value)
      },
    } }, reload))!
    await state.restoreInitial()
    route.query.filters = JSON.stringify({ selected: 'old' }); await flush()
    route.query.filters = JSON.stringify({ selected: 'latest' }); await flush()
    expect(state.restoring.value).toBe(true)
    finishOld(); await flush()
    expect(selected.value).toBe('latest'); expect(reload).toHaveBeenCalledTimes(1)
    expect(state.restoring.value).toBe(false)
  })
  it('restores date-time ranges used by purchase and sale filters', () => {
    const dates = ['2026-10-01T00:00:00.000', '2026-10-21T23:59:59.999']
    expect(queryDates(dates)).toEqual(dates)
    expect(queryDates([...dates].reverse())).toBeNull()
    expect(queryDates(['wrong', '2026-10-21'])).toBeNull()
  })
})
