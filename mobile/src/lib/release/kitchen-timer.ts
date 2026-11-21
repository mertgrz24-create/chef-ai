export type TimerRecord = { id: string; deadline: number; mode: 'notification' | 'visual' }
export type TimerState = { status: 'loading' | 'busy' | 'idle' | 'running' | 'error'; deadline: number | null; mode: TimerRecord['mode'] | null }
export type TimerDependencies = {
  now: () => number
  id: () => string
  read: () => Promise<string | null>
  write: (value: string | null) => Promise<void>
  permission: () => Promise<boolean>
  schedule: (id: string, deadline: number) => Promise<void>
  cancel: (id: string) => Promise<void>
  pending: () => Promise<string[]>
}
export class UnknownNotificationId extends Error {
  constructor(readonly actualId: string) { super('unknown_notification_id') }
}

export class KitchenTimer {
  private state: TimerState = { status: 'loading', deadline: null, mode: null }
  private record: TimerRecord | null = null
  private listeners = new Set<() => void>()
  private locked = false
  constructor(private readonly deps: TimerDependencies) {}
  snapshot = () => this.state
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener) } }
  private publish(state: TimerState) { this.state = state; this.listeners.forEach(listener => listener()) }
  private show(record: TimerRecord) { this.publish({ status: 'running', deadline: record.deadline, mode: record.mode }) }
  async load() {
    if (this.locked) return
    this.locked = true
    try {
      const raw = await this.deps.read()
      if (!raw) { this.record = null; this.publish({ status: 'idle', deadline: null, mode: null }); return }
      const value: unknown = JSON.parse(raw)
      if (!value || typeof value !== 'object' || !('id' in value) || typeof value.id !== 'string' || !value.id || !('deadline' in value) || typeof value.deadline !== 'number' || !Number.isFinite(value.deadline) || !('mode' in value) || (value.mode !== 'notification' && value.mode !== 'visual')) throw new Error('invalid_timer')
      this.record = { id: value.id, deadline: value.deadline, mode: value.mode }
      if (value.mode === 'notification' && value.deadline > this.deps.now() && !(await this.deps.pending()).includes(value.id)) throw new Error('timer_not_scheduled')
      this.show(this.record)
    } catch { this.publish({ status: 'error', deadline: null, mode: null }) }
    finally { this.locked = false }
  }
  async start(minutes: number) {
    if (this.locked || this.state.status !== 'idle' || !Number.isInteger(minutes) || minutes < 1 || minutes > 180) return
    this.locked = true
    this.publish({ status: 'busy', deadline: null, mode: null })
    try {
      const allowed = await this.deps.permission()
      const record: TimerRecord = { id: this.deps.id(), deadline: this.deps.now() + minutes * 60_000, mode: allowed ? 'notification' : 'visual' }
      await this.deps.write(JSON.stringify(record))
      this.record = record
      if (allowed) {
        try { await this.deps.schedule(record.id, record.deadline) }
        catch (error) {
          if (error instanceof UnknownNotificationId) {
            record.id = error.actualId
            await this.deps.write(JSON.stringify(record))
            throw error
          }
          await this.deps.cancel(record.id)
          record.mode = 'visual'
          await this.deps.write(JSON.stringify(record))
        }
      }
      this.show(record)
    } catch { this.publish({ status: 'error', deadline: null, mode: null }) }
    finally { this.locked = false }
  }
  async stop() {
    if (this.locked) return
    this.locked = true
    this.publish({ ...this.state, status: 'busy' })
    try {
      if (this.record?.mode === 'notification') await this.deps.cancel(this.record.id)
      await this.deps.write(null)
      this.record = null
      this.publish({ status: 'idle', deadline: null, mode: null })
    } catch { this.publish({ status: 'error', deadline: null, mode: null }) }
    finally { this.locked = false }
  }
}
