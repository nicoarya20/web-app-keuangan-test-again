import { Hono } from 'hono'
import { randomUUID } from 'crypto'
import { db } from '../lib/db'
import { withIdempotency } from '../lib/idempotency'
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
  return c.json(rows[0], 201)
  })
})

router.delete('/:id', async (c) => {
  const { id } = c.req.param()
  const { rowCount } = await db.query(`DELETE FROM savings WHERE id = $1`, [id])
  if (!rowCount) return c.json({ error: 'Record not found' }, 404)
  return c.json({ success: true })
})

export default router
