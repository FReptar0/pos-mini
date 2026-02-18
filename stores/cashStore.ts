'use client'

import { create } from 'zustand'
import { supabase, type CashMovement } from '@/lib/supabase'

type CashStore = {
  movements: CashMovement[]
  balance: number
  loading: boolean
  fetch: (workspaceId: string, from?: string, to?: string) => Promise<void>
  addMovement: (movement: Omit<CashMovement, 'id' | 'workspace_id' | 'created_at'>, workspaceId: string) => Promise<{ error: string | null }>
}

export const useCashStore = create<CashStore>((set, get) => ({
  movements: [],
  balance: 0,
  loading: false,

  fetch: async (workspaceId, from, to) => {
    set({ loading: true })
    let query = supabase
      .from('cash_movements')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
    if (from) query = query.gte('movement_date', from)
    if (to) query = query.lte('movement_date', to)
    const { data, error } = await query
    if (!error && data) {
      const balance = data.reduce((sum, m) => {
        return m.type === 'expense' || m.type === 'restock' ? sum - m.amount : sum + m.amount
      }, 0)
      set({ movements: data, balance })
    }
    set({ loading: false })
  },

  addMovement: async (movement, workspaceId) => {
    const { data, error } = await supabase
      .from('cash_movements')
      .insert({ ...movement, workspace_id: workspaceId })
      .select()
      .single()
    if (error) return { error: error.message }
    const m = data as CashMovement
    const delta = m.type === 'expense' || m.type === 'restock' ? -m.amount : m.amount
    set({
      movements: [m, ...get().movements],
      balance: get().balance + delta,
    })
    return { error: null }
  },
}))
