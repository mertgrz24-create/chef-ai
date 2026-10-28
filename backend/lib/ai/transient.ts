type Clock = {
  now: () => number
  wait: (ms: number) => Promise<void>
  random: () => number
}
const clock: Clock = {
  now: Date.now,
  wait: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  random: Math.random,
}

// Staging opt-in only. A definite provider 503 is a failed response, not an
// uncertain network outcome. At most two provider calls share one time budget
// and the caller's existing durable operation/idempotency record.
export async function recoverProvider503<T>(
  call: (timeoutMs: number) => Promise<T>,
  timing: Clock = clock,
): Promise<T> {
  const started = timing.now()
  const budget = 110000
  try {
    return await call(budget)
  } catch (error) {
    const status =
      error && typeof error === 'object' && 'status' in error
        ? error.status
        : undefined
    if (
      process.env.MOBILE_ENVIRONMENT !== 'staging' ||
      process.env.GEMINI_RETRY_503 !== 'true' ||
      status !== 503
    )
      throw error
    const delay = 2000 + Math.floor(timing.random() * 1000)
    if (budget - (timing.now() - started) < delay + 8000) throw error
    await timing.wait(delay)
    const remaining = budget - (timing.now() - started)
    if (remaining < 8000) throw error
    return call(remaining)
  }
}
