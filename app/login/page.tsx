'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { ShoppingBag, Eye, EyeOff } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const { signIn, loading, user, initialize, initialized } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    if (initialized && user) router.replace('/dashboard')
  }, [initialized, user, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Completa todos los campos')
      return
    }

    const { error } = await signIn(email, password)

    if (error) {
      const msgs: Record<string, string> = {
        'Invalid login credentials': 'Email o contraseña incorrectos',
        'Email not confirmed': 'Verifica tu correo primero',
      }
      toast.error(msgs[error] ?? error)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] px-5">
      <Toaster
        position="top-center"
        toastOptions={{
          style: { background: '#111', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' },
        }}
      />

      {/* Logo */}
      <div className="mb-10 flex flex-col items-center gap-3 animate-[fade-up_0.4s_ease-out]">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#10b981]/15">
          <ShoppingBag size={32} className="text-[#10b981]" />
        </div>
        <h1 className="text-2xl font-bold text-white">Mi Inventario</h1>
        <p className="text-sm text-[#888]">Gestiona tu negocio desde el celular</p>
      </div>

      {/* Card */}
      <div
        className="w-full max-w-sm rounded-[14px] p-6 animate-[fade-up_0.4s_ease-out_0.1s_both]"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <h2 className="mb-6 text-lg font-semibold text-white">
          Iniciar sesión
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#888] uppercase tracking-wider">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              inputMode="email"
              placeholder="tu@email.com"
              className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white placeholder:text-[#444] focus:border-[#10b981]/50 focus:outline-none focus:ring-0 transition-colors"
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#888] uppercase tracking-wider">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
                className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 pr-12 text-white placeholder:text-[#444] focus:border-[#10b981]/50 focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#555] transition-colors active:text-white"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 h-12 w-full rounded-xl bg-[#10b981] text-sm font-semibold text-white transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Cargando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
