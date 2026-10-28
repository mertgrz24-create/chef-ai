import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { randomUUID } from 'node:crypto'
const mockSession = {
  access_token: randomUUID(),
  user: { id: 'fixture-user' },
}
const mockGet = jest.fn<() => Promise<unknown>>()
const mockRefresh = jest.fn<() => Promise<unknown>>()
const mockTransport = jest.fn<(url:string,options:unknown) => Promise<unknown>>()
let mockEvent: (event: string) => void
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => mockGet(),
      refreshSession: () => mockRefresh(),
      onAuthStateChange: (fn: (event: string) => void) => {
        mockEvent = fn
        return { data: { subscription: { unsubscribe: () => {} } } }
      },
    },
  },
}))
jest.mock('@/lib/release/request', () => {
  const actual = jest.requireActual<object>('@/lib/release/request')
  return {
    ...actual,
    transport: (url:string,options:unknown) => mockTransport(url,options),
    requestId: () => 'fixture-request',
  }
})
process.env.EXPO_PUBLIC_API_URL = 'https://api.example.com'
import { apiFetch, ApiError } from '@/lib/api'
import { clearPendingAi, pendingAiStore } from '@/lib/release/ai-recovery'
beforeEach(async () => {
  await clearPendingAi('fixture-user')
  mockGet.mockReset()
  mockRefresh.mockReset()
  mockTransport.mockReset()
  mockGet.mockResolvedValue({ data: { session: mockSession } })
  mockRefresh.mockResolvedValue({ data: { session: mockSession }, error: null })
})
describe('authenticated API', () => {
  it('does not send an unauthenticated request', async () => {
    mockGet.mockResolvedValue({ data: { session: null } })
    await expect(apiFetch('/api/test')).rejects.toMatchObject({ status: 401 })
    expect(mockTransport).not.toHaveBeenCalled()
  })
  it('rejects a malformed pantry response', async () => {
    mockTransport.mockResolvedValue({ items: [{ name: 'missing fields' }] })
    await expect(apiFetch('/api/pantry')).rejects.toMatchObject({
      code: 'invalid_response',
    })
  })
  it('does not expose a previous account response after logout', async () => {
    mockTransport.mockImplementation(async () => {
      mockEvent('SIGNED_OUT')
      return { ok: true }
    })
    await expect(apiFetch('/api/test')).rejects.toMatchObject({
      code: 'cancelled',
    })
  })
  it('never sends an old screen write when the account changes during session lookup', async () => {
    mockGet.mockImplementation(async () => {
      mockEvent('SIGNED_IN')
      return { data: { session: { ...mockSession, user: { id: 'another-user' } } } }
    })
    await expect(apiFetch('/api/test', { method: 'POST', body: '{"private":"old account"}' }))
      .rejects.toMatchObject({ code: 'cancelled' })
    expect(mockTransport).not.toHaveBeenCalled()
  })
  it('does not replay a read with a refreshed session belonging to another user', async () => {
    mockTransport.mockRejectedValueOnce(new ApiError('unauthenticated', 401))
    mockRefresh.mockResolvedValue({
      data: { session: { ...mockSession, user: { id: 'another-user' } } }, error: null,
    })
    await expect(apiFetch('/api/test')).rejects.toMatchObject({ status: 401 })
    expect(mockTransport).toHaveBeenCalledTimes(1)
  })
  it('refreshes expired auth for a read once', async () => {
    mockTransport
      .mockRejectedValueOnce(new ApiError('unauthenticated', 401))
      .mockResolvedValue({ ok: true })
    await expect(apiFetch('/api/test')).resolves.toEqual({ ok: true })
    expect(mockRefresh).toHaveBeenCalledTimes(1)
    expect(mockTransport).toHaveBeenCalledTimes(2)
  })
  it('never replays a write after refreshing', async () => {
    mockTransport.mockRejectedValue(new ApiError('unauthenticated', 401))
    await expect(
      apiFetch('/api/test', { method: 'POST', body: '{}' }),
    ).rejects.toMatchObject({ code: 'session_renewed' })
    expect(mockTransport).toHaveBeenCalledTimes(1)
  })
  it('shares a refresh for concurrent unauthorized reads', async () => {
    let resolve!: (value: unknown) => void
    mockRefresh.mockImplementation(
      () =>
        new Promise((r) => {
          resolve = r
        }),
    )
    let calls = 0
    mockTransport.mockImplementation(async () => {
      if (calls++ < 2) throw new ApiError('unauthenticated', 401)
      return { ok: true }
    })
    const a = apiFetch('/api/test'),
      b = apiFetch('/api/test')
    await new Promise((r) => setTimeout(r, 0))
    resolve({ data: { session: mockSession }, error: null })
    await Promise.all([a, b])
    expect(mockRefresh).toHaveBeenCalledTimes(1)
  })
  it('recovers an uncertain AI POST using only its existing status GET',async()=>{
    const response={recipe:'Existing result',structured:null,macros:null,resultId:'existing-job'}
    mockTransport.mockRejectedValueOnce(new ApiError('timeout',0,'timeout'))
      .mockResolvedValueOnce({state:'completed',status:200,response})
    await expect(apiFetch('/api/recipes',{method:'POST',body:'{"ingredients":["fixture"]}'})).resolves.toEqual(response)
    expect(mockTransport).toHaveBeenCalledTimes(2)
    expect(mockTransport).toHaveBeenNthCalledWith(1,'https://api.example.com/api/recipes',expect.objectContaining({method:'POST'}))
    expect(mockTransport).toHaveBeenNthCalledWith(2,'https://api.example.com/api/mobile/ai-status?operation=recipes',expect.objectContaining({headers:expect.any(Headers)}))
    expect(pendingAiStore.getSnapshot()).toBeNull()
  })
  it('does not generate again for a server-confirmed timeout/refund',async()=>{
    mockTransport.mockRejectedValueOnce(new ApiError('pending',409,'operation_pending'))
      .mockResolvedValueOnce({state:'completed',status:504,response:{code:'ai_result_unavailable',creditReturned:true}})
    await expect(apiFetch('/api/recipes',{method:'POST',body:'{}'})).rejects.toMatchObject({code:'ai_result_unavailable'})
    expect(mockTransport).toHaveBeenCalledTimes(2)
    expect(pendingAiStore.getSnapshot()).toBeNull()
  })
  it('retains an opaque recovery pointer on cancellation and blocks a second AI write',async()=>{
    const controller=new AbortController()
    mockTransport.mockImplementationOnce(async()=>{controller.abort();throw new ApiError('cancelled',0,'cancelled')})
    await expect(apiFetch('/api/vision',{method:'POST',body:new FormData(),signal:controller.signal})).rejects.toMatchObject({code:'cancelled'})
    expect(pendingAiStore.getSnapshot()?.pending.operation).toBe('scan')
    await expect(apiFetch('/api/recipes',{method:'POST',body:'{}'})).rejects.toMatchObject({code:'operation_pending'})
    expect(mockTransport).toHaveBeenCalledTimes(1)
  })
  it('never delivers a recovered result to a different account',async()=>{
    mockTransport.mockRejectedValueOnce(new ApiError('offline',0,'offline'))
      .mockImplementationOnce(async()=>{mockEvent('SIGNED_OUT');return {state:'completed',status:200,response:{recipe:'private',structured:null,macros:null}}})
    await expect(apiFetch('/api/recipes',{method:'POST',body:'{}'})).rejects.toMatchObject({code:'cancelled'})
    expect(mockTransport).toHaveBeenCalledTimes(2)
  })
})

it('rejects work captured before an account change even when lookup starts after the new login', async () => {
  await expect(apiFetch('/api/push/register', {
    method: 'POST', expectedUserId: 'previous-user', body: '{}',
  })).rejects.toMatchObject({ code: 'cancelled' })
  expect(mockTransport).not.toHaveBeenCalled()
})
it('keeps the local account constraint out of HTTP transport options', async () => {
  mockTransport.mockResolvedValue({ ok: true })
  await apiFetch('/api/test', { expectedUserId: mockSession.user.id })
  expect(mockTransport.mock.calls[0][1]).not.toHaveProperty('expectedUserId')
})
