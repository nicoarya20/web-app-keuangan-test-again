import { Hono } from 'hono'
import { randomUUID } from 'crypto'
import { db } from '../lib/db'
import { withIdempotency } from '../lib/idempotency'
import { safeNotify } from '../lib/notifications'
import { authMiddleware } from '../middleware/auth'

const router = new Hono()
router.use('*', authMiddleware)

router.get('/', async (c) => {
  const user = c.get('user')
  const { rows } = await db.query(
    `SELECT * FROM savings WHERE "userId" = $1 ORDER BY date ASC`,
    [user.id]
  )
  return c.json(rows)
})

router.get('/summary', async (c) => {
  const user = c.get('user')

  const [savingsRes, investmentsRes, goalRes, growthRes] = await Promise.all([
    db.query(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM savings WHERE "userId" = $1 AND type = 'SAVING'`,
      [user.id]
    ),
    db.query(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM savings WHERE "userId" = $1 AND type = 'INVESTMENT'`,
      [user.id]
    ),
    db.query(
      `SELECT "goalName", SUM(amount)::int AS total FROM savings WHERE "userId" = $1 GROUP BY "goalName"`,
      [user.id]
    ),
    db.query(
      `SELECT date, amount FROM savings WHERE "userId" = $1 ORDER BY date ASC`,
      [user.id]
    ),
  ])

  let cumulative = 0
  const growthData = growthRes.rows.map((s: any) => {
    cumulative += s.amount
    return { date: new Date(s.date).toISOString().split('T')[0], total: cumulative }
  })

  const totalSavings = Number(savingsRes.rows[0].total)
  const totalInvestments = Number(investmentsRes.rows[0].total)

  return c.json({
    totalSavings,
    totalInvestments,
    totalAmount: totalSavings + totalInvestments,
    goalBreakdown: goalRes.rows,
    growthData,
  })
})

router.post('/', async (c) => {
  const user = c.get('user')
  return withIdempotency(c, user.id, async () => {
  const body = await c.req.json()
  const id = randomUUID()
  const date = body.date.includes('T') ? new Date(body.date) : new Date(body.date + 'T00:00:00.000Z')

  const { rows } = await db.query(
    `INSERT INTO savings (id, "userId", amount, "goalName", date, type, "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
     RETURNING *`,
    [id, user.id, body.amount, body.goalName, date, body.type]
  )
  await safeNotify(user.id, { entity: 'saving', action: 'create', entityId: id, meta: { amount: body.amount, goalName: body.goalName, type: body.type } })
  return c.json(rows[0], 201)
  })
})

router.patch('/:id', async (c) => {
  const { id } = c.req.param()
  const user = c.get('user')
  const body = await c.req.json()

  const fields: string[] = []
  const values: unknown[] = []
  let idx = 1

  if (body.amount !== undefined) { fields.push(`amount = $${idx++}`); values.push(body.amount) }
  if (body.goalName !== undefined) { fields.push(`"goalName" = $${idx++}`); values.push(body.goalName) }
  if (body.date !== undefined) {
    const date = body.date.includes('T') ? new Date(body.date) : new Date(body.date + 'T00:00:00.000Z')
    fields.push(`date = $${idx++}`); values.push(date)
  }
  if (body.type !== undefined) { fields.push(`type = $${idx++}`); values.push(body.type) }

  if (fields.length === 0) return c.json({ error: 'No fields to update' }, 400)

  fields.push(`"updatedAt" = NOW()`)
  values.push(id, user.id)

  const { rows } = await db.query(
    `UPDATE savings SET ${fields.join(', ')} WHERE id = $${idx++} AND "userId" = $${idx} RETURNING *`,
    values
  )
  if (!rows[0]) return c.json({ error: 'Record not found' }, 404)
  await safeNotify(user.id, { entity: 'saving', action: 'update', entityId: id, meta: { amount: rows[0].amount, goalName: rows[0].goalName } })
  return c.json(rows[0])
})

router.delete('/:id', async (c) => {
  const { id } = c.req.param()
  const user = c.get('user')
  const { rows: [saving] } = await db.query(`SELECT amount, "goalName" FROM savings WHERE id = $1`, [id])
  const { rowCount } = await db.query(`DELETE FROM savings WHERE id = $1`, [id])
  if (!rowCount) return c.json({ error: 'Record not found' }, 404)
  await safeNotify(user.id, { entity: 'saving', action: 'delete', entityId: id, meta: { amount: saving?.amount, goalName: saving?.goalName } })
  return c.json({ success: true })
})

export default router
