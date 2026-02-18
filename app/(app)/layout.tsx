import AuthGuard from '@/components/layout/AuthGuard'
import Header from '@/components/layout/Header'
import MobileNav from '@/components/layout/MobileNav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex h-[100dvh] flex-col bg-[#0a0a0a]">
        <Header />
        <main className="no-scrollbar flex-1 overflow-y-auto pb-20">
          {children}
        </main>
        <MobileNav />
      </div>
    </AuthGuard>
  )
}
