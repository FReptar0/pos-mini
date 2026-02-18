'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useInventoryStore } from '@/stores/inventoryStore'
import { useCashStore } from '@/stores/cashStore'
import { usePermissions } from '@/hooks/usePermissions'
import GlassCard from '@/components/ui/GlassCard'
import StatusBadge from '@/components/ui/StatusBadge'
import BottomSheet from '@/components/ui/BottomSheet'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import FAB from '@/components/ui/FAB'
import EmptyState from '@/components/ui/EmptyState'
import CurrencyInput from '@/components/ui/CurrencyInput'
import { stockStatus, margin } from '@/utils/calculations'
import { today } from '@/utils/formatters'
import type { Product } from '@/lib/supabase'
import BarcodeScanner from '@/components/ui/BarcodeScanner'
import { barcodeLookup } from '@/utils/barcodeLookup'
import { Package, Search, Plus, Trash2, ScanLine } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

type ProductForm = {
  name: string
  sku: string
  category: string
  cost_price: string
  sale_price: string
  stock: string
  min_stock: string
}

const emptyForm: ProductForm = {
  name: '', sku: '', category: 'General',
  cost_price: '', sale_price: '', stock: '0', min_stock: '5',
}

export default function InventoryPage() {
  const { workspaceId } = useAuthStore()
  const { products, loading, fetch, add, update, remove, adjustStock } = useInventoryStore()
  const { addMovement } = useCashStore()
  const { can } = usePermissions()

  const [search, setSearch] = useState('')
  const [scanOpen, setScanOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [form, setForm] = useState<ProductForm>(emptyForm)
  const [stockDelta, setStockDelta] = useState('')
  const [restockCost, setRestockCost] = useState('')

  useEffect(() => {
    if (workspaceId) fetch(workspaceId)
  }, [workspaceId]) // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(search.toLowerCase())) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  )

  function openAdd() {
    setForm(emptyForm)
    setAddOpen(true)
  }

  function openDetail(product: Product) {
    setEditProduct(product)
    setForm({
      name: product.name,
      sku: product.sku ?? '',
      category: product.category,
      cost_price: String(product.cost_price),
      sale_price: String(product.sale_price),
      stock: String(product.stock),
      min_stock: String(product.min_stock),
    })
    setStockDelta('')
    setRestockCost(String(product.cost_price))
    setDetailOpen(true)
  }

  async function handleAdd() {
    if (!workspaceId || !form.name || !form.sale_price) {
      toast.error('Nombre y precio de venta requeridos')
      return
    }
    const { error } = await add({
      name: form.name,
      sku: form.sku || null,
      category: form.category || 'General',
      cost_price: parseFloat(form.cost_price) || 0,
      sale_price: parseFloat(form.sale_price),
      stock: parseInt(form.stock) || 0,
      min_stock: parseInt(form.min_stock) || 5,
    }, workspaceId)
    if (error) { toast.error(error); return }
    toast.success('Producto agregado')
    setAddOpen(false)
  }

  async function handleUpdate() {
    if (!editProduct || !workspaceId) return
    const { error } = await update(editProduct.id, {
      name: form.name,
      sku: form.sku || null,
      category: form.category,
      cost_price: parseFloat(form.cost_price) || 0,
      sale_price: parseFloat(form.sale_price),
      min_stock: parseInt(form.min_stock) || 5,
    })
    if (error) { toast.error(error); return }
    toast.success('Producto actualizado')
    setDetailOpen(false)
  }

  async function handleAddStock() {
    if (!editProduct || !workspaceId || !stockDelta) return
    const qty = parseInt(stockDelta)
    if (!qty || qty <= 0) { toast.error('Cantidad inválida'); return }
    const cost = parseFloat(restockCost) || editProduct.cost_price
    const { error } = await adjustStock(editProduct.id, qty)
    if (error) { toast.error(error); return }
    await addMovement({
      type: 'restock',
      amount: cost * qty,
      description: `Restock: ${editProduct.name} (${qty} uds)`,
      category: 'Inventario',
      movement_date: today(),
      related_sale_id: null,
    }, workspaceId)
    toast.success(`+${qty} unidades agregadas`)
    setStockDelta('')
    setDetailOpen(false)
  }

  async function handleDelete() {
    if (!editProduct) return
    const { error } = await remove(editProduct.id)
    if (error) { toast.error(error); return }
    toast.success('Producto eliminado')
    setConfirmDelete(false)
    setDetailOpen(false)
  }

  async function handleInventoryScan(code: string) {
    setScanOpen(false)
    setForm((prev) => ({ ...prev, sku: code }))

    const toastId = toast.loading('Buscando información del producto...')
    const info = await barcodeLookup(code)
    toast.dismiss(toastId)

    if (info.name) {
      setForm((prev) => ({
        ...prev,
        name: info.name!,
        category: info.category ?? prev.category,
      }))
      toast.success('Producto encontrado — verifica los datos')
    } else {
      toast('SKU asignado — producto no encontrado en línea', { icon: '📦' })
    }
  }

  return (
    <div className="flex flex-col gap-3 p-4 animate-[fade-up_0.3s_ease-out]">
      <Toaster position="top-center" toastOptions={{ style: { background: '#111', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' } }} />

      {/* Search */}
      <div className="relative flex items-center">
        <Search size={16} className="absolute left-3 text-[#555]" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar productos..."
          className="h-11 w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 text-sm text-white placeholder:text-[#444] focus:border-[#10b981]/50 focus:outline-none"
        />
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-[#10b981]" />
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <EmptyState
          icon={Package}
          title="Sin productos"
          description={can('products', 'create') ? 'Agrega tu primer producto con el botón +' : 'No hay productos disponibles'}
        />
      )}

      {/* Product grid */}
      <div className="grid grid-cols-2 gap-3">
        {filtered.map((p) => {
          const status = stockStatus(p.stock, p.min_stock)
          const mg = margin(p.cost_price, p.sale_price)
          return (
            <button
              key={p.id}
              onClick={() => openDetail(p)}
              className="glass rounded-[14px] p-3 text-left transition-all active:scale-[0.97]"
            >
              <div className="mb-2 flex items-start justify-between">
                <StatusBadge status={status} />
              </div>
              <p className="text-sm font-semibold text-white line-clamp-2">{p.name}</p>
              {p.sku && <p className="mt-0.5 text-[10px] text-[#555]">{p.sku}</p>}
              <p className="text-[10px] text-[#888]">{p.category}</p>
              <div className="mt-3 space-y-0.5">
                <p className="text-xs text-[#888]">Stock: <span className="font-medium text-white">{p.stock}</span></p>
                <p className="text-xs text-[#888]">Costo: <span className="font-medium text-white">${p.cost_price.toFixed(2)}</span></p>
                <p className="text-xs text-[#888]">Venta: <span className="font-medium text-[#10b981]">${p.sale_price.toFixed(2)}</span></p>
                <p className="text-xs text-[#888]">Margen: <span className="font-medium text-white">{mg.toFixed(0)}%</span></p>
              </div>
            </button>
          )
        })}
      </div>

      {can('products', 'create') && <FAB onClick={openAdd} label="Agregar producto" />}

      {/* Add product sheet */}
      <BottomSheet open={addOpen} onClose={() => setAddOpen(false)} title="Nuevo producto">
        <ProductFormFields form={form} setForm={setForm} onScanSku={() => setScanOpen(true)} />
        <button
          onClick={handleAdd}
          className="mt-4 h-12 w-full rounded-xl bg-[#10b981] text-sm font-semibold text-white transition-all active:scale-95"
        >
          Agregar producto
        </button>
      </BottomSheet>

      {/* Detail/edit sheet */}
      <BottomSheet open={detailOpen} onClose={() => setDetailOpen(false)} title={editProduct?.name}>
        {editProduct && (
          <div className="flex flex-col gap-4">
            {/* Stock adjustment — cashiers and above can add stock */}
            {can('products', 'edit') && (
              <div className="rounded-xl border border-white/10 p-3">
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[#888]">Agregar stock</p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    inputMode="numeric"
                    value={stockDelta}
                    onChange={(e) => setStockDelta(e.target.value)}
                    placeholder="Cantidad"
                    className="h-10 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-[#444] focus:outline-none"
                  />
                  <input
                    type="number"
                    inputMode="decimal"
                    value={restockCost}
                    onChange={(e) => setRestockCost(e.target.value)}
                    placeholder="Costo/u"
                    className="h-10 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-[#444] focus:outline-none"
                  />
                  <button
                    onClick={handleAddStock}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#10b981]/20 text-[#10b981] active:bg-[#10b981]/30"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* Edit fields — only admin/manager */}
            {can('products', 'edit') && (
              <>
                <ProductFormFields form={form} setForm={setForm} />
                <div className="flex gap-2">
                  {can('products', 'delete') && (
                    <button
                      onClick={() => setConfirmDelete(true)}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 text-[#ef4444] active:bg-[#ef4444]/10"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                  <button
                    onClick={handleUpdate}
                    className="h-11 flex-1 rounded-xl bg-[#10b981] text-sm font-semibold text-white transition-all active:scale-95"
                  >
                    Guardar cambios
                  </button>
                </div>
              </>
            )}

            {/* Read-only info for viewer/cashier */}
            {!can('products', 'edit') && (
              <div className="flex flex-col gap-2 rounded-xl border border-white/10 p-4">
                <p className="text-xs text-[#555]">Solo visualización</p>
                <p className="text-sm text-white">{editProduct.name}</p>
                <p className="text-sm text-[#888]">Stock actual: {editProduct.stock} uds</p>
                <p className="text-sm text-[#10b981]">Precio: ${editProduct.sale_price.toFixed(2)}</p>
              </div>
            )}
          </div>
        )}
      </BottomSheet>

      <ConfirmDialog
        open={confirmDelete}
        title="Eliminar producto"
        message={`¿Eliminar "${editProduct?.name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />

      <BarcodeScanner
        open={scanOpen}
        onScan={handleInventoryScan}
        onClose={() => setScanOpen(false)}
      />
    </div>
  )
}

function ProductFormFields({
  form,
  setForm,
  onScanSku,
}: {
  form: ProductForm
  setForm: (f: ProductForm) => void
  onScanSku?: () => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium uppercase tracking-wider text-[#888]">Nombre *</label>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Nombre del producto"
          className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-[#444] focus:border-[#10b981]/50 focus:outline-none"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium uppercase tracking-wider text-[#888]">SKU</label>
          <div className="flex gap-2">
            <input
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
              placeholder="Opcional"
              className="h-12 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-[#444] focus:outline-none"
            />
            {onScanSku && (
              <button
                type="button"
                onClick={onScanSku}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[#10b981] active:bg-white/10"
              >
                <ScanLine size={18} />
              </button>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium uppercase tracking-wider text-[#888]">Categoría</label>
          <input
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            placeholder="General"
            className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-[#444] focus:outline-none"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <CurrencyInput label="Precio de costo" value={form.cost_price} onChange={(v) => setForm({ ...form, cost_price: v })} />
        <CurrencyInput label="Precio de venta" value={form.sale_price} onChange={(v) => setForm({ ...form, sale_price: v })} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium uppercase tracking-wider text-[#888]">Stock inicial</label>
          <input
            type="number"
            inputMode="numeric"
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: e.target.value })}
            className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium uppercase tracking-wider text-[#888]">Stock mínimo</label>
          <input
            type="number"
            inputMode="numeric"
            value={form.min_stock}
            onChange={(e) => setForm({ ...form, min_stock: e.target.value })}
            className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white focus:outline-none"
          />
        </div>
      </div>
    </div>
  )
}
