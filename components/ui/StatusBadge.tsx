type Status = 'ok' | 'low' | 'out'

const config: Record<Status, { label: string; bg: string; text: string }> = {
  ok: { label: 'OK', bg: 'rgba(16,185,129,0.15)', text: '#10b981' },
  low: { label: 'Bajo', bg: 'rgba(245,158,11,0.15)', text: '#f59e0b' },
  out: { label: 'Agotado', bg: 'rgba(239,68,68,0.15)', text: '#ef4444' },
}

export default function StatusBadge({ status }: { status: Status }) {
  const { label, bg, text } = config[status]
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
      style={{ background: bg, color: text }}
    >
      {label}
    </span>
  )
}
