'use client'

import { Plus } from 'lucide-react'

type FABProps = {
  onClick: () => void
  label?: string
}

export default function FAB({ onClick, label = 'Agregar' }: FABProps) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="fixed bottom-24 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform active:scale-90"
      style={{
        background: '#10b981',
        boxShadow: '0 0 24px rgba(16,185,129,0.4)',
      }}
    >
      <Plus size={24} className="text-white" />
    </button>
  )
}
