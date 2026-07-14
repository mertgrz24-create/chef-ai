import { supabase } from './supabase'

const API_URL = process.env.EXPO_PUBLIC_API_URL

if (!API_URL) {
  throw new Error('Missing EXPO_PUBLIC_API_URL. Copy .env.example to .env.')
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Calls a Next.js API route with the current Supabase session as a bearer
 * token — the transport the web app gets from cookies (see lib/supabase/api.ts
 * on the web side, which accepts either).
 *
 * AI endpoints must go through the server: the Anthropic/Gemini keys and the
 * freemium credit RPC live there, never on the device.
 */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new ApiError('Not signed in.', 401)
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
      ...init.headers,
    },
  })

  const text = await response.text()
  const body: unknown = text ? JSON.parse(text) : {}

  if (!response.ok) {
    const message =
      typeof body === 'object' && body !== null && 'error' in body
        ? String((body as { error: unknown }).error)
        : 'Something went wrong.'
    throw new ApiError(message, response.status)
  }

  return body as T
}
