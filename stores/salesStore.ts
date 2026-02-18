'use client'

import { create } from 'zustand'
import { supabase, type Sale, type SaleItem } from '@/lib/supabase'

type SalesStore = {
  sales: Sale[]
  loading: boolean
  fetch: (workspaceId: string, from?: string, to?: string) => Promise<void>
  createSale: (sale: {
    workspaceId: string
    type: 'individual' | 'bulk_daily'
    saleDate: string
    items: SaleItem[]
    notes?: string
  }) => Promise<{ data: Sale | null; error: string | null }>
}

export const useSalesStore = create<SalesStore>((set, get) => ({
  sales: [],
  loading: false,

  fetch: async (workspaceId, from, to) => {
    set({ loading: true })
    let query = supabase
      .from('sales')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
    if (from) query = query.gte('sale_date', from)
    if (to) query = query.lte('sale_date', to)
    const { data, error } = await query
    if (!error && data) set({ sales: data })
    set({ loading: false })
  },

  createSale: async ({ workspaceId, type, saleDate, items, notes }) => {
    const total_revenue = items.reduce((s, i) => s + i.sale_price * i.quantity, 0)
    const total_cost = items.reduce((s, i) => s + i.cost_price * i.quantity, 0)
    const total_profit = total_revenue - total_cost

    const { data, error } = await supabase
      .from('sales')
      .insert({
        workspace_id: workspaceId,
        type,
        sale_date: saleDate,
        items,
        total_revenue,
        total_cost,
        total_profit,
        notes: notes ?? null,
      })
      .select()
      .single()

    if (error) return { data: null, error: error.message }
    set({ sales: [data, ...get().sales] })
    return { data, error: null }
  },
}))
