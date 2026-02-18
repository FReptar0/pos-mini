import AnimatedNumber from './AnimatedNumber'

type MetricWidgetProps = {
  label: string
  value: number
  currency?: boolean
  trend?: number       // percentage change, optional
  color?: 'green' | 'red' | 'blue' | 'yellow' | 'default'
  large?: boolean
}

const colorMap = {
  green: '#10b981',
  red: '#ef4444',
  blue: '#3b82f6',
  yellow: '#f59e0b',
  default: '#ffffff',
}

export default function MetricWidget({
  label,
  value,
  currency = false,
  trend,
  color = 'default',
  large,
}: MetricWidgetProps) {
  const valueColor = colorMap[color]
  const trendPositive = trend !== undefined && trend >= 0

  return (
    <div className="glass rounded-[14px] p-4 transition-all duration-200">
      <p className="text-[10px] font-medium uppercase tracking-wider text-[#888]">{label}</p>
      <AnimatedNumber
        value={value}
        currency={currency}
        className={`${large ? 'text-4xl' : 'text-2xl'} mt-1 font-light tabular-nums`}
        color={valueColor}
      />
      {trend !== undefined && (
        <div className="mt-2 flex items-center gap-1">
          <span
            className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
            style={{
              background: trendPositive ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
              color: trendPositive ? '#10b981' : '#ef4444',
            }}
          >
            {trendPositive ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
          </span>
          <span className="text-[10px] text-[#555]">vs ayer</span>
        </div>
      )}
    </div>
  )
}
