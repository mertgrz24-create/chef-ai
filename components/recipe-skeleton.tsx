'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const STAGES = [
  '🔍 Analyzing your ingredients…',
  '👨‍🍳 Crafting your recipe…',
  '🧮 Estimating macros…',
  '✨ Adding the finishing touches…',
]

const STAGE_INTERVAL_MS = 4000

export function RecipeSkeleton() {
  const [stage, setStage] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setStage((s) => Math.min(s + 1, STAGES.length - 1))
    }, STAGE_INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  const bar = 'rounded-lg bg-[var(--border-subtle)] animate-pulse'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="mt-6 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-sm"
      aria-busy="true"
      aria-live="polite"
    >
      {/* Staged status message */}
      <div className="mb-6 h-5">
        <AnimatePresence mode="wait">
          <motion.p
            key={stage}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="text-sm font-medium text-amber-500"
          >
            {STAGES[stage]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Title + badges */}
      <div className={`${bar} h-6 w-2/3`} />
      <div className="mt-3 flex gap-2">
        <div className={`${bar} h-6 w-20 rounded-full`} />
        <div className={`${bar} h-6 w-20 rounded-full`} />
        <div className={`${bar} h-6 w-16 rounded-full`} />
      </div>

      {/* Ingredients */}
      <div className={`${bar} mt-7 h-3.5 w-28`} />
      <div className="mt-3 space-y-2.5">
        <div className={`${bar} h-4 w-1/2`} />
        <div className={`${bar} h-4 w-2/5`} />
        <div className={`${bar} h-4 w-3/5`} />
        <div className={`${bar} h-4 w-1/3`} />
      </div>

      {/* Steps */}
      <div className={`${bar} mt-7 h-3.5 w-32`} />
      <div className="mt-3 space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex gap-3">
            <div className={`${bar} h-6 w-6 shrink-0 rounded-full`} />
            <div className={`${bar} h-4 flex-1`} style={{ maxWidth: `${85 - i * 12}%` }} />
          </div>
        ))}
      </div>
    </motion.div>
  )
}
