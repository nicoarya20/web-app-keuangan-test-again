import { createMiddleware } from 'hono/factory'
import { auth } from '../lib/auth'

// Extend Hono's context to include user
declare module 'hono' {
  interface ContextVariableMap {
    user: {
      id: string
      email: string
      name: string | null
    }
    session: {
      id: string
      userId: string
      expiresAt: Date
    }
  }
}

/**
 * Auth middleware — validates session and attaches user to context
 */
export const authMiddleware = createMiddleware(async (c, next) => {
  try {
    // Better Auth's getSession reads cookies from headers automatically
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    })

    if (!session) {
      return c.json({ error: 'Unauthorized: Invalid session' }, 401)
    }

    // Attach user and session to context
    c.set('user', {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
    })
    c.set('session', {
      id: session.session.id,
      userId: session.session.userId,
      expiresAt: session.session.expiresAt,
    })

    await next()
  } catch (error) {
    console.error('[Auth Middleware] Error:', error)
    return c.json({ error: 'Unauthorized: Invalid session' }, 401)
  }
})

/**
 * Optional auth middleware — attaches user if available but doesn't block if not
 */
export const optionalAuthMiddleware = createMiddleware(async (c, next) => {
  try {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    })

    if (session) {
      c.set('user', {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      })
      c.set('session', {
        id: session.session.id,
        userId: session.session.userId,
        expiresAt: session.session.expiresAt,
      })
    }
  } catch (error) {
    // Ignore errors for optional auth
  }

  await next()
})
