import { Hono } from 'hono'
import { randomUUID } from 'crypto'
import { db } from '../lib/db'
import { authMiddleware } from '../middleware/auth'

const router = new Hono()
router.use('*', authMiddleware)

router.get('/', async (c) => {
  const user = c.get('user')
  const { rows } = await db.query(
    `SELECT * FROM wishlists WHERE "userId" = $1 ORDER BY "createdAt" DESC`,
    [user.id]
  )
  return c.json(rows)
})

router.get('/summary', async (c) => {
  const user = c.get('user')
  const { rows } = await db.query(
    `SELECT
       COALESCE(SUM("targetPrice"), 0) AS "totalTargetValue",
       COALESCE(SUM("currentProgress"), 0) AS "totalSaved",
       COUNT(*)::int AS "itemCount"
     FROM wishlists WHERE "userId" = $1`,
    [user.id]
  )
  const r = rows[0]
  const target = Number(r.totalTargetValue)
  const saved = Number(r.totalSaved)
  return c.json({
    totalTargetValue: target,
    totalSaved: saved,
    progressPercent: target > 0 ? Number(((saved / target) * 100).toFixed(1)) : 0,
    itemCount: r.itemCount,
  })
})

router.post('/', async (c) => {
  const body = await c.req.json()
  const user = c.get('user')
  const id = randomUUID()

  const { rows } = await db.query(
    `INSERT INTO wishlists (id, "userId", name, "targetPrice", "currentProgress", priority, note, "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
     RETURNING *`,
    [id, user.id, body.name, body.targetPrice, body.currentProgress ?? 0, body.priority ?? 'MEDIUM', body.note ?? null]
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
  if (body.targetPrice !== undefined) { fields.push(`"targetPrice" = $${i++}`); values.push(body.targetPrice) }
  if (body.currentProgress !== undefined) { fields.push(`"currentProgress" = $${i++}`); values.push(body.currentProgress) }
  if (body.priority !== undefined) { fields.push(`priority = $${i++}`); values.push(body.priority) }
  if (body.note !== undefined) { fields.push(`note = $${i++}`); values.push(body.note) }

  if (fields.length === 0) return c.json({ error: 'No fields to update' }, 400)
  fields.push(`"updatedAt" = NOW()`)
  values.push(id)

  const { rows } = await db.query(
    `UPDATE wishlists SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
    values
  )
  if (!rows[0]) return c.json({ error: 'Record not found' }, 404)
  return c.json(rows[0])
})

router.delete('/:id', async (c) => {
  const { id } = c.req.param()
  const { rowCount } = await db.query(`DELETE FROM wishlists WHERE id = $1`, [id])
  if (!rowCount) return c.json({ error: 'Record not found' }, 404)
  return c.json({ success: true })
})

export default router
