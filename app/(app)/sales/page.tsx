'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useInventoryStore } from '@/stores/inventoryStore'
import { useSalesStore } from '@/stores/salesStore'
import { useCashStore } from '@/stores/cashStore'
import { usePermissions } from '@/hooks/usePermissions'
import ProductSearch from '@/components/ui/ProductSearch'
import BottomSheet from '@/components/ui/BottomSheet'
import GlassCard from '@/components/ui/GlassCard'
import EmptyState from '@/components/ui/EmptyState'
import type { Product, SaleItem } from '@/lib/supabase'
import { formatCurrency, today } from '@/utils/formatters'
import { ShoppingCart, Minus, Plus, X, CalendarDays } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

type CartItem = {
  product: Product
  quantity: number
  sale_price: number
}

export default function SalesPage() {
  const { workspaceId } = useAuthStore()
  const { products, fetch: fetchProducts, adjustStock } = useInventoryStore()
  const { createSale } = useSalesStore()
  const { addMovement } = useCashStore()
  const { can } = usePermissions()

  const [cart, setCart] = useState<CartItem[]>([])
  const [bulkOpen, setBulkOpen] = useState(false)

  useEffect(() => {
    if (workspaceId) fetchProducts(workspaceId)
  }, [workspaceId]) // eslint-disable-line react-hooks/exhaustive-deps

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id)
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [...prev, { product, quantity: 1, sale_price: product.sale_price }]
    })
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((i) => i.product.id !== productId))
  }

  function changeQty(productId: string, delta: number) {
    setCart((prev) =>
      prev.map((i) => {
        if (i.product.id !== productId) return i
        const newQty = Math.max(1, i.quantity + delta)
        return { ...i, quantity: newQty }
      })
    )
  }

  function changePrice(productId: string, price: string) {
    setCart((prev) =>
      prev.map((i) =>
        i.product.id === productId ? { ...i, sale_price: parseFloat(price) || 0 } : i
      )
    )
  }

  const subtotal = cart.reduce((s, i) => s + i.sale_price * i.quantity, 0)
  const estimatedProfit = cart.reduce(
    (s, i) => s + (i.sale_price - i.product.cost_price) * i.quantity,
    0
  )

  async function handleCheckout() {
    if (!workspaceId || cart.length === 0) return
    const items: SaleItem[] = cart.map((i) => ({
      product_id: i.product.id,
      product_name: i.product.name,
      quantity: i.quantity,
      sale_price: i.sale_price,
      cost_price: i.product.cost_price,
    }))

    const { data: sale, error } = await createSale({
      workspaceId,
      type: 'individual',
      saleDate: today(),
      items,
    })
    if (error || !sale) { toast.error(error ?? 'Error al registrar'); return }

    await Promise.all(cart.map((i) => adjustStock(i.product.id, -i.quantity)))

    await addMovement({
      type: 'sale',
      amount: subtotal,
      description: `Venta: ${cart.map((i) => i.product.name).join(', ')}`,
      category: 'Ventas',
      movement_date: today(),
      related_sale_id: sale.id,
    }, workspaceId)

    toast.success(`Venta registrada: ${formatCurrency(subtotal)}`)
    setCart([])
  }

  if (!can('sales', 'view')) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="text-center text-sm text-[#555]">Sin acceso a ventas</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 p-4 pb-36 animate-[fade-up_0.3s_ease-out]">
      <Toaster position="top-center" toastOptions={{ style: { background: '#111', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' } }} />

      {/* Search — only if can create sales */}
      {can('sales', 'create') && (
        <ProductSearch products={products} onSelect={addToCart} placeholder="Buscar producto para vender..." />
      )}

      {/* Bulk daily button */}
      {can('sales', 'create') && (
        <button
          onClick={() => setBulkOpen(true)}
          className="flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 text-sm font-medium text-[#888] transition-colors active:bg-white/5"
        >
          <CalendarDays size={16} />
          Registrar cierre del día
        </button>
      )}

      {/* Cart */}
      {cart.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="Carrito vacío"
          description={can('sales', 'create') ? 'Busca un producto para agregar a la venta' : 'Solo visualización de ventas'}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {cart.map((item) => (
            <GlassCard key={item.product.id} className="flex flex-col gap-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">{item.product.name}</p>
                  <p className="text-xs text-[#888]">{item.product.category}</p>
                </div>
                <button onClick={() => removeFromCart(item.product.id)} className="p-1 text-[#555] active:text-[#ef4444]">
                  <X size={16} />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => changeQty(item.product.id, -1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 active:bg-white/10"
                  >
                    <Minus size={14} className="text-white" />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold text-white">{item.quantity}</span>
                  <button
                    onClick={() => changeQty(item.product.id, 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 active:bg-white/10"
                  >
                    <Plus size={14} className="text-white" />
                  </button>
                </div>
                <div className="flex flex-1 items-center">
                  <span className="text-sm text-[#555]">$</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={item.sale_price}
                    onChange={(e) => changePrice(item.product.id, e.target.value)}
                    className="ml-1 w-full bg-transparent text-right text-sm font-semibold text-[#10b981] focus:outline-none"
                  />
                </div>
                <span className="text-sm font-bold text-white">
                  {formatCurrency(item.sale_price * item.quantity)}
                </span>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Sticky footer */}
      {cart.length > 0 && can('sales', 'create') && (
        <div
          className="fixed left-0 right-0 z-[55] px-4 py-3"
          style={{
            bottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))',
            background: 'rgba(10,10,10,0.95)',
            borderTop: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-[#888]">Subtotal</span>
            <span className="font-semibold text-white">{formatCurrency(subtotal)}</span>
          </div>
          <div className="mb-3 flex justify-between text-sm">
            <span className="text-[#888]">Ganancia estimada</span>
            <span className="font-semibold text-[#10b981]">{formatCurrency(estimatedProfit)}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCart([])}
              className="h-12 flex-1 rounded-xl border border-white/10 text-sm font-medium text-[#888] active:bg-white/5"
            >
              Cancelar
            </button>
            <button
              onClick={handleCheckout}
              className="h-12 flex-[2] rounded-xl bg-[#10b981] text-sm font-semibold text-white transition-all active:scale-95"
            >
              Cobrar {formatCurrency(subtotal)}
            </button>
          </div>
        </div>
      )}

      <BulkDaySheet
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        products={products}
        workspaceId={workspaceId ?? ''}
        onComplete={() => { setBulkOpen(false); if (workspaceId) fetchProducts(workspaceId) }}
      />
    </div>
  )
}

/* ─── Bulk day close sheet ─── */
type BulkDaySheetProps = {
  open: boolean
  onClose: () => void
  products: Product[]
  workspaceId: string
  onComplete: () => void
}

function BulkDaySheet({ open, onClose, products, workspaceId, onComplete }: BulkDaySheetProps) {
  const { createSale } = useSalesStore()
  const { addMovement } = useCashStore()
  const { adjustStock } = useInventoryStore()

  const [date, setDate] = useState(today())
  const [notes, setNotes] = useState('')
  const [quantities, setQuantities] = useState<Record<string, string>>({})
  const [prices, setPrices] = useState<Record<string, string>>({})

  function setQty(id: string, v: string) { setQuantities((q) => ({ ...q, [id]: v })) }
  function setPrice(id: string, v: string) { setPrices((p) => ({ ...p, [id]: v })) }

  const items = products
    .map((p) => ({
      product: p,
      quantity: parseInt(quantities[p.id] || '0') || 0,
      sale_price: parseFloat(prices[p.id] || String(p.sale_price)) || p.sale_price,
    }))
    .filter((i) => i.quantity > 0)

  const totalRevenue = items.reduce((s, i) => s + i.sale_price * i.quantity, 0)
  const totalProfit = items.reduce((s, i) => s + (i.sale_price - i.product.cost_price) * i.quantity, 0)

  async function handleConfirm() {
    if (items.length === 0) { toast.error('Ingresa al menos una cantidad'); return }
    const saleItems: SaleItem[] = items.map((i) => ({
      product_id: i.product.id,
      product_name: i.product.name,
      quantity: i.quantity,
      sale_price: i.sale_price,
      cost_price: i.product.cost_price,
    }))

    const { data: sale, error } = await createSale({
      workspaceId,
      type: 'bulk_daily',
      saleDate: date,
      items: saleItems,
      notes,
    })
    if (error || !sale) { toast.error(error ?? 'Error'); return }

    await Promise.all(items.map((i) => adjustStock(i.product.id, -i.quantity)))
    await addMovement({
      type: 'sale',
      amount: totalRevenue,
      description: `Cierre del día: ${items.length} productos`,
      category: 'Ventas',
      movement_date: date,
      related_sale_id: sale.id,
    }, workspaceId)

    toast.success(`Cierre registrado: ${formatCurrency(totalRevenue)}`)
    setQuantities({})
    setPrices({})
    setNotes('')
    onComplete()
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Cierre del día">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium uppercase tracking-wider text-[#888]">Fecha</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white focus:outline-none"
            style={{ colorScheme: 'dark' }}
          />
        </div>

        <div className="flex flex-col gap-2">
          {products.map((p) => (
            <div key={p.id} className="glass rounded-xl p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">{p.name}</p>
                  <p className="text-xs text-[#555]">Stock: {p.stock}</p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    inputMode="numeric"
                    value={quantities[p.id] ?? ''}
                    onChange={(e) => setQty(p.id, e.target.value)}
                    placeholder="Qty"
                    className="h-9 w-14 rounded-lg border border-white/10 bg-white/5 px-2 text-center text-sm text-white focus:outline-none"
                  />
                  <input
                    type="number"
                    inputMode="decimal"
                    value={prices[p.id] ?? p.sale_price}
                    onChange={(e) => setPrice(p.id, e.target.value)}
                    placeholder="$"
                    className="h-9 w-20 rounded-lg border border-white/10 bg-white/5 px-2 text-right text-sm text-[#10b981] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium uppercase tracking-wider text-[#888]">Notas</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notas del día..."
            rows={2}
            className="w-full resize-none rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white placeholder:text-[#444] focus:outline-none"
          />
        </div>

        <div className="rounded-xl border border-white/10 p-3">
          <div className="flex justify-between text-sm">
            <span className="text-[#888]">Total</span>
            <span className="font-semibold text-white">{formatCurrency(totalRevenue)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#888]">Ganancia</span>
            <span className="font-semibold text-[#10b981]">{formatCurrency(totalProfit)}</span>
          </div>
        </div>

        <button
          onClick={handleConfirm}
          disabled={items.length === 0}
          className="h-12 w-full rounded-xl bg-[#10b981] text-sm font-semibold text-white transition-all active:scale-95 disabled:opacity-40"
        >
          Confirmar cierre del día
        </button>
      </div>
    </BottomSheet>
  )
}
