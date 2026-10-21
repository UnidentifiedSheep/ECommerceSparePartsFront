import { reactive } from 'vue'
import { ElMessageBox } from 'element-plus'
import { useI18n } from '@/i18n'

export function useConfirmedDelete() {
  const pending = reactive(new Set<string>())
  const { t } = useI18n()
  async function remove(key: string, name: string, action: () => Promise<void>) {
    if (pending.has(key)) return
    pending.add(key)
    try {
      try {
        await ElMessageBox.confirm(t('common.messages.deleteNamed', { name }), t('common.actions.delete'), {
          type: 'warning', confirmButtonText: t('common.actions.delete'), cancelButtonText: t('common.actions.cancel'),
        })
      } catch { return }
      await action()
    } finally { pending.delete(key) }
  }
  return { remove, isPending: (key: string) => pending.has(key) }
}
