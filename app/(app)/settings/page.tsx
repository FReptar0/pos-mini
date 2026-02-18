'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useUserStore } from '@/stores/userStore'
import { usePermissions } from '@/hooks/usePermissions'
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/permissions'
import GlassCard from '@/components/ui/GlassCard'
import BottomSheet from '@/components/ui/BottomSheet'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import type { WorkspaceMember } from '@/lib/supabase'
import { LogOut, UserPlus, Users, User, ChevronRight } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

type Tab = 'users' | 'account'

export default function SettingsPage() {
  const { user, workspaceId, role, memberProfile, signOut } = useAuthStore()
  const { can } = usePermissions()

  // Initialize on 'users' tab immediately if role is already loaded as admin.
  // This avoids a flash of AccountTab (which contains the sign-out button) that
  // could cause accidental sign-outs via tap-through on mobile.
  const [tab, setTab] = useState<Tab>(() => can('users', 'view') ? 'users' : 'account')

  // Handle the case where the role loads *after* the component mounts
  useEffect(() => {
    if (can('users', 'view') && tab === 'account') setTab('users')
  }, [role]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col gap-4 p-4 animate-[fade-up_0.3s_ease-out]">
      <Toaster position="top-center" toastOptions={{ style: { background: '#111', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' } }} />

      {/* Tabs */}
      <div className="flex rounded-xl border border-white/10 p-1">
        {can('users', 'view') && (
          <button
            onClick={() => setTab('users')}
            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: tab === 'users' ? 'rgba(255,255,255,0.1)' : 'transparent',
              color: tab === 'users' ? '#fff' : '#888',
            }}
          >
            <Users size={15} />
            Usuarios
          </button>
        )}
        <button
          onClick={() => setTab('account')}
          className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all"
          style={{
            background: tab === 'account' ? 'rgba(255,255,255,0.1)' : 'transparent',
            color: tab === 'account' ? '#fff' : '#888',
          }}
        >
          <User size={15} />
          Cuenta
        </button>
      </div>

      {tab === 'users' && can('users', 'view') && workspaceId && (
        <UsersTab workspaceId={workspaceId} currentUserId={user?.id ?? ''} />
      )}

      {tab === 'account' && (
        <AccountTab
          email={user?.email ?? ''}
          role={role}
          memberProfile={memberProfile}
          onSignOut={signOut}
        />
      )}
    </div>
  )
}

/* ─── Users Tab ─── */
function UsersTab({ workspaceId, currentUserId }: { workspaceId: string; currentUserId: string }) {
  const { members, loading, fetchMembers, createUser, deactivateUser, reactivateUser, changeRole } = useUserStore()
  const [addOpen, setAddOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<WorkspaceMember | null>(null)
  const [memberOpen, setMemberOpen] = useState(false)

  // Create form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [newRole, setNewRole] = useState<WorkspaceMember['role']>('cashier')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchMembers(workspaceId)
  }, [workspaceId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCreate() {
    if (!email || !password) { toast.error('Email y contraseña requeridos'); return }
    setSubmitting(true)
    const { error } = await createUser({ workspaceId, email, password, fullName, role: newRole })
    setSubmitting(false)
    if (error) { toast.error(error); return }
    toast.success('Usuario creado')
    setAddOpen(false)
    setEmail(''); setPassword(''); setFullName(''); setNewRole('cashier')
  }

  async function handleDeactivate() {
    if (!selectedMember) return
    const { error } = await deactivateUser(selectedMember.id)
    if (error) { toast.error(error); return }
    toast.success('Usuario desactivado')
    setMemberOpen(false)
  }

  async function handleReactivate() {
    if (!selectedMember) return
    const { error } = await reactivateUser(selectedMember.id)
    if (error) { toast.error(error); return }
    toast.success('Usuario reactivado')
    setMemberOpen(false)
  }

  async function handleChangeRole(role: WorkspaceMember['role']) {
    if (!selectedMember) return
    const { error } = await changeRole(selectedMember.id, role)
    if (error) { toast.error(error); return }
    toast.success('Rol actualizado')
    setSelectedMember((prev) => prev ? { ...prev, role } : prev)
  }

  return (
    <>
      <button
        onClick={() => setAddOpen(true)}
        className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#10b981]/20 text-sm font-semibold text-[#10b981] transition-all active:scale-95 border border-[#10b981]/30"
      >
        <UserPlus size={16} />
        Agregar usuario
      </button>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-[#10b981]" />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {members.map((member) => (
            <button
              key={member.id}
              onClick={() => {
                if (member.user_id === currentUserId) return
                setSelectedMember(member)
                setMemberOpen(true)
              }}
              className="glass rounded-[14px] p-4 text-left transition-all active:scale-[0.98]"
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-white truncate">
                      {member.full_name || member.email}
                    </p>
                    {!member.is_active && (
                      <span className="shrink-0 rounded-full bg-[#ef4444]/15 px-2 py-0.5 text-[10px] font-semibold text-[#ef4444]">
                        Inactivo
                      </span>
                    )}
                  </div>
                  {member.full_name && (
                    <p className="text-xs text-[#555] truncate">{member.email}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{
                      background: `${ROLE_COLORS[member.role]}20`,
                      color: ROLE_COLORS[member.role],
                    }}
                  >
                    {ROLE_LABELS[member.role]}
                  </span>
                  {member.user_id !== currentUserId && (
                    <ChevronRight size={14} className="text-[#555]" />
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Add user sheet */}
      <BottomSheet open={addOpen} onClose={() => setAddOpen(false)} title="Nuevo usuario">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-wider text-[#888]">Nombre completo</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Opcional"
              className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-[#444] focus:border-[#10b981]/50 focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-wider text-[#888]">Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-[#444] focus:border-[#10b981]/50 focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-wider text-[#888]">Contraseña *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-[#444] focus:border-[#10b981]/50 focus:outline-none"
            />
          </div>

          {/* Role selector */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium uppercase tracking-wider text-[#888]">Rol</label>
            <div className="grid grid-cols-2 gap-2">
              {(['admin', 'manager', 'cashier', 'viewer'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setNewRole(r)}
                  className="h-10 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: newRole === r ? `${ROLE_COLORS[r]}20` : 'rgba(255,255,255,0.05)',
                    color: newRole === r ? ROLE_COLORS[r] : '#888',
                    border: newRole === r ? `1px solid ${ROLE_COLORS[r]}40` : '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  {ROLE_LABELS[r]}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={submitting}
            className="h-12 w-full rounded-xl bg-[#10b981] text-sm font-semibold text-white transition-all active:scale-95 disabled:opacity-50"
          >
            {submitting ? 'Creando...' : 'Crear usuario'}
          </button>
        </div>
      </BottomSheet>

      {/* Member detail sheet */}
      <BottomSheet
        open={memberOpen}
        onClose={() => setMemberOpen(false)}
        title={selectedMember?.full_name || selectedMember?.email}
      >
        {selectedMember && (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-white/10 p-3">
              <p className="text-xs text-[#555]">Email</p>
              <p className="text-sm text-white">{selectedMember.email}</p>
            </div>

            {/* Role change */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium uppercase tracking-wider text-[#888]">Cambiar rol</label>
              <div className="grid grid-cols-2 gap-2">
                {(['admin', 'manager', 'cashier', 'viewer'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => handleChangeRole(r)}
                    className="h-10 rounded-xl text-sm font-medium transition-all"
                    style={{
                      background: selectedMember.role === r ? `${ROLE_COLORS[r]}20` : 'rgba(255,255,255,0.05)',
                      color: selectedMember.role === r ? ROLE_COLORS[r] : '#888',
                      border: selectedMember.role === r ? `1px solid ${ROLE_COLORS[r]}40` : '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    {ROLE_LABELS[r]}
                  </button>
                ))}
              </div>
            </div>

            {/* Activate / Deactivate */}
            {selectedMember.is_active ? (
              <button
                onClick={handleDeactivate}
                className="h-12 w-full rounded-xl border border-[#ef4444]/30 bg-[#ef4444]/10 text-sm font-semibold text-[#ef4444] transition-all active:scale-95"
              >
                Desactivar acceso
              </button>
            ) : (
              <button
                onClick={handleReactivate}
                className="h-12 w-full rounded-xl border border-[#10b981]/30 bg-[#10b981]/10 text-sm font-semibold text-[#10b981] transition-all active:scale-95"
              >
                Reactivar acceso
              </button>
            )}
          </div>
        )}
      </BottomSheet>
    </>
  )
}

/* ─── Account Tab ─── */
function AccountTab({
  email,
  role,
  memberProfile,
  onSignOut,
}: {
  email: string
  role: WorkspaceMember['role'] | null
  memberProfile: WorkspaceMember | null
  onSignOut: () => void
}) {
  const [confirmSignOut, setConfirmSignOut] = useState(false)

  return (
    <div className="flex flex-col gap-4">
      <GlassCard className="flex flex-col gap-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-[#888]">Email</p>
          <p className="mt-0.5 text-sm text-white">{email}</p>
        </div>
        {memberProfile?.full_name && (
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-[#888]">Nombre</p>
            <p className="mt-0.5 text-sm text-white">{memberProfile.full_name}</p>
          </div>
        )}
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-[#888]">Rol</p>
          <div className="mt-1">
            {role && (
              <span
                className="rounded-full px-3 py-1 text-xs font-semibold"
                style={{
                  background: `${ROLE_COLORS[role]}20`,
                  color: ROLE_COLORS[role],
                }}
              >
                {ROLE_LABELS[role]}
              </span>
            )}
          </div>
        </div>
      </GlassCard>

      <button
        onClick={() => setConfirmSignOut(true)}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#ef4444]/30 bg-[#ef4444]/10 text-sm font-semibold text-[#ef4444] transition-all active:scale-95"
      >
        <LogOut size={16} />
        Cerrar sesión
      </button>

      <ConfirmDialog
        open={confirmSignOut}
        title="¿Cerrar sesión?"
        message="Tu sesión actual se cerrará en este dispositivo."
        confirmLabel="Cerrar sesión"
        cancelLabel="Cancelar"
        danger
        onConfirm={() => { setConfirmSignOut(false); onSignOut() }}
        onCancel={() => setConfirmSignOut(false)}
      />
    </div>
  )
}
