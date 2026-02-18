'use client'

import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'
import type { WorkspaceMember } from '@/lib/supabase'

type AuthStore = {
  user: User | null
  session: Session | null
  loading: boolean
  initialized: boolean
  workspaceId: string | null
  role: WorkspaceMember['role'] | null
  memberProfile: WorkspaceMember | null
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  initialize: () => void
  loadWorkspace: (userId: string) => Promise<void>
}

// These are module-level singletons — they survive component mounts/unmounts
let workspaceLoadPromise: Promise<void> | null = null
let authListenerRegistered = false  // ← guard: only register listener once

async function fetchOrCreateMembership(userId: string): Promise<WorkspaceMember | null> {
  // Check for ANY membership row (active or inactive) first.
  // Prevents invited users from getting a new workspace auto-provisioned.
  const { data: anyMembership, error: fetchError } = await supabase
    .from('workspace_members')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  // If the query itself failed (network error, RLS issue, etc.) throw so the
  // caller can preserve the current state rather than wiping it.
  if (fetchError) throw fetchError

  if (anyMembership) {
    if (anyMembership.is_active) return anyMembership as WorkspaceMember
    return null // deactivated — block access
  }

  // No membership at all — brand-new user, auto-provision workspace + admin role
  const { data: ownedWorkspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('owner_id', userId)
    .limit(1)
    .maybeSingle()

  let workspaceId: string

  if (ownedWorkspace) {
    workspaceId = ownedWorkspace.id
  } else {
    const { data: newWs, error: wsErr } = await supabase
      .from('workspaces')
      .insert({ name: 'Mi Negocio', owner_id: userId })
      .select('id')
      .single()
    if (wsErr || !newWs) return null
    workspaceId = newWs.id
  }

  // Race guard: check again before inserting
  const { data: raceCheck } = await supabase
    .from('workspace_members')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()
  if (raceCheck) return raceCheck as WorkspaceMember

  const { data: authUser } = await supabase.auth.getUser()
  if (!authUser.user) return null

  const { data: member, error: memErr } = await supabase
    .from('workspace_members')
    .insert({
      workspace_id: workspaceId,
      user_id: userId,
      role: 'admin',
      email: authUser.user.email ?? '',
      is_active: true,
    })
    .select()
    .single()

  if (memErr) {
    const { data: retry } = await supabase
      .from('workspace_members')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle()
    return (retry as WorkspaceMember) ?? null
  }

  return member as WorkspaceMember
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  session: null,
  loading: false,
  initialized: false,
  workspaceId: null,
  role: null,
  memberProfile: null,

  loadWorkspace: async (userId: string) => {
    if (workspaceLoadPromise) {
      await workspaceLoadPromise
      return
    }

    let resolve!: () => void
    workspaceLoadPromise = new Promise((r) => (resolve = r))

    try {
      const member = await fetchOrCreateMembership(userId)
      if (member) {
        set({ workspaceId: member.workspace_id, role: member.role, memberProfile: member })
      } else {
        // member === null means the membership exists but is_active = false
        // (deactivated). The Realtime kick in AuthGuard also handles this, but
        // clear here as a belt-and-suspenders fallback.
        set({ workspaceId: null, role: null, memberProfile: null })
      }
    } catch {
      // Query failed (network error, RLS issue). Preserve existing workspace
      // state so the user isn't unexpectedly locked out of the app.
    } finally {
      workspaceLoadPromise = null
      resolve()
    }
  },

  initialize: () => {
    // Load current session immediately
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      set({ session, user: session?.user ?? null, initialized: true })
      if (session?.user) {
        await get().loadWorkspace(session.user.id)
      }
    })

    // Only register the auth state listener ONCE, ever
    if (authListenerRegistered) return
    authListenerRegistered = true

    supabase.auth.onAuthStateChange(async (event, session) => {
      set({ session, user: session?.user ?? null })

      if (session?.user) {
        set({ initialized: true })
        if (event === 'SIGNED_IN') {
          await get().loadWorkspace(session.user.id)
        } else if (!get().workspaceId) {
          await get().loadWorkspace(session.user.id)
        }
      } else {
        set({ initialized: true, workspaceId: null, role: null, memberProfile: null })
      }
    })
  },

  signIn: async (email, password) => {
    set({ loading: true })
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    set({ loading: false })
    if (error) return { error: error.message }
    return { error: null }
  },

  signUp: async (email, password) => {
    set({ loading: true })
    const { error } = await supabase.auth.signUp({ email, password })
    set({ loading: false })
    if (error) return { error: error.message }
    return { error: null }
  },

  signOut: async () => {
    workspaceLoadPromise = null
    await supabase.auth.signOut()
    set({ user: null, session: null, workspaceId: null, role: null, memberProfile: null })
  },
}))
