'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useSalesStore } from '@/stores/salesStore'
import { usePermissions } from '@/hooks/usePermissions'
import GlassCard from '@/components/ui/GlassCard'
import EmptyState from '@/components/ui/EmptyState'
import { formatCurrency, formatDate, daysAgo, today } from '@/utils/formatters'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts'
import { Download, ChevronDown, ChevronUp, BarChart3 } from 'lucide-react'
import type { Sale } from '@/lib/supabase'

type Period = '7' | '30' | 'custom'

export default function ReportsPage() {
  const { workspaceId } = useAuthStore()
  const { sales, loading, fetch } = useSalesStore()
  const { can } = usePermissions()
  const [period, setPeriod] = useState<Period>('7')
  const [from, setFrom] = useState(daysAgo(7))
  const [to, setTo] = useState(today())
  const [expandedSale, setExpandedSale] = useState<string | null>(null)

  useEffect(() => {
    if (!workspaceId || !can('reports', 'view')) return
    if (period === '7') {
      fetch(workspaceId, daysAgo(7), today())
    } else if (period === '30') {
      fetch(workspaceId, daysAgo(30), today())
    } else {
      fetch(workspaceId, from, to)
    }
  }, [workspaceId, period, from, to]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!can('reports', 'view')) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <EmptyState
          icon={BarChart3}
          title="Sin acceso"
          description="No tienes permisos para ver reportes"
        />
      </div>
    )
  }

  const totalRevenue = sales.reduce((s, sale) => s + sale.total_revenue, 0)
  const totalCost = sales.reduce((s, sale) => s + sale.total_cost, 0)
  const totalProfit = sales.reduce((s, sale) => s + sale.total_profit, 0)
  const margin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

  const chartDays = period === '7' ? 7 : period === '30' ? 30 : 14
  const chartData = Array.from({ length: Math.min(chartDays, 14) }, (_, i) => {
    const date = daysAgo(Math.min(chartDays, 14) - 1 - i)
    const dayRevenue = sales
      .filter((s) => s.sale_date === date)
      .reduce((sum, s) => sum + s.total_revenue, 0)
    return {
      day: new Date(date + 'T00:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }),
      ingresos: dayRevenue,
    }
  })

  function exportCSV() {
    const rows = [
      ['Fecha', 'Tipo', 'Productos', 'Ingresos', 'Costos', 'Utilidad'],
      ...sales.map((s) => [
        s.sale_date,
        s.type === 'individual' ? 'Venta rápida' : 'Cierre del día',
        s.items.map((i) => `${i.product_name} x${i.quantity}`).join(' | '),
        s.total_revenue.toFixed(2),
        s.total_cost.toFixed(2),
        s.total_profit.toFixed(2),
      ]),
    ]
    const csv = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reporte_${today()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-4 p-4 animate-[fade-up_0.3s_ease-out]">
      {/* Period chips */}
      <div className="flex gap-2">
        {(['7', '30', 'custom'] as Period[]).map((p) => (
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
            {p === '7' ? '7 días' : p === '30' ? '30 días' : 'Personalizado'}
          </button>
        ))}
      </div>

      {period === 'custom' && (
        <div className="flex gap-2">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="h-10 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white focus:outline-none"
            style={{ colorScheme: 'dark' }}
          />
          <span className="flex items-center text-[#555]">→</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="h-10 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white focus:outline-none"
            style={{ colorScheme: 'dark' }}
          />
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <GlassCard>
          <p className="text-[10px] font-medium uppercase tracking-wider text-[#888]">Ingresos</p>
          <p className="mt-1 text-xl font-light tabular-nums text-[#10b981]">{formatCurrency(totalRevenue)}</p>
        </GlassCard>
        <GlassCard>
          <p className="text-[10px] font-medium uppercase tracking-wider text-[#888]">Costos</p>
          <p className="mt-1 text-xl font-light tabular-nums text-[#ef4444]">{formatCurrency(totalCost)}</p>
        </GlassCard>
        <GlassCard>
          <p className="text-[10px] font-medium uppercase tracking-wider text-[#888]">Utilidad neta</p>
          <p className="mt-1 text-xl font-light tabular-nums text-white">{formatCurrency(totalProfit)}</p>
        </GlassCard>
        <GlassCard>
          <p className="text-[10px] font-medium uppercase tracking-wider text-[#888]">Margen</p>
          <p className="mt-1 text-xl font-light tabular-nums text-white">{margin.toFixed(1)}%</p>
        </GlassCard>
      </div>

      {/* Chart */}
      {chartData.some((d) => d.ingresos > 0) && (
        <GlassCard noPadding className="overflow-hidden">
          <div className="px-4 pt-4">
            <p className="text-[10px] font-medium uppercase tracking-wider text-[#888]">Ingresos por día</p>
          </div>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                <XAxis dataKey="day" tick={{ fill: '#555', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#555', fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 12 }}
                  formatter={(v: number | undefined) => [formatCurrency(v ?? 0), 'Ingresos']}
                />
                <Bar dataKey="ingresos" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={_.ingresos > 0 ? '#10b981' : '#222'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      )}

      {/* Export */}
      {sales.length > 0 && (
        <button
          onClick={exportCSV}
          className="flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 text-sm font-medium text-[#888] transition-colors active:bg-white/5"
        >
          <Download size={16} />
          Exportar CSV
        </button>
      )}

      {/* Sales list */}
      {loading ? (
        <div className="flex justify-center py-6">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-[#10b981]" />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {sales.map((sale) => (
            <SaleRow
              key={sale.id}
              sale={sale}
              expanded={expandedSale === sale.id}
              onToggle={() => setExpandedSale(expandedSale === sale.id ? null : sale.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function SaleRow({ sale, expanded, onToggle }: { sale: Sale; expanded: boolean; onToggle: () => void }) {
  return (
    <GlassCard noPadding className="overflow-hidden">
      <button onClick={onToggle} className="flex w-full items-center justify-between p-4">
        <div className="text-left">
          <div className="flex items-center gap-2">
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={{
                background: sale.type === 'individual' ? 'rgba(59,130,246,0.15)' : 'rgba(245,158,11,0.15)',
                color: sale.type === 'individual' ? '#3b82f6' : '#f59e0b',
              }}
            >
              {sale.type === 'individual' ? 'Venta rápida' : 'Cierre del día'}
            </span>
            <span className="text-xs text-[#555]">{formatDate(sale.sale_date)}</span>
          </div>
          <p className="mt-1 text-sm font-semibold text-white">{formatCurrency(sale.total_revenue)}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-[#10b981]">+{formatCurrency(sale.total_profit)}</span>
          {expanded ? <ChevronUp size={16} className="text-[#555]" /> : <ChevronDown size={16} className="text-[#555]" />}
        </div>
      </button>
      {expanded && (
        <div className="border-t border-white/[0.06] px-4 pb-3">
          {sale.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between py-1.5">
              <span className="text-sm text-[#888]">{item.product_name} × {item.quantity}</span>
              <span className="text-sm font-medium text-white">{formatCurrency(item.sale_price * item.quantity)}</span>
            </div>
          ))}
          {sale.notes && <p className="mt-1 text-xs italic text-[#555]">{sale.notes}</p>}
        </div>
      )}
    </GlassCard>
  )
}
