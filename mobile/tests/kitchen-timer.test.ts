import { expect, it, jest } from '@jest/globals'
import { KitchenTimer, UnknownNotificationId, type TimerDependencies } from '@/lib/release/kitchen-timer'

function dependencies(): TimerDependencies {
  return {
    now: () => 1_000,
    id: () => 'timer-id',
    read: jest.fn<() => Promise<string | null>>().mockResolvedValue(null),
    write: jest.fn<(value: string | null) => Promise<void>>().mockResolvedValue(),
    permission: jest.fn<() => Promise<boolean>>().mockResolvedValue(true),
    schedule: jest.fn<(id: string, deadline: number) => Promise<void>>().mockResolvedValue(),
    cancel: jest.fn<(id: string) => Promise<void>>().mockResolvedValue(),
    pending: jest.fn<() => Promise<string[]>>().mockResolvedValue(['timer-id']),
  }
}
it('persists and schedules a timer using one stable identifier', async () => {
  const deps = dependencies(), timer = new KitchenTimer(deps)
  await timer.load()
  await timer.start(1)
  expect(timer.snapshot()).toMatchObject({ status: 'running', deadline: 61_000, mode: 'notification' })
  expect(deps.schedule).toHaveBeenCalledWith('timer-id', 61_000)
  expect(deps.write).toHaveBeenCalledWith(expect.stringContaining('timer-id'))
})
it('continues visually when notification permission is denied', async () => {
  const deps = dependencies()
  ;(deps.permission as jest.Mock<() => Promise<boolean>>).mockResolvedValue(false)
  const timer = new KitchenTimer(deps)
  await timer.load(); await timer.start(2)
  expect(timer.snapshot()).toMatchObject({ status: 'running', deadline: 121_000, mode: 'visual' })
  expect(deps.schedule).not.toHaveBeenCalled()
})
it('recovers the same scheduled timer after restart and cancels only that notification', async () => {
  const deps = dependencies()
  ;(deps.read as jest.Mock<() => Promise<string | null>>).mockResolvedValue(JSON.stringify({ id: 'timer-id', deadline: 61_000, mode: 'notification' }))
  const timer = new KitchenTimer(deps)
  await timer.load()
  expect(timer.snapshot()).toMatchObject({ status: 'running', deadline: 61_000, mode: 'notification' })
  await timer.stop()
  expect(deps.cancel).toHaveBeenCalledWith('timer-id')
  expect(deps.write).toHaveBeenLastCalledWith(null)
  expect(timer.snapshot().status).toBe('idle')
})
it('does not claim an alarm is active when the saved notification is missing', async () => {
  const deps = dependencies()
  ;(deps.read as jest.Mock<() => Promise<string | null>>).mockResolvedValue(JSON.stringify({ id: 'timer-id', deadline: 61_000, mode: 'notification' }))
  ;(deps.pending as jest.Mock<() => Promise<string[]>>).mockResolvedValue([])
  const timer = new KitchenTimer(deps)
  await timer.load()
  expect(timer.snapshot().status).toBe('error')
})
it('does not clear a scheduled timer when cancellation fails', async () => {
  const deps = dependencies(), timer = new KitchenTimer(deps)
  await timer.load(); await timer.start(1)
  ;(deps.cancel as jest.Mock<(id: string) => Promise<void>>).mockRejectedValue(Error('cancel failed'))
  await timer.stop()
  expect(timer.snapshot().status).toBe('error')
  expect(deps.write).not.toHaveBeenCalledWith(null)
})
it('prevents duplicate starts while notification permission is pending', async () => {
  const deps = dependencies()
  let grant!: (value: boolean) => void
  ;(deps.permission as jest.Mock<() => Promise<boolean>>).mockImplementation(() => new Promise(resolve => { grant = resolve }))
  const timer = new KitchenTimer(deps)
  await timer.load()
  const first = timer.start(1), second = timer.start(2)
  grant(true)
  await Promise.all([first, second])
  expect(deps.schedule).toHaveBeenCalledTimes(1)
  expect(timer.snapshot().deadline).toBe(61_000)
})
it('cancels an uncertain schedule before switching to visual mode', async () => {
  const deps = dependencies()
  ;(deps.schedule as jest.Mock<(id: string, deadline: number) => Promise<void>>).mockRejectedValue(Error('unconfirmed'))
  const timer = new KitchenTimer(deps)
  await timer.load(); await timer.start(1)
  expect(deps.cancel).toHaveBeenCalledWith('timer-id')
  expect(timer.snapshot()).toMatchObject({ status: 'running', mode: 'visual' })
  expect(deps.write).toHaveBeenLastCalledWith(expect.stringContaining('"visual"'))
})
it('retains an unexpected notification identifier when cancellation is uncertain', async () => {
  const deps = dependencies()
  ;(deps.schedule as jest.Mock<(id: string, deadline: number) => Promise<void>>).mockRejectedValue(new UnknownNotificationId('actual-id'))
  const timer = new KitchenTimer(deps)
  await timer.load(); await timer.start(1)
  expect(timer.snapshot().status).toBe('error')
  expect(deps.write).toHaveBeenLastCalledWith(expect.stringContaining('actual-id'))
  await timer.stop()
  expect(deps.cancel).toHaveBeenCalledWith('actual-id')
})
