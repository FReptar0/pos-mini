'use client'

import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import type { Product } from '@/lib/supabase'

type ProductSearchProps = {
  products: Product[]
  onSelect: (product: Product) => void
  placeholder?: string
}

export default function ProductSearch({ products, onSelect, placeholder = 'Buscar producto...' }: ProductSearchProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const results = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        p.category.toLowerCase().includes(q)
    ).slice(0, 8)
  }, [query, products])

  function handleSelect(product: Product) {
    onSelect(product)
    setQuery('')
    setOpen(false)
  }

  return (
    <div className="relative">
      <div className="relative flex items-center">
        <Search size={16} className="absolute left-3 text-[#555]" />
        <input
          type="search"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder}
          className="h-12 w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 text-sm text-white placeholder:text-[#444] focus:border-[#10b981]/50 focus:outline-none transition-colors"
        />
      </div>

      {open && results.length > 0 && (
        <div
          className="absolute left-0 right-0 top-full z-50 mt-1 rounded-[14px] py-1"
          style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          {results.map((product) => (
            <button
              key={product.id}
              onMouseDown={() => handleSelect(product)}
              className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors active:bg-white/5"
            >
              <div>
                <p className="text-sm font-medium text-white">{product.name}</p>
                <p className="text-xs text-[#888]">{product.category}{product.sku ? ` · ${product.sku}` : ''}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-[#10b981]">${product.sale_price.toFixed(2)}</p>
                <p className="text-xs text-[#555]">Stock: {product.stock}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
