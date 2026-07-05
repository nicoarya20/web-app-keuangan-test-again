import { Hono } from 'hono'
import { auth } from '../lib/auth'
import { authMiddleware } from '../middleware/auth'

const router = new Hono()

router.on(['POST', 'GET'], '/*', (c) => {
  return auth.handler(c.req.raw)
})

router.get('/me', authMiddleware, async (c) => {
  const user = c.get('user')
  const session = c.get('session')
  return c.json({ user, session })
})

export default router
