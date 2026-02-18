'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useCashStore } from '@/stores/cashStore'
import { usePermissions } from '@/hooks/usePermissions'
import GlassCard from '@/components/ui/GlassCard'
import BottomSheet from '@/components/ui/BottomSheet'
import FAB from '@/components/ui/FAB'
import EmptyState from '@/components/ui/EmptyState'
import CurrencyInput from '@/components/ui/CurrencyInput'
import { formatCurrency, formatShortDate, today, daysAgo } from '@/utils/formatters'
import type { CashMovement } from '@/lib/supabase'
import { Wallet, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

const CATEGORIES = ['General', 'Ventas', 'Inventario', 'Servicios', 'Gastos fijos', 'Otros']

type Period = 'today' | 'week' | 'month'

const periodConfig: Record<Period, { label: string; from: () => string }> = {
  today: { label: 'Hoy', from: () => today() },
  week: { label: 'Semana', from: () => daysAgo(7) },
  month: { label: 'Mes', from: () => daysAgo(30) },
}

export default function CashPage() {
  const { workspaceId } = useAuthStore()
  const { movements, balance, loading, fetch, addMovement } = useCashStore()
  const { can } = usePermissions()

  const [period, setPeriod] = useState<Period>('week')
  const [addOpen, setAddOpen] = useState(false)
  const [type, setType] = useState<'income' | 'expense'>('income')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('General')
  const [date, setDate] = useState(today())

  useEffect(() => {
    if (!workspaceId) return
    const from = periodConfig[period].from()
    fetch(workspaceId, from, today())
  }, [workspaceId, period]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAdd() {
    if (!workspaceId || !amount || !description) {
      toast.error('Completa monto y descripción')
      return
    }
    const { error } = await addMovement({
      type,
      amount: parseFloat(amount),
      description,
      category,
      movement_date: date,
      related_sale_id: null,
    }, workspaceId)
    if (error) { toast.error(error); return }
    toast.success(`${type === 'income' ? 'Ingreso' : 'Egreso'} registrado`)
    setAddOpen(false)
    setAmount('')
    setDescription('')
    setCategory('General')
    setDate(today())
  }

  return (
    <div className="flex flex-col gap-4 p-4 animate-[fade-up_0.3s_ease-out]">
      <Toaster position="top-center" toastOptions={{ style: { background: '#111', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' } }} />

      {/* Balance */}
      <GlassCard>
        <p className="text-[10px] font-medium uppercase tracking-wider text-[#888]">Balance actual</p>
        <p
          className="mt-1 text-4xl font-light tabular-nums"
          style={{ color: balance >= 0 ? '#10b981' : '#ef4444' }}
        >
          {formatCurrency(balance)}
        </p>
      </GlassCard>

      {/* Period filter */}
      <div className="flex gap-2">
        {(Object.keys(periodConfig) as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className="h-8 flex-1 rounded-full text-xs font-medium transition-all"
            style={{
              background: period === p ? '#10b981' : 'rgba(255,255,255,0.05)',
              color: period === p ? '#fff' : '#888',
              border: period === p ? 'none' : '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {periodConfig[p].label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      {loading && (
        <div className="flex justify-center py-6">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-[#10b981]" />
        </div>
      )}

      {!loading && movements.length === 0 && (
        <EmptyState
          icon={Wallet}
          title="Sin movimientos"
          description={can('cash', 'create') ? 'Agrega tu primer movimiento con el botón +' : 'No hay movimientos en este período'}
        />
      )}

      <div className="flex flex-col gap-2">
        {movements.map((m) => (
          <MovementRow key={m.id} movement={m} />
        ))}
      </div>

      {can('cash', 'create') && <FAB onClick={() => setAddOpen(true)} label="Agregar movimiento" />}

      {/* Add movement sheet */}
      <BottomSheet open={addOpen} onClose={() => setAddOpen(false)} title="Nuevo movimiento">
        <div className="flex flex-col gap-4">
          {/* Income / Expense toggle */}
          <div className="flex rounded-xl border border-white/10 p-1">
            {(['income', 'expense'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className="h-10 flex-1 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: type === t ? (t === 'income' ? '#10b981' : '#ef4444') : 'transparent',
                  color: type === t ? '#fff' : '#888',
                }}
              >
                {t === 'income' ? 'Ingreso' : 'Egreso'}
              </button>
            ))}
          </div>

          <CurrencyInput label="Monto" value={amount} onChange={setAmount} placeholder="0.00" />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-wider text-[#888]">Descripción</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="¿De qué es este movimiento?"
              className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-[#444] focus:border-[#10b981]/50 focus:outline-none"
            />
          </div>

          {/* Category chips */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium uppercase tracking-wider text-[#888]">Categoría</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className="h-8 rounded-full px-3 text-xs font-medium transition-all"
                  style={{
                    background: category === cat ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)',
                    color: category === cat ? '#10b981' : '#888',
                    border: category === cat ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

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

          <button
            onClick={handleAdd}
            className="h-12 w-full rounded-xl text-sm font-semibold text-white transition-all active:scale-95"
            style={{ background: type === 'income' ? '#10b981' : '#ef4444' }}
          >
            Registrar {type === 'income' ? 'ingreso' : 'egreso'}
          </button>
        </div>
      </BottomSheet>
    </div>
  )
}

function MovementRow({ movement: m }: { movement: CashMovement }) {
  const isOut = m.type === 'expense' || m.type === 'restock'
  const Icon = isOut ? ArrowDownLeft : ArrowUpRight
  return (
    <GlassCard className="flex items-center gap-3">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
        style={{ background: isOut ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)' }}
      >
        <Icon size={16} style={{ color: isOut ? '#ef4444' : '#10b981' }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">{m.description}</p>
        <p className="text-xs text-[#555]">{m.category} · {formatShortDate(m.movement_date)}</p>
      </div>
      <span
        className="shrink-0 text-sm font-semibold tabular-nums"
        style={{ color: isOut ? '#ef4444' : '#10b981' }}
      >
        {isOut ? '-' : '+'}{formatCurrency(m.amount)}
      </span>
    </GlassCard>
  )
}
