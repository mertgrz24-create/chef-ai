import { randomUUID } from 'expo-crypto'
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code = 'request_failed',
    readonly requestId?: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}
export type RequestOptions = RequestInit & {
  timeoutMs?: number
  requestId?: string
}
export function requestId() {
  return randomUUID()
}
export async function transport(
  url: string,
  options: RequestOptions,
  fetcher: (url: string, init?: RequestInit) => Promise<Response> = fetch,
): Promise<unknown> {
  const { timeoutMs = 20000, requestId: id = requestId(), ...init } = options
  const method = (init.method ?? 'GET').toUpperCase()
  const attempts = method === 'GET' ? 3 : 1
  for (let attempt = 0; attempt < attempts; attempt++) {
    const controller = new AbortController()
    const abort = () => controller.abort()
    init.signal?.addEventListener('abort', abort, { once: true })
    if (init.signal?.aborted) controller.abort()
    const timer = setTimeout(abort, timeoutMs)
    try {
      const headers = new Headers(init.headers)
      headers.set('X-Client-Request-Id', id)
      const response = await fetcher(url, {
        ...init,
        headers,
        signal: controller.signal,
      })
      let body: unknown = {}
      const text = await response.text()
      if (text) {
        try {
          body = JSON.parse(text)
        } catch {
          throw new ApiError(
            'Invalid server response.',
            response.status,
            'invalid_response',
            id,
          )
        }
      }
      if (!response.ok) {
        const code =
          typeof body === 'object' &&
          body &&
          'code' in body &&
          typeof body.code === 'string'
            ? body.code
            : response.status === 429
              ? 'rate_limited'
              : 'request_failed'
        throw new ApiError('Request failed.', response.status, code, id)
      }
      return body
    } catch (error) {
      if (init.signal?.aborted)
        throw new ApiError('Request cancelled.', 0, 'cancelled', id)
      const failure =
        error instanceof ApiError
          ? error
          : new ApiError(
              'Connection interrupted.',
              0,
              controller.signal.aborted ? 'timeout' : 'offline',
              id,
            )
      if (
        attempt === attempts - 1 ||
        !(
          failure.status >= 500 ||
          failure.code === 'offline' ||
          failure.code === 'timeout'
        )
      )
        throw failure
    } finally {
      clearTimeout(timer)
      init.signal?.removeEventListener('abort', abort)
    }
    await new Promise((resolve) => setTimeout(resolve, 300 * 2 ** attempt))
  }
  throw new ApiError('Request failed.', 0)
}
