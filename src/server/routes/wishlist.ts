import { Hono } from 'hono'
import { randomUUID } from 'crypto'
import { db } from '../lib/db'
import { withIdempotency } from '../lib/idempotency'
import { authMiddleware } from '../middleware/auth'

const router = new Hono()
router.use('*', authMiddleware)

function parseDate(date?: string): Date {
  if (!date) return new Date()
  return date.includes('T') ? new Date(date) : new Date(date + 'T00:00:00.000Z')
}

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
  const user = c.get('user')
  return withIdempotency(c, user.id, async () => {
  const body = await c.req.json()
  const id = randomUUID()

  // Kalau walletId dikirim, pastikan wallet milik user ini (sumber default funding)
  if (body.walletId) {
    const { rows } = await db.query(
      `SELECT id FROM wallets WHERE id = $1 AND "userId" = $2`,
      [body.walletId, user.id]
    )
    if (!rows[0]) return c.json({ error: 'Wallet not found' }, 404)
  }

  const { rows } = await db.query(
    `INSERT INTO wishlists (id, "userId", name, "targetPrice", "currentProgress", priority, note, "walletId", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
     RETURNING *`,
    [id, user.id, body.name, body.targetPrice, body.currentProgress ?? 0, body.priority ?? 'MEDIUM', body.note ?? null, body.walletId ?? null]
  )
  return c.json(rows[0], 201)
  })
})

// PATCH: currentProgress SENGAJA tidak bisa diubah di sini — hanya lewat /fund
// supaya "currentProgress = tabungan awal + Σ WISHLIST_FUND" tetap konsisten.
router.patch('/:id', async (c) => {
  const body = await c.req.json()
  const { id } = c.req.param()
  const user = c.get('user')

  const fields: string[] = []
  const values: unknown[] = []
  let i = 1

  if (body.name !== undefined) { fields.push(`name = $${i++}`); values.push(body.name) }
  if (body.targetPrice !== undefined) { fields.push(`"targetPrice" = $${i++}`); values.push(body.targetPrice) }
  if (body.priority !== undefined) { fields.push(`priority = $${i++}`); values.push(body.priority) }
  if (body.note !== undefined) { fields.push(`note = $${i++}`); values.push(body.note) }
  if (body.walletId !== undefined) { fields.push(`"walletId" = $${i++}`); values.push(body.walletId) }

  if (fields.length === 0) return c.json({ error: 'No fields to update' }, 400)
  fields.push(`"updatedAt" = NOW()`)
  values.push(id)
  values.push(user.id)

  const { rows } = await db.query(
    `UPDATE wishlists SET ${fields.join(', ')} WHERE id = $${i++} AND "userId" = $${i} RETURNING *`,
    values
  )
  if (!rows[0]) return c.json({ error: 'Record not found' }, 404)
  return c.json(rows[0])
})

