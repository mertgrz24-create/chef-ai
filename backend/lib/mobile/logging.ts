/** Keep database diagnostics bounded; never forward message/details/hint or contents. */
export function databaseFailure(error: unknown): { code: string } {
  const code = error && typeof error === 'object' && 'code' in error ? error.code : null
  return { code: typeof code === 'string' && /^(?:[0-9A-Z]{5}|PGRST[0-9]{3})$/.test(code) ? code : 'database_error' }
}
