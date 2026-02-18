'use client'

import { motion, AnimatePresence } from 'framer-motion'

type ConfirmDialogProps = {
  open: boolean
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/80"
            onClick={onCancel}
          />
          <motion.div
            key="dialog"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed left-1/2 top-1/2 z-[61] w-[90%] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-[14px] p-5"
            style={{
              background: '#1a1a1a',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <h3 className="text-base font-semibold text-white">{title}</h3>
            {message && <p className="mt-2 text-sm text-[#888]">{message}</p>}
            <div className="mt-5 flex gap-3">
              <button
                onClick={onCancel}
                className="h-11 flex-1 rounded-xl border border-white/10 text-sm font-medium text-[#888] transition-colors active:bg-white/5"
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                className="h-11 flex-1 rounded-xl text-sm font-semibold text-white transition-colors active:opacity-80"
                style={{ background: danger ? '#ef4444' : '#10b981' }}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
