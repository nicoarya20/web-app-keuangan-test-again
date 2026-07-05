import { Hono } from 'hono'
import { auth } from '../lib/auth'
import { authMiddleware } from '../middleware/auth'

const router = new Hono()

// ============================================================
// Better Auth Handler — handles all auth endpoints
// ============================================================
// POST /api/auth/sign-in/email — Login
// POST /api/auth/sign-up/email — Register
// POST /api/auth/sign-out — Logout
// GET  /api/auth/get-session — Get current session

// Intercept sign-in/social BEFORE calling auth.handler to isolate hang
router.post('/sign-in/social', async (c) => {
  process.stdout.write('[auth-debug] POST /sign-in/social intercepted\n')
  const body = await c.req.json().catch(() => null)
  process.stdout.write('[auth-debug] body: ' + JSON.stringify(body) + '\n')

  const deadline = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('sign-in/social timed out after 8s')), 8000)
  )
  try {
    const res = await Promise.race([auth.handler(c.req.raw.clone()), deadline])
    process.stdout.write('[auth-debug] sign-in/social done: ' + res.status + '\n')
    return res
  } catch (err: any) {
    process.stdout.write('[auth-debug] sign-in/social error: ' + err.message + '\n')
    return c.json({ error: err.message }, 500)
  }
})

router.on(['POST', 'GET'], '/*', async (c) => {
  return auth.handler(c.req.raw)
})

// ============================================================
// Get current user session (protected)
// ============================================================
router.get('/me', authMiddleware, async (c) => {
  const user = c.get('user')
  const session = c.get('session')
  
  return c.json({
    user,
    session,
  })
})

export default router
