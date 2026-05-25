'use client'

import { motion } from 'framer-motion'

interface StatCardProps {
  icon: string
  value: string | number
  label: string
}

export function StatCard({ icon, value, label }: StatCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-sm"
    >
      <div className="mb-3 text-3xl">{icon}</div>
      <div className="text-3xl font-bold" style={{ color: '#ffa51f' }}>
        {value}
      </div>
      <div className="mt-1 text-sm text-[var(--text-muted)]">{label}</div>
    </motion.div>
  )
}
