'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, initialized, initialize } = useAuthStore()
  const router = useRouter()

  // Stable refs so the Realtime effect never needs to re-run
  const userIdRef = useRef<string | null>(null)
  const kickedRef = useRef(false)

  useEffect(() => {
    initialize()
  }, [initialize])

  // Keep userIdRef in sync
  useEffect(() => {
    userIdRef.current = user?.id ?? null
  }, [user])

  useEffect(() => {
    if (initialized && !user) {
      router.replace('/login')
    }
  }, [initialized, user, router])

  // Realtime: watch own membership row; sign out immediately if deactivated.
  // Dependencies are intentionally empty — we use refs to access current values.
  useEffect(() => {
    const channel = supabase
      .channel('membership-watch')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'workspace_members',
        },
        (payload) => {
          const updated = payload.new as { user_id: string; is_active: boolean }

          // Only react to changes for the current user's own row
          if (updated.user_id !== userIdRef.current) return

          if (updated.is_active === false && !kickedRef.current) {
            kickedRef.current = true
            // Kick the user out
            useAuthStore.getState().signOut().then(() => {
              router.replace('/login')
            })
          } else if (updated.is_active === true) {
            // Role may have changed — reload workspace profile
            const uid = userIdRef.current
            if (uid) useAuthStore.getState().loadWorkspace(uid)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [router]) // router is stable from Next.js — this runs once

  if (!initialized) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-[#10b981]" />
      </div>
    )
  }

  if (!user) return null

  return <>{children}</>
}