// FUND: tambah tabungan (delta) ke wishlist dengan mengurangi saldo wallet — atomic.
router.post('/:id/fund', async (c) => {
  const { id } = c.req.param()
  const body = await c.req.json()
  const user = c.get('user')
  const amount = Number(body.amount)
  const date = parseDate(body.date)

  if (!amount || amount <= 0) return c.json({ error: 'Invalid amount' }, 400)

  const client = await db.connect()
  try {
    await client.query('BEGIN')

    const { rows: [wishlist] } = await client.query(
      `SELECT * FROM wishlists WHERE id = $1 AND "userId" = $2 FOR UPDATE`,
      [id, user.id]
    )
    if (!wishlist) {
      await client.query('ROLLBACK')
      return c.json({ error: 'Record not found' }, 404)
    }

    const walletId = body.walletId ?? wishlist.walletId
    if (!walletId) {
      await client.query('ROLLBACK')
      return c.json({ error: 'Wallet is required' }, 400)
    }

    const { rows: [wallet] } = await client.query(
      `SELECT * FROM wallets WHERE id = $1 AND "userId" = $2 FOR UPDATE`,
      [walletId, user.id]
    )
    if (!wallet) {
      await client.query('ROLLBACK')
      return c.json({ error: 'Wallet not found' }, 404)
    }
    if (Number(wallet.currentBalance) < amount) {
      await client.query('ROLLBACK')
      return c.json({ error: 'Insufficient balance' }, 400)
    }

    // COALESCE: kalau wishlist belum punya wallet default, set wallet yang dipakai ini sebagai default
    const { rows: [updatedWishlist] } = await client.query(
      `UPDATE wishlists
       SET "currentProgress" = "currentProgress" + $1, "walletId" = COALESCE("walletId", $3), "updatedAt" = NOW()
       WHERE id = $2 RETURNING *`,
      [amount, id, walletId]
    )

    await client.query(
      `INSERT INTO wallet_transactions (id, "walletId", type, amount, note, date, "referenceId", "createdAt", "updatedAt")
       VALUES ($1, $2, 'WISHLIST_FUND', $3, $4, $5, $6, NOW(), NOW())`,
      [randomUUID(), walletId, amount, `Wishlist: ${wishlist.name}`, date, id]
    )

    const { rows: [updatedWallet] } = await client.query(
      `UPDATE wallets SET "currentBalance" = "currentBalance" - $1, "updatedAt" = NOW()
       WHERE id = $2 RETURNING *`,
      [amount, walletId]
    )

    await client.query('COMMIT')
    return c.json({ wishlist: updatedWishlist, wallet: updatedWallet })
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
})

// COMPLETE ("Sudah Dibeli"): barang sudah dibeli, uang memang keluar — JANGAN refund.
// Ledger tetap konsisten: saldo wallet tidak diubah, tx WISHLIST_FUND dipertahankan
// (hanya note-nya ditandai) sebagai bukti uang keluar. Lalu wishlist dihapus.
router.post('/:id/complete', async (c) => {
  const { id } = c.req.param()
  const user = c.get('user')

  const client = await db.connect()
  try {
    await client.query('BEGIN')

    const { rows: [wishlist] } = await client.query(
      `SELECT * FROM wishlists WHERE id = $1 AND "userId" = $2 FOR UPDATE`,
      [id, user.id]
    )
    if (!wishlist) {
      await client.query('ROLLBACK')
      return c.json({ error: 'Record not found' }, 404)
    }

    await client.query(
      `UPDATE wallet_transactions SET note = $1, "updatedAt" = NOW()
       WHERE "referenceId" = $2 AND type = 'WISHLIST_FUND'`,
      [`Dibeli: ${wishlist.name}`, id]
    )

    await client.query(`DELETE FROM wishlists WHERE id = $1 AND "userId" = $2`, [id, user.id])

    await client.query('COMMIT')
    return c.json({ success: true })
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
})

// CANCEL ("Batalkan") — juga dipakai DELETE: batal menabung, kembalikan semua dana
// WISHLIST_FUND ke wallet asalnya masing-masing, hapus tx, lalu hapus wishlist. Atomic.
async function cancelWishlist(id: string, userId: string) {
  const client = await db.connect()
  try {
    await client.query('BEGIN')

    const { rows: [wishlist] } = await client.query(
      `SELECT * FROM wishlists WHERE id = $1 AND "userId" = $2 FOR UPDATE`,
      [id, userId]
    )
    if (!wishlist) {
      await client.query('ROLLBACK')
      return { notFound: true }
    }

    // Refund semua funding ke wallet asalnya (agregat per wallet — aman untuk multi-wallet)
    await client.query(
      `UPDATE wallets w
       SET "currentBalance" = w."currentBalance" + agg.total, "updatedAt" = NOW()
       FROM (
         SELECT "walletId", SUM(amount) AS total
         FROM wallet_transactions
         WHERE "referenceId" = $1 AND type = 'WISHLIST_FUND'
         GROUP BY "walletId"
       ) agg
       WHERE w.id = agg."walletId" AND w."userId" = $2`,
      [id, userId]
    )

    await client.query(
      `DELETE FROM wallet_transactions WHERE "referenceId" = $1 AND type = 'WISHLIST_FUND'`,
      [id]
    )
    await client.query(`DELETE FROM wishlists WHERE id = $1 AND "userId" = $2`, [id, userId])

    await client.query('COMMIT')
    return { notFound: false }
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
}

router.post('/:id/cancel', async (c) => {
  const { id } = c.req.param()
  const user = c.get('user')
  const result = await cancelWishlist(id, user.id)
  if (result.notFound) return c.json({ error: 'Record not found' }, 404)
  return c.json({ success: true })
})

router.delete('/:id', async (c) => {
  const { id } = c.req.param()
  const user = c.get('user')
  const result = await cancelWishlist(id, user.id)
  if (result.notFound) return c.json({ error: 'Record not found' }, 404)
  return c.json({ success: true })
})

export default router
