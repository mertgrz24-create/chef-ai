import { NextResponse } from 'next/server'

// This origin is the mobile backend. The product website is deployed separately.
export function GET() {
  return NextResponse.json(
    { service: 'chef-ai-backend', configuration: '/api/mobile/config' },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
