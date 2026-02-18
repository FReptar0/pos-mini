import type { WorkspaceMember } from '@/lib/supabase'

type Role = WorkspaceMember['role']

type PermissionMatrix = {
  [resource: string]: {
    [action: string]: Role[]
  }
}

export const PERMISSIONS: PermissionMatrix = {
  products: {
    view: ['admin', 'manager', 'cashier', 'viewer'],
    create: ['admin', 'manager'],
    edit: ['admin', 'manager'],
    delete: ['admin', 'manager'],
  },
  sales: {
    view: ['admin', 'manager', 'cashier', 'viewer'],
    create: ['admin', 'manager', 'cashier'],
  },
  cash: {
    view: ['admin', 'manager', 'cashier', 'viewer'],
    create: ['admin', 'manager', 'cashier'],
  },
  reports: {
    view: ['admin', 'manager', 'viewer'],
  },
  users: {
    view: ['admin'],
    manage: ['admin'],
  },
}

export function can(role: Role | null, resource: string, action: string): boolean {
  if (!role) return false
  const allowed = PERMISSIONS[resource]?.[action]
  if (!allowed) return false
  return allowed.includes(role)
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrador',
  manager: 'Gerente',
  cashier: 'Cajero',
  viewer: 'Visualizador',
}

export const ROLE_COLORS: Record<Role, string> = {
  admin: '#10b981',
  manager: '#3b82f6',
  cashier: '#f59e0b',
  viewer: '#888',
}
