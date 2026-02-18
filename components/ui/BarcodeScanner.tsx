'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ScanLine } from 'lucide-react'

type BarcodeScannerProps = {
  open: boolean
  onScan: (barcode: string) => void
  onClose: () => void
}

export default function BarcodeScanner({ open, onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [manualMode, setManualMode] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const [cameraError, setCameraError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setManualMode(false)
      setManualCode('')
      setCameraError(null)
      return
    }

    if (manualMode) return

    let stopped = false

    ;(async () => {
      try {
        const { BrowserMultiFormatReader } = await import('@zxing/browser')
        const reader = new BrowserMultiFormatReader()

        if (!videoRef.current || stopped) return

        await reader.decodeFromVideoDevice(
          undefined,
          videoRef.current,
          (result, err) => {
            if (stopped) return
            if (result) {
              stopped = true
              BrowserMultiFormatReader.releaseAllStreams()
              onScan(result.getText())
            }
            if (err) {
              // Suppress NotFoundException — fires on every empty frame
              if (err.name !== 'NotFoundException') {
                console.warn('ZXing error:', err)
              }
            }
          }
        )
      } catch (err: unknown) {
        if (stopped) return
        const error = err as Error
        let msg = 'No se pudo iniciar la cámara'
        if (error.name === 'NotAllowedError') {
          msg = 'Permiso de cámara denegado'
        } else if (error.name === 'NotFoundError') {
          msg = 'No se encontró cámara en este dispositivo'
        }
        setCameraError(msg)
        setManualMode(true)
      }
    })()

    return () => {
      stopped = true
      import('@zxing/browser').then(({ BrowserMultiFormatReader }) => {
        BrowserMultiFormatReader.releaseAllStreams()
      })
    }
  }, [open, manualMode]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleManualConfirm() {
    const code = manualCode.trim()
    if (!code) return
    onScan(code)
    setManualCode('')
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            key="scanner-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[70] bg-black/80"
          />

          {/* Sheet */}
          <motion.div
            key="scanner-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[70] flex flex-col rounded-t-[20px] overflow-hidden"
            style={{
              height: '90dvh',
              background: '#0a0a0a',
              border: '1px solid rgba(255,255,255,0.08)',
              borderBottom: 'none',
            }}
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between px-4 py-4">
              <div className="flex items-center gap-2">
                <ScanLine size={18} className="text-[#10b981]" />
                <h2 className="text-base font-semibold text-white">Escanear código</h2>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.07] active:bg-white/15"
              >
                <X size={16} className="text-[#888]" />
              </button>
            </div>

            {/* Camera view or manual */}
            {!manualMode ? (
              <div className="relative flex-1 overflow-hidden">
                {/* Video */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 h-full w-full object-cover"
                />

                {/* Dark vignette */}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.7) 100%)',
                  }}
                />

                {/* Corner guides */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative h-52 w-72">
                    {/* Top-left */}
                    <span className="absolute left-0 top-0 h-8 w-8 border-l-2 border-t-2 border-[#10b981] rounded-tl-sm" />
                    {/* Top-right */}
                    <span className="absolute right-0 top-0 h-8 w-8 border-r-2 border-t-2 border-[#10b981] rounded-tr-sm" />
                    {/* Bottom-left */}
                    <span className="absolute bottom-0 left-0 h-8 w-8 border-b-2 border-l-2 border-[#10b981] rounded-bl-sm" />
                    {/* Bottom-right */}
                    <span className="absolute bottom-0 right-0 h-8 w-8 border-b-2 border-r-2 border-[#10b981] rounded-br-sm" />

                    {/* Animated scan line */}
                    <motion.div
                      className="absolute left-1 right-1 h-0.5 bg-[#10b981]"
                      style={{ boxShadow: '0 0 8px #10b981' }}
                      animate={{ top: ['8px', 'calc(100% - 8px)', '8px'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    />
                  </div>
                </div>

                {/* Status text */}
                <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center gap-3 pb-8 px-6">
                  <p className="text-sm text-white/70">Apunta al código de barras</p>
                  <button
                    onClick={() => setManualMode(true)}
                    className="rounded-full border border-white/20 px-4 py-2 text-xs font-medium text-white/60 active:bg-white/10"
                  >
                    Ingresar manualmente
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-1 flex-col gap-4 px-4 pt-4">
                {/* Camera error card */}
                {cameraError && (
                  <div className="rounded-xl border border-[#ef4444]/30 bg-[#ef4444]/10 p-3">
                    <p className="text-sm text-[#ef4444]">{cameraError}</p>
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium uppercase tracking-wider text-[#888]">
                    Código de barras
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleManualConfirm()}
                    placeholder="Ej. 7501234567890"
                    autoFocus
                    className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-[#444] focus:border-[#10b981]/50 focus:outline-none"
                  />
                </div>

                <button
                  onClick={handleManualConfirm}
                  disabled={!manualCode.trim()}
                  className="h-12 w-full rounded-xl bg-[#10b981] text-sm font-semibold text-white transition-all active:scale-95 disabled:opacity-40"
                >
                  Confirmar
                </button>

                {/* Back to camera — only if no camera error */}
                {!cameraError && (
                  <button
                    onClick={() => setManualMode(false)}
                    className="text-center text-sm text-[#888] active:text-white"
                  >
                    Usar cámara
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
