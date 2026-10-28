import type { Metadata } from 'next'
import '../globals.css'

export const metadata: Metadata = {
  title: 'Chef-AI recipe',
  robots: { index: false, follow: false },
}

// Retained public recipe URLs belong to the product backend, not the marketing site.
export default function RecipeLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>
}
