import { Hono } from 'hono'
import { randomUUID } from 'crypto'
import { db } from '../lib/db'

const router = new Hono()

// Daftarkan /email/:email SEBELUM /:id agar tidak tertimpa param wildcard
router.get('/email/:email', async (c) => {
  const { rows } = await db.query(
    `SELECT id, email, name FROM users WHERE email = $1`,
    [c.req.param('email')]
  )
  if (!rows[0]) return c.json({ error: 'User not found' }, 404)
  return c.json(rows[0])
})

router.get('/:id', async (c) => {
  const { rows } = await db.query(
    `SELECT id, email, name, "telegramChatId" FROM users WHERE id = $1`,
    [c.req.param('id')]
  )
  if (!rows[0]) return c.json({ error: 'User not found' }, 404)
  return c.json(rows[0])
})

router.post('/', async (c) => {
  const body = await c.req.json()
  const id = randomUUID()
  const { rows } = await db.query(
    `INSERT INTO users (id, email, name, "emailVerified", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, false, NOW(), NOW())
     RETURNING id, email, name`,
    [id, body.email, body.name ?? null]
  )
  return c.json(rows[0], 201)
})

router.patch('/:id', async (c) => {
  const body = await c.req.json()
  const { id } = c.req.param()

  const fields: string[] = []
  const values: unknown[] = []
  let i = 1

  if (body.name !== undefined) { fields.push(`name = $${i++}`); values.push(body.name) }
  if (body.email !== undefined) { fields.push(`email = $${i++}`); values.push(body.email) }
  if (body.telegramChatId !== undefined) { fields.push(`"telegramChatId" = $${i++}`); values.push(body.telegramChatId || null) }

  if (fields.length === 0) return c.json({ error: 'No fields to update' }, 400)
  fields.push(`"updatedAt" = NOW()`)
  values.push(id)

  const { rows } = await db.query(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${i} RETURNING id, email, name, "telegramChatId"`,
    values
  )
  if (!rows[0]) return c.json({ error: 'User not found' }, 404)
  return c.json(rows[0])
})

router.delete('/:id', async (c) => {
  const { id } = c.req.param()
  const { rowCount } = await db.query(`DELETE FROM users WHERE id = $1`, [id])
  if (!rowCount) return c.json({ error: 'User not found' }, 404)
  return c.json({ success: true })
})

export default router
