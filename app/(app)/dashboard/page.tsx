'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useInventoryStore } from '@/stores/inventoryStore'
import { useCashStore } from '@/stores/cashStore'
import { useSalesStore } from '@/stores/salesStore'
import MetricWidget from '@/components/ui/MetricWidget'
import GlassCard from '@/components/ui/GlassCard'
import StatusBadge from '@/components/ui/StatusBadge'
import { stockStatus, stockValue } from '@/utils/calculations'
import { formatCurrency, daysAgo, today } from '@/utils/formatters'
import { Package, AlertTriangle } from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

export default function DashboardPage() {
  const { workspaceId } = useAuthStore()
  const { products, fetch: fetchProducts } = useInventoryStore()
  const { movements, balance, fetch: fetchCash } = useCashStore()
  const { sales, fetch: fetchSales } = useSalesStore()

  useEffect(() => {
    if (!workspaceId) return
    fetchProducts(workspaceId)
    fetchCash(workspaceId, daysAgo(30), today())
    fetchSales(workspaceId, daysAgo(7), today())
  }, [workspaceId]) // eslint-disable-line react-hooks/exhaustive-deps

  const inventoryValue = products.reduce((s, p) => s + stockValue(p.cost_price, p.stock), 0)
  const todaySales = sales.filter((s) => s.sale_date === today())
  const todayProfit = todaySales.reduce((s, sale) => s + sale.total_profit, 0)
  const lowStockProducts = products.filter((p) => stockStatus(p.stock, p.min_stock) !== 'ok')

  // Build 7-day chart data
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const date = daysAgo(6 - i)
    const dayRevenue = sales
      .filter((s) => s.sale_date === date)
      .reduce((sum, s) => sum + s.total_revenue, 0)
    return {
      day: new Date(date + 'T00:00:00').toLocaleDateString('es-MX', { weekday: 'short' }),
      ingresos: dayRevenue,
    }
  })

  return (
    <div className="flex flex-col gap-4 p-4 animate-[fade-up_0.3s_ease-out]">
      {/* Balance row — full width */}
      <MetricWidget
        label="Caja actual"
        value={balance}
        currency
        color={balance >= 0 ? 'green' : 'red'}
        large
      />

      {/* Two column metrics */}
      <div className="grid grid-cols-2 gap-3">
        <MetricWidget label="Inversión inventario" value={inventoryValue} currency />
        <MetricWidget label="Ganancia hoy" value={todayProfit} currency color="green" />
      </div>

      {/* Low stock alert */}
      {lowStockProducts.length > 0 && (
        <GlassCard className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f59e0b]/15">
            <AlertTriangle size={16} className="text-[#f59e0b]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">
              {lowStockProducts.length} producto{lowStockProducts.length > 1 ? 's' : ''} con stock bajo
            </p>
            <ul className="mt-1 flex flex-col gap-0.5">
              {lowStockProducts.slice(0, 3).map((p) => (
                <li key={p.id} className="flex items-center gap-2 text-xs text-[#888]">
                  <StatusBadge status={stockStatus(p.stock, p.min_stock)} />
                  {p.name} — {p.stock} uds.
                </li>
              ))}
              {lowStockProducts.length > 3 && (
                <li className="text-xs text-[#555]">+{lowStockProducts.length - 3} más</li>
              )}
            </ul>
          </div>
        </GlassCard>
      )}

      {/* 7-day sparkline */}
      <GlassCard noPadding className="overflow-hidden">
        <div className="px-4 pt-4">
          <p className="text-[10px] font-medium uppercase tracking-wider text-[#888]">Ingresos — últimos 7 días</p>
        </div>
        <div className="h-36 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="day"
                tick={{ fill: '#555', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: '#1a1a1a',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  color: '#fff',
                  fontSize: 12,
                }}
                formatter={(v: number | undefined) => [formatCurrency(v ?? 0), 'Ingresos']}
              />
              <Area
                type="monotone"
                dataKey="ingresos"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#greenGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* Top products */}
      {products.length > 0 && (
        <GlassCard>
          <p className="mb-3 text-[10px] font-medium uppercase tracking-wider text-[#888]">
            Inventario top
          </p>
          <div className="flex flex-col gap-2">
            {products.slice(0, 5).map((p) => (
              <div key={p.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package size={14} className="shrink-0 text-[#555]" />
                  <span className="text-sm text-white">{p.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={stockStatus(p.stock, p.min_stock)} />
                  <span className="text-xs tabular-nums text-[#888]">{p.stock} uds</span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  )
}
