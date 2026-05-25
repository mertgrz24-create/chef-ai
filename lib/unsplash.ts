const UNSPLASH_BASE = 'https://api.unsplash.com'

export async function getRecipeImage(recipeName: string): Promise<string | null> {
  const key = process.env.UNSPLASH_ACCESS_KEY
  if (!key) return null

  try {
    const url = `${UNSPLASH_BASE}/search/photos?query=${encodeURIComponent(recipeName)}&per_page=1&orientation=landscape`
    const res = await fetch(url, {
      headers: { Authorization: `Client-ID ${key}` },
      next: { revalidate: 86400 },
    })

    if (!res.ok) return null

    const data = (await res.json()) as {
      results: Array<{ urls: { regular: string } }>
    }

    return data.results[0]?.urls?.regular ?? null
  } catch {
    return null
  }
}
