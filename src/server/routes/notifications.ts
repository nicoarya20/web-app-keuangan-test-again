import { Hono } from 'hono'
import { SignJWT } from 'jose'
import { db } from '../lib/db'
import { ensureTable } from '../lib/notifications'
import { authMiddleware } from '../middleware/auth'

const router = new Hono()
router.use('*', authMiddleware)

// GET / — list latest 50 notifications + unread count
router.get('/', async (c) => {
  const user = c.get('user')
  await ensureTable()

  const [listRes, countRes] = await Promise.all([
    db.query(
      `SELECT * FROM notifications WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT 50`,
      [user.id]
    ),
    db.query(
      `SELECT COUNT(*)::int AS count FROM notifications WHERE "userId" = $1 AND read = false`,
      [user.id]
    ),
  ])

  return c.json({ notifications: listRes.rows, unreadCount: countRes.rows[0].count })
})

// POST /read-all — mark all as read
router.post('/read-all', async (c) => {
  const user = c.get('user')
  await ensureTable()
  await db.query(
    `UPDATE notifications SET read = true WHERE "userId" = $1 AND read = false`,
    [user.id]
  )
  return c.json({ success: true })
})

// PATCH /:id/read — mark single notification as read
router.patch('/:id/read', async (c) => {
  const user = c.get('user')
  const { id } = c.req.param()
  await ensureTable()
  await db.query(
    `UPDATE notifications SET read = true WHERE id = $1 AND "userId" = $2`,
    [id, user.id]
  )
  return c.json({ success: true })
})

// DELETE /clear-all — hapus semua notifikasi user
router.delete('/clear-all', async (c) => {
  const user = c.get('user')
  await ensureTable()
  await db.query(`DELETE FROM notifications WHERE "userId" = $1`, [user.id])
  return c.json({ success: true })
})

// GET /token — mint a short-lived Supabase JWT for Realtime auth
router.get('/token', async (c) => {
  const user = c.get('user')
  const secret = process.env.SUPABASE_JWT_SECRET
  if (!secret) {
    return c.json({ error: 'Realtime not configured' }, 503)
  }

  const token = await new SignJWT({ role: 'authenticated' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(new TextEncoder().encode(secret))

  return c.json({ token })
})

export default router
