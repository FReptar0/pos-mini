import { supabase } from '@/lib/supabase'

const SAMPLE_PRODUCTS = [
  { name: 'Coca Cola 600ml', sku: 'BEB-001', category: 'Bebidas', cost_price: 12, sale_price: 20, stock: 24, min_stock: 6 },
  { name: 'Agua Natural 1L', sku: 'BEB-002', category: 'Bebidas', cost_price: 6, sale_price: 12, stock: 30, min_stock: 10 },
  { name: 'Sabritas Original', sku: 'SNK-001', category: 'Snacks', cost_price: 10, sale_price: 18, stock: 15, min_stock: 5 },
  { name: 'Galletas Marinela', sku: 'SNK-002', category: 'Snacks', cost_price: 14, sale_price: 22, stock: 4, min_stock: 5 },
  { name: 'Jabón Zote', sku: 'LIM-001', category: 'Limpieza', cost_price: 18, sale_price: 28, stock: 8, min_stock: 3 },
  { name: 'Detergente Roma 500g', sku: 'LIM-002', category: 'Limpieza', cost_price: 22, sale_price: 35, stock: 2, min_stock: 3 },
  { name: 'Chicles Trident', sku: 'VAR-001', category: 'Varios', cost_price: 5, sale_price: 10, stock: 20, min_stock: 8 },
  { name: 'Pilas AA (pack)', sku: 'VAR-002', category: 'Varios', cost_price: 30, sale_price: 50, stock: 0, min_stock: 2 },
]

export async function seedDemoData(userId: string) {
  // Insert products
  const { data: products, error: prodError } = await supabase
    .from('products')
    .insert(SAMPLE_PRODUCTS.map((p) => ({ ...p, user_id: userId })))
    .select()

  if (prodError || !products) return { error: prodError?.message ?? 'Error insertando productos' }

  // Build 7 days of sales
  const today = new Date()
  for (let d = 6; d >= 0; d--) {
    const date = new Date(today)
    date.setDate(date.getDate() - d)
    const dateStr = date.toISOString().split('T')[0]

    // Pick 3-5 random products
    const dayProducts = products.sort(() => Math.random() - 0.5).slice(0, 3 + Math.floor(Math.random() * 3))
    const items = dayProducts.map((p) => ({
      product_id: p.id,
      product_name: p.name,
      quantity: 1 + Math.floor(Math.random() * 4),
      sale_price: p.sale_price,
      cost_price: p.cost_price,
    }))
    const total_revenue = items.reduce((s, i) => s + i.sale_price * i.quantity, 0)
    const total_cost = items.reduce((s, i) => s + i.cost_price * i.quantity, 0)

    const { data: sale } = await supabase
      .from('sales')
      .insert({
        user_id: userId,
        type: 'bulk_daily',
        sale_date: dateStr,
        items,
        total_revenue,
        total_cost,
        total_profit: total_revenue - total_cost,
      })
      .select()
      .single()

    if (sale) {
      await supabase.from('cash_movements').insert({
        user_id: userId,
        type: 'sale',
        amount: total_revenue,
        description: `Cierre del día (ejemplo)`,
        category: 'Ventas',
        movement_date: dateStr,
        related_sale_id: sale.id,
      })
    }
  }

  // Some restock movements
  await supabase.from('cash_movements').insert([
    { user_id: userId, type: 'restock', amount: 350, description: 'Restock inicial bebidas', category: 'Inventario', movement_date: today.toISOString().split('T')[0] },
    { user_id: userId, type: 'restock', amount: 220, description: 'Restock snacks y limpieza', category: 'Inventario', movement_date: today.toISOString().split('T')[0] },
  ])

  return { error: null }
}
