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

router.on(['POST', 'GET'], '/*', (c) => {
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
