import { NextRequest, NextResponse } from 'next/server'
import { getRecipeImage } from '@/lib/pexels'

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get('name')
  if (!name) return NextResponse.json({ url: null })
  const url = await getRecipeImage(`${name} food dish`)
  return NextResponse.json({ url })
}
