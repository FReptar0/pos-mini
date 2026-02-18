import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type WorkspaceMember = {
  id: string
  workspace_id: string
  user_id: string
  role: 'admin' | 'manager' | 'cashier' | 'viewer'
  full_name: string | null
  email: string
  is_active: boolean
  invited_by: string | null
  created_at: string
}

export type Workspace = {
  id: string
  name: string
  owner_id: string
  created_at: string
}

export type Product = {
  id: string
  workspace_id: string
  name: string
  sku: string | null
  category: string
  cost_price: number
  sale_price: number
  stock: number
  min_stock: number
  created_at: string
  updated_at: string
}

export type Sale = {
  id: string
  workspace_id: string
  type: 'individual' | 'bulk_daily'
  sale_date: string
  items: SaleItem[]
  total_revenue: number
  total_cost: number
  total_profit: number
  notes: string | null
  created_at: string
}

export type SaleItem = {
  product_id: string
  product_name: string
  quantity: number
  sale_price: number
  cost_price: number
}

export type CashMovement = {
  id: string
  workspace_id: string
  type: 'income' | 'expense' | 'sale' | 'restock'
  amount: number
  description: string
  category: string
  movement_date: string
  related_sale_id: string | null
  created_at: string
}

export type Settings = {
  id: string
  workspace_id: string
  business_name: string
  currency: string
  accent_color: string
}
