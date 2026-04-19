import type { MiddlewareHandler } from 'hono'

export const errorHandler: MiddlewareHandler = async (c, next) => {
  try {
    await next()
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'

    if (message.includes('Record to update or delete not found')) {
      return c.json({ error: 'Record not found' }, 404)
    }

    if (message.includes('Unique constraint failed')) {
      return c.json({ error: 'Duplicate record' }, 409)
    }

    console.error(`[Error] ${message}`)
    return c.json({ error: message }, 500)
  }
}
