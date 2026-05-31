import { computed } from 'vue'
import { useAuthStore } from '@/stores/authStore.ts'

export function usePermissions() {
  const authStore = useAuthStore()
  const permissions = computed(() => {
    return new Set((authStore.user?.permissions ?? []).map(normalizePermission))
  })

  function hasPermission(...codes: string[]) {
    return codes.some((code) => permissions.value.has(normalizePermission(code)))
  }

  return {
    permissions,
    hasPermission,
  }
}

function normalizePermission(permission: string) {
  return permission
    .trim()
    .toUpperCase()
    .replace(/[._]/g, '')
}
