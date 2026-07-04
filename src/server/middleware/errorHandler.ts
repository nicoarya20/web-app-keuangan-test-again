import type { MiddlewareHandler } from 'hono'

export const errorHandler: MiddlewareHandler = async (c, next) => {
  try {
    await next()
  } catch (error: unknown) {
    const e = error as { code?: string; message?: string }

    // pg error codes
    if (e.code === '23505') return c.json({ error: 'Duplicate record' }, 409)
    if (e.code === '23503') return c.json({ error: 'Record not found (foreign key violation)' }, 404)
    if (e.code === '23502') return c.json({ error: 'Missing required field' }, 400)

    const message = error instanceof Error ? error.message : 'Internal server error'
    console.error(`[Error] ${e.code ?? ''} ${message}`)
    return c.json({ error: message }, 500)
  }
}
