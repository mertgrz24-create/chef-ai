// Staging diagnostics contain categories only, never provider messages or URLs.
export function providerFailure(operation: 'recipe', error: unknown) {
  if (process.env.MOBILE_ENVIRONMENT !== 'staging') return
  const status =
    error && typeof error === 'object' && 'status' in error
      ? error.status
      : undefined
  const model = process.env.GEMINI_MODEL ?? ''
  const message = error instanceof Error ? error.message : ''
  const reason = /high demand/i.test(message)
    ? 'high_demand'
    : /overload/i.test(message)
      ? 'overloaded'
      : /quota|resource.exhausted/i.test(message)
        ? 'quota'
        : /no longer available|not found/i.test(message)
          ? 'model_unavailable'
          : /api key|credential/i.test(message)
            ? 'credentials'
            : /timeout|abort/i.test(message)
              ? 'timeout'
              : 'unclassified'
  console.warn(
    JSON.stringify({
      event: 'staging_provider_failure',
      operation,
      reason,
      status:
        typeof status === 'number' &&
        Number.isInteger(status) &&
        status >= 100 &&
        status <= 599
          ? status
          : null,
      model: /^gemini-[a-z0-9.-]{1,80}$/.test(model) ? model : 'default',
    }),
  )
}
