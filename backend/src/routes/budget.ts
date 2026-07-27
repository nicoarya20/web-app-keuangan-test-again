import { Hono } from 'hono'
import { randomUUID } from 'crypto'
import { db } from '../lib/db'
import { safeNotify } from '../lib/notifications'
import { authMiddleware } from '../middleware/auth'

const router = new Hono()
router.use('*', authMiddleware)

router.get('/', async (c) => {
  const user = c.get('user')
  const { rows } = await db.query(
    `SELECT * FROM budgets WHERE "userId" = $1`,
    [user.id]
  )
  return c.json(rows)
})

router.get('/progress', async (c) => {
  const user = c.get('user')
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const { rows: budgets } = await db.query(
    `SELECT * FROM budgets WHERE "userId" = $1`,
    [user.id]
  )

  // Satu query untuk semua pengeluaran per kategori bulan ini
  const { rows: spentRows } = await db.query(
    `SELECT category, COALESCE(SUM(amount), 0)::int AS spent
     FROM expenses
     WHERE "userId" = $1 AND date >= $2 AND date <= $3
     GROUP BY category`,
    [user.id, start, end]
  )
  const spentMap = new Map(spentRows.map((r: any) => [r.category, r.spent]))

  const progress = budgets.map((budget: any) => {
    const spent = Number(spentMap.get(budget.category) ?? 0)
    const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0
    return {
      category: budget.category,
      budget: budget.amount,
      spent,
      percentage: Number(percentage.toFixed(1)),
      remaining: budget.amount - spent,
      isOverBudget: percentage > 100,
      isWarning: percentage > 80 && percentage <= 100,
    }
  })

  return c.json(progress)
})

// Upsert: insert atau update kalau (userId, category) sudah ada
router.post('/', async (c) => {
  const body = await c.req.json()
  const user = c.get('user')

  const { rows } = await db.query(
    `INSERT INTO budgets (id, "userId", category, amount, "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, NOW(), NOW())
     ON CONFLICT ("userId", category)
     DO UPDATE SET amount = EXCLUDED.amount, "updatedAt" = NOW()
     RETURNING *`,
    [randomUUID(), user.id, body.category, body.amount]
  )
  await safeNotify(user.id, { entity: 'budget', action: 'create', entityId: rows[0].id, meta: { category: body.category, amount: body.amount } })
  return c.json(rows[0])
})

router.delete('/:id', async (c) => {
  const { id } = c.req.param()
  const user = c.get('user')
  const { rows: [budget] } = await db.query(`SELECT category, amount FROM budgets WHERE id = $1`, [id])
  const { rowCount } = await db.query(`DELETE FROM budgets WHERE id = $1`, [id])
  if (!rowCount) return c.json({ error: 'Record not found' }, 404)
  await safeNotify(user.id, { entity: 'budget', action: 'delete', entityId: id, meta: { category: budget?.category, amount: budget?.amount } })
  return c.json({ success: true })
})

export default router
