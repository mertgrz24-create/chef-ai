'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch — render after mount only
  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="h-9 w-9" />

  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      aria-label={isDark ? 'Açık temaya geç' : 'Koyu temaya geç'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="flex h-9 w-9 items-center justify-center rounded-xl text-lg transition hover:bg-gray-100 dark:hover:bg-white/10"
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  )
}
