import { describe, it, expect, jest, afterEach } from '@jest/globals'
import { transport } from '@/lib/release/request'
const response = (status: number, body: string) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    text: async () => body,
  }) as Response
afterEach(() => {
  jest.useRealTimers()
})
describe('network transport', () => {
  it('parses success and supplies a request ID', async () => {
    const fetcher = jest
      .fn<(url: string, init?: RequestInit) => Promise<Response>>()
      .mockResolvedValue(response(200, '{"ok":true}'))
    await expect(
      transport('https://example.com/api/test', {}, fetcher),
    ).resolves.toEqual({ ok: true })
    expect(
      new Headers(fetcher.mock.calls[0][1]?.headers).get('X-Client-Request-Id'),
    ).toBe('test-request-uuid')
  })
  it('accepts empty successful responses', async () =>
    expect(
      transport(
        'https://example.com',
        {},
        jest.fn<(url: string, init?: RequestInit) => Promise<Response>>().mockResolvedValue(response(204, '')),
      ),
    ).resolves.toEqual({}))
  it('does not expose HTML server errors', async () => {
    await expect(
      transport(
        'https://example.com',
        {},
        jest
          .fn<(url: string, init?: RequestInit) => Promise<Response>>()
          .mockResolvedValue(response(200, '<html>secret</html>')),
      ),
    ).rejects.toMatchObject({ code: 'invalid_response' })
  })
  it('does not automatically replay writes', async () => {
    const fetcher = jest
      .fn<(url: string, init?: RequestInit) => Promise<Response>>()
      .mockRejectedValue(new Error('network'))
    await expect(
      transport('https://example.com', { method: 'POST' }, fetcher),
    ).rejects.toMatchObject({ code: 'offline' })
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
  it('does not retry 401 or 429', async () => {
    for (const status of [401, 429]) {
      const fetcher = jest
        .fn<(url: string, init?: RequestInit) => Promise<Response>>()
        .mockResolvedValue(response(status, '{}'))
      await expect(
        transport('https://example.com', {}, fetcher),
      ).rejects.toMatchObject({ status })
      expect(fetcher).toHaveBeenCalledTimes(1)
    }
  })
  it('retries a safe read at most twice', async () => {
    jest.useFakeTimers()
    const fetcher = jest
      .fn<(url: string, init?: RequestInit) => Promise<Response>>()
      .mockResolvedValue(response(503, '{}'))
    const promise = transport('https://example.com', {}, fetcher)
    const assertion = expect(promise).rejects.toMatchObject({ status: 503 })
    await jest.runAllTimersAsync()
    await assertion
    expect(fetcher).toHaveBeenCalledTimes(3)
  })
  it('recovers a safe read without duplicating IDs', async () => {
    jest.useFakeTimers()
    const fetcher = jest
      .fn<(url: string, init?: RequestInit) => Promise<Response>>()
      .mockRejectedValueOnce(new Error())
      .mockResolvedValue(response(200, '{"ok":true}'))
    const promise = transport('https://example.com', {}, fetcher)
    await jest.runAllTimersAsync()
    await expect(promise).resolves.toEqual({ ok: true })
    expect(
      new Headers(fetcher.mock.calls[0][1]?.headers).get('X-Client-Request-Id'),
    ).toEqual(
      new Headers(fetcher.mock.calls[1][1]?.headers).get('X-Client-Request-Id'),
    )
  })
  it('reports timeout and aborts the fetch', async () => {
    jest.useFakeTimers()
    const fetcher = jest
      .fn<(url: string, init?: RequestInit) => Promise<Response>>()
      .mockImplementation(
        async (_url, init) =>
          new Promise((_resolve, reject) =>
            init?.signal?.addEventListener('abort', () =>
              reject(new Error('aborted')),
            ),
          ),
      )
    const promise = transport(
      'https://example.com',
      { method: 'POST', timeoutMs: 10 },
      fetcher,
    )
    const assertion = expect(promise).rejects.toMatchObject({ code: 'timeout' })
    await jest.runAllTimersAsync()
    await assertion
  })
  it('does not retry caller cancellation', async () => {
    const controller = new AbortController()
    controller.abort()
    const fetcher = jest
      .fn<(url: string, init?: RequestInit) => Promise<Response>>()
      .mockRejectedValue(new Error('aborted'))
    await expect(
      transport('https://example.com', { signal: controller.signal }, fetcher),
    ).rejects.toMatchObject({ code: 'cancelled' })
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
})
