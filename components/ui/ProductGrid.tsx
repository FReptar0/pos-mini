'use client'

import { useState } from 'react'
import { Search, ScanLine } from 'lucide-react'
import StatusBadge from '@/components/ui/StatusBadge'
import EmptyState from '@/components/ui/EmptyState'
import { Package } from 'lucide-react'
import { stockStatus } from '@/utils/calculations'
import type { Product } from '@/lib/supabase'

type CartItem = {
  product: Product
  quantity: number
  sale_price: number
}

type ProductGridProps = {
  products: Product[]
  cart: CartItem[]
  onSelect: (p: Product) => void
  onScanRequest: () => void
}

export default function ProductGrid({ products, cart, onSelect, onScanRequest }: ProductGridProps) {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('Todos')

  const categories = ['Todos', ...Array.from(new Set(products.map((p) => p.category))).sort()]

  const filtered = products.filter((p) => {
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
    const matchesCategory = activeCategory === 'Todos' || p.category === activeCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="flex flex-col gap-3">
      {/* Search + Scan row */}
      <div className="flex items-center gap-2">
        <div className="relative flex flex-1 items-center">
          <Search size={16} className="absolute left-3 text-[#555]" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar producto..."
            className="h-11 w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 text-sm text-white placeholder:text-[#444] focus:border-[#10b981]/50 focus:outline-none"
          />
        </div>
        <button
          onClick={onScanRequest}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[#10b981] active:bg-white/10"
        >
          <ScanLine size={20} />
        </button>
      </div>

      {/* Category tabs */}
      <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-0.5">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
            style={
              activeCategory === cat
                ? {
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.16)',
                    color: '#fff',
                  }
                : {
                    background: 'transparent',
                    border: '1px solid transparent',
                    color: '#888',
                  }
            }
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Product grid */}
      {filtered.length === 0 ? (
        <EmptyState icon={Package} title="Sin productos" description="No hay productos en esta categoría" />
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {filtered.map((p) => {
            const status = stockStatus(p.stock, p.min_stock)
            const isOut = status === 'out'
            const cartItem = cart.find((i) => i.product.id === p.id)
            const qty = cartItem?.quantity ?? 0

            return (
              <button
                key={p.id}
                onClick={() => !isOut && onSelect(p)}
                disabled={isOut}
                className="glass relative rounded-[14px] p-3 text-left transition-all active:scale-[0.97] disabled:opacity-50"
              >
                {/* Cart qty badge */}
                {qty > 0 && (
                  <span className="absolute right-2 top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#10b981] px-1 text-[10px] font-bold text-white">
                    {qty > 99 ? '99+' : qty}
                  </span>
                )}

                {/* Status badge */}
                <div className="mb-1.5">
                  <StatusBadge status={status} />
                </div>

                <p className="text-sm font-semibold text-white line-clamp-2">{p.name}</p>
                <p className="mt-0.5 text-[10px] text-[#888]">{p.category}</p>
                <p className="mt-2 text-sm font-bold text-[#10b981]">${p.sale_price.toFixed(2)}</p>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
