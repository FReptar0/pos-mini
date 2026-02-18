'use client'

import Link from 'next/link'
import { Settings } from 'lucide-react'

type HeaderProps = {
  title?: string
}

export default function Header({ title = 'Mi Negocio' }: HeaderProps) {
  return (
    <header
      className="sticky top-0 z-40 flex h-12 items-center justify-between px-4"
      style={{
        background: 'rgba(10, 10, 10, 0.9)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <span className="text-sm font-semibold text-white">{title}</span>
      <Link
        href="/settings"
        className="flex h-8 w-8 items-center justify-center rounded-full transition-colors active:bg-white/10"
        aria-label="Configuración"
      >
        <Settings size={18} className="text-[#888]" />
      </Link>
    </header>
  )
}
