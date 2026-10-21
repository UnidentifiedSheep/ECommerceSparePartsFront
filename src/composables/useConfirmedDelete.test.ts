import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ElMessageBox } from 'element-plus'
import { useConfirmedDelete } from './useConfirmedDelete'
vi.mock('element-plus', () => ({ ElMessageBox: { confirm: vi.fn() } }))
vi.mock('@/i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
beforeEach(() => { vi.mocked(ElMessageBox.confirm).mockReset() })
describe('confirmed deletion', () => {
  it('cancels without making a request and unlocks the row', async () => {
    vi.mocked(ElMessageBox.confirm).mockRejectedValue('cancel')
    const action = vi.fn(), deletion = useConfirmedDelete()
    await deletion.remove('1', 'ACME', action)
    expect(action).not.toHaveBeenCalled()
    expect(deletion.isPending('1')).toBe(false)
  })
  it('prevents duplicates both during confirmation and during the request', async () => {
    let confirm!: () => void, finish!: () => void
    vi.mocked(ElMessageBox.confirm).mockImplementation(() => new Promise((resolve) => { confirm = () => resolve('confirm' as Awaited<ReturnType<typeof ElMessageBox.confirm>>) }))
    const action = vi.fn(() => new Promise<void>((resolve) => { finish = resolve }))
    const deletion = useConfirmedDelete(), pending = deletion.remove('1', 'ACME', action)
    await deletion.remove('1', 'ACME', action)
    expect(ElMessageBox.confirm).toHaveBeenCalledTimes(1)
    expect(deletion.isPending('1')).toBe(true)
    confirm(); await Promise.resolve(); await Promise.resolve()
    await deletion.remove('1', 'ACME', action)
    expect(action).toHaveBeenCalledTimes(1)
    finish(); await pending
    expect(deletion.isPending('1')).toBe(false)
  })
  it('unlocks a failed request for a retry', async () => {
    vi.mocked(ElMessageBox.confirm).mockResolvedValue('confirm' as Awaited<ReturnType<typeof ElMessageBox.confirm>>)
    const deletion = useConfirmedDelete()
    await expect(deletion.remove('1', 'ACME', async () => { throw new Error('offline') })).rejects.toThrow('offline')
    expect(deletion.isPending('1')).toBe(false)
  })
})
