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

router.on(['POST', 'GET'], '/*', async (c) => {
  const path = c.req.path
  console.log('[auth] handling:', c.req.method, path)
  const deadline = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`auth handler timed out after 8s: ${path}`)), 8000)
  )
  try {
    const res = await Promise.race([auth.handler(c.req.raw), deadline])
    console.log('[auth] done:', c.req.method, path, res.status)
    return res
  } catch (err: any) {
    console.error('[auth] error:', err.message)
    return c.json({ error: err.message }, 500)
  }
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
