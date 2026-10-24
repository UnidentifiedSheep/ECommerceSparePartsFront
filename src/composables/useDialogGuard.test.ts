import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref, type EffectScope } from 'vue'
import { ElMessageBox } from 'element-plus'
import { useDialogGuard } from './useDialogGuard'
const mocks = vi.hoisted(() => ({ beforeEach: vi.fn(), auth: { isAuthenticated: true } }))
vi.mock('vue', async (original) => ({ ...await original<typeof import('vue')>(), onMounted: vi.fn(), onBeforeUnmount: vi.fn() }))
vi.mock('@/stores/authStore', () => ({ useAuthStore: () => mocks.auth }))
vi.mock('vue-router', () => ({ useRouter: () => mocks }))
vi.mock('element-plus', () => ({ ElMessageBox: { confirm: vi.fn() } }))
vi.mock('@/i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
const scopes: EffectScope[] = []
async function setup() {
  const open = ref(false), busy = ref(false), name = ref('')
  const scope = effectScope(); scopes.push(scope)
  const guard = scope.run(() => useDialogGuard(open, busy, () => name.value))!
  open.value = true; name.value = 'initial'; await nextTick(); await nextTick()
  return { open, busy, name, guard }
}
beforeEach(() => { mocks.auth.isAuthenticated = true; vi.mocked(ElMessageBox.confirm).mockReset(); mocks.beforeEach.mockReset() })
afterEach(() => scopes.splice(0).forEach((scope) => scope.stop()))
describe('draft protection', () => {
  it('uses the initialized form as a clean baseline', async () => {
    const { open, guard } = await setup()
    expect(guard.dirty.value).toBe(false)
    await guard.requestClose()
    expect(open.value).toBe(false)
    expect(ElMessageBox.confirm).not.toHaveBeenCalled()
  })
  it('preserves the draft on cancellation, discards only after confirmation', async () => {
    const { open, name, guard } = await setup(); name.value = 'draft'
    vi.mocked(ElMessageBox.confirm).mockRejectedValueOnce('cancel').mockResolvedValueOnce('confirm' as Awaited<ReturnType<typeof ElMessageBox.confirm>>)
    await guard.requestClose(); expect(open.value).toBe(true); expect(name.value).toBe('draft')
    await guard.requestClose(); expect(open.value).toBe(false)
  })
  it('blocks closing and navigation while saving', async () => {
    const { open, busy, guard } = await setup(); busy.value = true
    await guard.requestClose(); expect(open.value).toBe(true)
    const navigate = mocks.beforeEach.mock.calls[0]![0]
    expect(await navigate({ path: '/sales' }, { path: '/purchases' })).toBe(false)
    expect(ElMessageBox.confirm).not.toHaveBeenCalled()
  })
  it('permits forced login navigation after session expiry even with an unsaved or saving form', async () => {
    const { name, busy } = await setup(); name.value = 'draft'; busy.value = true
    mocks.auth.isAuthenticated = false
    const navigate = mocks.beforeEach.mock.calls[0]![0]
    expect(await navigate({ path: '/auth' }, { path: '/purchases' })).toBe(true)
    expect(ElMessageBox.confirm).not.toHaveBeenCalled()
  })
  it('protects navigation, but permits query updates on the same page', async () => {
    const { name } = await setup(); name.value = 'draft'
    vi.mocked(ElMessageBox.confirm).mockRejectedValue('cancel')
    const navigate = mocks.beforeEach.mock.calls[0]![0]
    expect(await navigate({ path: '/sales' }, { path: '/purchases' })).toBe(false)
    expect(await navigate({ path: '/purchases' }, { path: '/purchases' })).toBe(true)
  })
})
