'use client'

import { create } from 'zustand'
import { supabase, type Product } from '@/lib/supabase'

type InventoryStore = {
  products: Product[]
  loading: boolean
  fetch: (workspaceId: string) => Promise<void>
  add: (product: Omit<Product, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>, workspaceId: string) => Promise<{ error: string | null }>
  update: (id: string, updates: Partial<Product>) => Promise<{ error: string | null }>
  remove: (id: string) => Promise<{ error: string | null }>
  adjustStock: (id: string, delta: number) => Promise<{ error: string | null }>
}

export const useInventoryStore = create<InventoryStore>((set, get) => ({
  products: [],
  loading: false,

  fetch: async (workspaceId) => {
    set({ loading: true })
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('name')
    if (!error && data) set({ products: data })
    set({ loading: false })
  },

  add: async (product, workspaceId) => {
    const { data, error } = await supabase
      .from('products')
      .insert({ ...product, workspace_id: workspaceId })
      .select()
      .single()
    if (error) return { error: error.message }
    set({ products: [...get().products, data] })
    return { error: null }
  },

  update: async (id, updates) => {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) return { error: error.message }
    set({ products: get().products.map((p) => (p.id === id ? data : p)) })
    return { error: null }
  },

  remove: async (id) => {
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) return { error: error.message }
    set({ products: get().products.filter((p) => p.id !== id) })
    return { error: null }
  },

  adjustStock: async (id, delta) => {
    const product = get().products.find((p) => p.id === id)
    if (!product) return { error: 'Producto no encontrado' }
    const newStock = Math.max(0, product.stock + delta)
    return get().update(id, { stock: newStock })
  },
}))
