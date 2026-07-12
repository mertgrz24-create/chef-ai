'use client'

import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: number
  message: string
  type: ToastType
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const AUTO_DISMISS_MS = 3500

const TYPE_STYLES: Record<ToastType, { icon: string; classes: string }> = {
  success: {
    icon: '✓',
    classes:
      'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/90 text-green-700 dark:text-green-300',
  },
  error: {
    icon: '✕',
    classes:
      'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/90 text-red-700 dark:text-red-300',
  },
  info: {
    icon: 'ℹ',
    classes:
      'border-[var(--accent-border)] bg-[var(--accent-light)] text-[var(--text-secondary)]',
  },
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = nextId.current++
      setToasts((prev) => [...prev.slice(-2), { id, message, type }])
      setTimeout(() => dismiss(id), AUTO_DISMISS_MS)
    },
    [dismiss]
  )

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Toast stack — bottom-center on mobile, bottom-right on desktop */}
      <div className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:items-end">
        <AnimatePresence>
          {toasts.map((t) => {
            const style = TYPE_STYLES[t.type]
            return (
              <motion.button
                key={t.id}
                type="button"
                onClick={() => dismiss(t.id)}
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className={`pointer-events-auto flex max-w-sm items-start gap-2.5 rounded-xl border px-4 py-3 text-left text-sm font-medium shadow-lg backdrop-blur ${style.classes}`}
              >
                <span aria-hidden className="mt-px shrink-0">{style.icon}</span>
                {t.message}
              </motion.button>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
