'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Package, ShoppingCart, Wallet, BarChart3 } from 'lucide-react'

const tabs = [
  { href: '/dashboard', icon: Home, label: 'Inicio' },
  { href: '/inventory', icon: Package, label: 'Stock' },
  { href: '/sales', icon: ShoppingCart, label: 'Vender' },
  { href: '/cash', icon: Wallet, label: 'Caja' },
  { href: '/reports', icon: BarChart3, label: 'Reportes' },
]

export default function MobileNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 safe-bottom"
      style={{
        background: 'rgba(10, 10, 10, 0.92)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div className="flex h-16 items-center justify-around px-2">
        {tabs.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className="flex min-h-[48px] min-w-[48px] flex-1 flex-col items-center justify-center gap-0.5 rounded-xl transition-all duration-150 active:scale-95"
            >
              <Icon
                size={22}
                className="transition-colors duration-150"
                style={{ color: active ? '#10b981' : '#555555' }}
              />
              <span
                className="text-[10px] font-medium transition-colors duration-150"
                style={{ color: active ? '#10b981' : '#555555' }}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
