'use client'

import { create } from 'zustand'
import { supabase, type WorkspaceMember } from '@/lib/supabase'

type UserStore = {
  members: WorkspaceMember[]
  loading: boolean
  fetchMembers: (workspaceId: string) => Promise<void>
  createUser: (params: {
    workspaceId: string
    email: string
    password: string
    fullName: string
    role: WorkspaceMember['role']
  }) => Promise<{ error: string | null }>
  deactivateUser: (memberId: string) => Promise<{ error: string | null }>
  reactivateUser: (memberId: string) => Promise<{ error: string | null }>
  changeRole: (memberId: string, role: WorkspaceMember['role']) => Promise<{ error: string | null }>
}

export const useUserStore = create<UserStore>((set, get) => ({
  members: [],
  loading: false,

  fetchMembers: async (workspaceId) => {
    set({ loading: true })
    const { data, error } = await supabase
      .from('workspace_members')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at')
    if (!error && data) set({ members: data as WorkspaceMember[] })
    set({ loading: false })
  },

  createUser: async ({ workspaceId, email, password, fullName, role }) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return { error: 'No autenticado' }

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/manage-user`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ operation: 'create', workspaceId, email, password, fullName, role }),
      }
    )
    const result = await res.json()
    if (!res.ok) return { error: result.error ?? 'Error al crear usuario' }

    // Refresh member list
    await get().fetchMembers(workspaceId)
    return { error: null }
  },

  deactivateUser: async (memberId) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return { error: 'No autenticado' }

    const member = get().members.find((m) => m.id === memberId)
    if (!member) return { error: 'Miembro no encontrado' }

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/manage-user`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ operation: 'deactivate', memberId, workspaceId: member.workspace_id }),
      }
    )
    const result = await res.json()
    if (!res.ok) return { error: result.error ?? 'Error al desactivar' }

    set({ members: get().members.map((m) => m.id === memberId ? { ...m, is_active: false } : m) })
    return { error: null }
  },

  reactivateUser: async (memberId) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return { error: 'No autenticado' }

    const member = get().members.find((m) => m.id === memberId)
    if (!member) return { error: 'Miembro no encontrado' }

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/manage-user`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ operation: 'reactivate', memberId, workspaceId: member.workspace_id }),
      }
    )
    const result = await res.json()
    if (!res.ok) return { error: result.error ?? 'Error al reactivar' }

    set({ members: get().members.map((m) => m.id === memberId ? { ...m, is_active: true } : m) })
    return { error: null }
  },

  changeRole: async (memberId, role) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return { error: 'No autenticado' }

    const member = get().members.find((m) => m.id === memberId)
    if (!member) return { error: 'Miembro no encontrado' }

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/manage-user`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ operation: 'change_role', memberId, role, workspaceId: member.workspace_id }),
      }
    )
    const result = await res.json()
    if (!res.ok) return { error: result.error ?? 'Error al cambiar rol' }

    set({ members: get().members.map((m) => m.id === memberId ? { ...m, role } : m) })
    return { error: null }
  },
}))
