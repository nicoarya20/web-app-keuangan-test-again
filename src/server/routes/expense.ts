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
  const user = c.get('user')
  return withIdempotency(c, user.id, async () => {
  const body = await c.req.json()
  const id = randomUUID()
  const date = body.date.includes('T') ? new Date(body.date) : new Date(body.date + 'T00:00:00.000Z')

  if (body.walletId) {
    const client = await db.connect()
    try {
      await client.query('BEGIN')

      const { rows: [wallet] } = await client.query(
        `SELECT * FROM wallets WHERE id = $1 AND "userId" = $2 FOR UPDATE`,
        [body.walletId, user.id]
      )
      if (!wallet) {
        await client.query('ROLLBACK')
        return c.json({ error: 'Wallet not found' }, 404)
      }
      // Hanya EWALLET yang boleh saldo minus (utang berjalan). CASH & BANK direm.
      if (wallet.walletType !== 'EWALLET' && Number(wallet.currentBalance) < body.amount) {
        await client.query('ROLLBACK')
        return c.json({ error: 'Insufficient balance' }, 400)
      }

      const { rows } = await client.query(
        `INSERT INTO expenses (id, "userId", amount, category, date, note, tags, "walletId", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
         RETURNING *`,
        [id, user.id, body.amount, body.category, date, body.note ?? null, body.tags ?? [], body.walletId]
      )

      await client.query(
        `INSERT INTO wallet_transactions (id, "walletId", type, amount, note, date, "referenceId", "createdAt", "updatedAt")
         VALUES ($1, $2, 'EXPENSE', $3, $4, $5, $6, NOW(), NOW())`,
        [randomUUID(), body.walletId, body.amount, body.note ?? null, date, id]
      )

      await client.query(
        `UPDATE wallets SET "currentBalance" = "currentBalance" - $1, "updatedAt" = NOW() WHERE id = $2`,
        [body.amount, body.walletId]
      )

      await client.query('COMMIT')
      await safeNotify(user.id, { entity: 'expense', action: 'create', entityId: id, meta: { amount: body.amount, category: body.category } })
      return c.json(rows[0], 201)
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }
  }

  const { rows } = await db.query(
    `INSERT INTO expenses (id, "userId", amount, category, date, note, tags, "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
     RETURNING *`,
    [id, user.id, body.amount, body.category, date, body.note ?? null, body.tags ?? []]
  )
  await safeNotify(user.id, { entity: 'expense', action: 'create', entityId: id, meta: { amount: body.amount, category: body.category } })
  return c.json(rows[0], 201)
  })
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
  const user = c.get('user')
  await safeNotify(user.id, { entity: 'expense', action: 'update', entityId: id, meta: { amount: rows[0].amount, category: rows[0].category } })
  return c.json(rows[0])
})

router.delete('/:id', async (c) => {
  const { id } = c.req.param()
  const user = c.get('user')

  const { rows: [expense] } = await db.query(`SELECT * FROM expenses WHERE id = $1`, [id])
  if (!expense) return c.json({ error: 'Record not found' }, 404)

  if (expense.walletId) {
    const client = await db.connect()
    try {
      await client.query('BEGIN')
      await client.query(`DELETE FROM expenses WHERE id = $1`, [id])
      await client.query(
        `DELETE FROM wallet_transactions WHERE "referenceId" = $1`,
        [id]
      )
      await client.query(
        `UPDATE wallets SET "currentBalance" = "currentBalance" + $1, "updatedAt" = NOW() WHERE id = $2`,
        [expense.amount, expense.walletId]
      )
      await client.query('COMMIT')
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }
  } else {
    await db.query(`DELETE FROM expenses WHERE id = $1`, [id])
  }

  await safeNotify(user.id, { entity: 'expense', action: 'delete', entityId: id, meta: { amount: expense.amount, category: expense.category } })
  return c.json({ success: true })
})

export default router
