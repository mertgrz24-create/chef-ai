'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

type ShoppingListResponse = {
  items: string[]
  fromPlan: boolean
  generatedAt: string
}

export default function ShoppingListPage() {
  const [items, setItems] = useState<string[]>([])
  const [fromPlan, setFromPlan] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [checked, setChecked] = useState<Set<number>>(new Set())
  const [copied, setCopied] = useState(false)

  const fetchList = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/shopping-list')
      if (!res.ok) {
        setError('Failed to load list.')
        return
      }
      const data = (await res.json()) as ShoppingListResponse
      setItems(data.items)
      setFromPlan(data.fromPlan)
      setChecked(new Set())
    } catch {
      setError('Failed to load list.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchList()
  }, [fetchList])

  function toggleItem(index: number) {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  async function copyList() {
    const unchecked = items.filter((_, i) => !checked.has(i))
    const text = unchecked.join('\n')
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // clipboard not available — silently ignore
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="mb-3 text-4xl">🛒</div>
          <p className="text-sm text-[var(--text-muted)]">Preparing list...</p>
        </div>
      </div>
    )
  }

  const uncheckedCount = items.length - checked.size

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">🛒 Shopping List</h1>
          {fromPlan && items.length > 0 && (
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Based on this week&apos;s plan, pantry items excluded
            </p>
          )}
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={() => { void copyList() }}
            className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:border-amber-300 hover:text-amber-600 dark:hover:text-amber-400"
          >
            {copied ? '✓ Copied' : '📋 Copy List'}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* No meal plan */}
      {!fromPlan && !error && (
        <div className="rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--bg-card)] p-12 text-center">
          <div className="mb-4 text-5xl">🗓️</div>
          <h2 className="mb-2 text-lg font-semibold text-[var(--text-secondary)]">
            No weekly meal plan found
          </h2>
          <p className="mb-6 text-sm text-[var(--text-muted)]">
            A shopping list requires a meal plan for the week.
          </p>
          <Link
            href="/meal-plan"
            className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ backgroundColor: '#ffa51f' }}
          >
            🗓️ Create a meal plan first →
          </Link>
        </div>
      )}

      {/* Plan exists but all items are in pantry */}
      {fromPlan && items.length === 0 && (
        <div className="rounded-2xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 p-10 text-center">
          <div className="mb-3 text-5xl">✅</div>
          <h2 className="mb-1 text-lg font-semibold text-green-700 dark:text-green-400">
            All ingredients are in your pantry!
          </h2>
          <p className="text-sm text-green-600 dark:text-green-500">
            You already have everything needed for this week&apos;s plan.
          </p>
        </div>
      )}

      {/* Shopping list */}
      {items.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-sm">
          {/* Summary bar */}
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg)] px-5 py-3">
            <span className="text-xs font-medium text-[var(--text-muted)]">
              {uncheckedCount} / {items.length} items
            </span>
            {checked.size > 0 && (
              <button
                type="button"
                onClick={() => setChecked(new Set())}
                className="text-xs text-amber-500 transition hover:underline"
              >
                Clear Selection
              </button>
            )}
          </div>

          <AnimatePresence initial={false}>
            <ul className="divide-y divide-[var(--border-subtle)]">
              {items.map((item, i) => {
                const isChecked = checked.has(i)
                return (
                  <motion.li
                    key={item}
                    layout
                    transition={{ duration: 0.15 }}
                    className="flex items-center gap-4 px-5 py-3.5 transition hover:bg-[var(--bg)]"
                  >
                    <button
                      type="button"
                      onClick={() => toggleItem(i)}
                      className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 transition ${
                        isChecked
                          ? 'border-amber-400 bg-amber-400 text-white'
                          : 'border-[var(--border)] bg-transparent'
                      }`}
                      aria-label={isChecked ? `Uncheck ${item}` : `Check ${item}`}
                    >
                      {isChecked && (
                        <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                    <span
                      className={`text-sm transition ${
                        isChecked
                          ? 'text-[var(--text-muted)] line-through'
                          : 'text-[var(--text-primary)]'
                      }`}
                    >
                      {item}
                    </span>
                  </motion.li>
                )
              })}
            </ul>
          </AnimatePresence>

          {checked.size === items.length && items.length > 0 && (
            <div className="border-t border-[var(--border-subtle)] bg-[var(--bg)] px-5 py-4 text-center text-sm text-[var(--text-muted)]">
              All done! 🎉
            </div>
          )}
        </div>
      )}
    </div>
  )
}
