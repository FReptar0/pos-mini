'use client'

import { useAuthStore } from '@/stores/authStore'
import { can } from '@/lib/permissions'

export function usePermissions() {
  const role = useAuthStore((s) => s.role)

  return {
    role,
    can: (resource: string, action: string) => can(role, resource, action),
  }
}
