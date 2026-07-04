import { Hono } from 'hono'
import { randomUUID } from 'crypto'
import { db } from '../lib/db'
import { authMiddleware } from '../middleware/auth'

const router = new Hono()
router.use('*', authMiddleware)

router.get('/', async (c) => {
  const user = c.get('user')
  const { rows } = await db.query(
    `SELECT * FROM expenses WHERE "userId" = $1 ORDER BY date DESC`,
    [user.id]
  )
  return c.json(rows)
})

router.get('/monthly-summary', async (c) => {
  const user = c.get('user')
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const [totalRes, categoryRes, recentRes] = await Promise.all([
    db.query(
      `SELECT COALESCE(SUM(amount), 0) AS total, COUNT(*)::int AS count
       FROM expenses WHERE "userId" = $1 AND date >= $2 AND date <= $3`,
      [user.id, start, end]
    ),
    db.query(
      `SELECT category, SUM(amount)::int AS total, COUNT(*)::int AS count
       FROM expenses WHERE "userId" = $1 AND date >= $2 AND date <= $3
       GROUP BY category ORDER BY total DESC`,
      [user.id, start, end]
    ),
    db.query(
      `SELECT * FROM expenses WHERE "userId" = $1 AND date >= $2 AND date <= $3
       ORDER BY date DESC LIMIT 5`,
      [user.id, start, end]
    ),
  ])

  return c.json({
    totalExpense: Number(totalRes.rows[0].total),
    transactionCount: totalRes.rows[0].count,
    categoryBreakdown: categoryRes.rows,
    recentTransactions: recentRes.rows,
  })
})

router.post('/', async (c) => {
  const body = await c.req.json()
  const user = c.get('user')
  const id = randomUUID()
  const date = body.date.includes('T') ? new Date(body.date) : new Date(body.date + 'T00:00:00.000Z')

  const { rows } = await db.query(
    `INSERT INTO expenses (id, "userId", amount, category, date, note, tags, "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
     RETURNING *`,
    [id, user.id, body.amount, body.category, date, body.note ?? null, body.tags ?? []]
  )
  return c.json(rows[0], 201)
})

router.patch('/:id', async (c) => {
  const body = await c.req.json()
  const { id } = c.req.param()

  const fields: string[] = []
  const values: unknown[] = []
  let i = 1

  if (body.amount !== undefined) { fields.push(`amount = $${i++}`); values.push(body.amount) }
  if (body.category !== undefined) { fields.push(`category = $${i++}`); values.push(body.category) }
  if (body.date !== undefined) {
    const d = body.date.includes('T') ? new Date(body.date) : new Date(body.date + 'T00:00:00.000Z')
    fields.push(`date = $${i++}`); values.push(d)
  }
  if (body.note !== undefined) { fields.push(`note = $${i++}`); values.push(body.note) }
  if (body.tags !== undefined) { fields.push(`tags = $${i++}`); values.push(body.tags) }

  if (fields.length === 0) return c.json({ error: 'No fields to update' }, 400)
  fields.push(`"updatedAt" = NOW()`)
  values.push(id)

  const { rows } = await db.query(
    `UPDATE expenses SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
    values
  )
  if (!rows[0]) return c.json({ error: 'Record not found' }, 404)
  return c.json(rows[0])
})

router.delete('/:id', async (c) => {
  const { id } = c.req.param()
  const { rowCount } = await db.query(`DELETE FROM expenses WHERE id = $1`, [id])
  if (!rowCount) return c.json({ error: 'Record not found' }, 404)
  return c.json({ success: true })
})

export default router
