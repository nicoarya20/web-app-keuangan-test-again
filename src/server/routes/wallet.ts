import { Hono } from 'hono'
import { randomUUID } from 'crypto'
import { db } from '../lib/db'
import { authMiddleware } from '../middleware/auth'

const router = new Hono()
router.use('*', authMiddleware)

// ============================================================
// WALLETS
// ============================================================

router.get('/', async (c) => {
  const user = c.get('user')

  const { rows: wallets } = await db.query(
    `SELECT * FROM wallets WHERE "userId" = $1 ORDER BY "createdAt" DESC`,
    [user.id]
  )
  if (wallets.length === 0) return c.json([])

  const walletIds = wallets.map((w: any) => w.id)
  const { rows: txs } = await db.query(
    `SELECT * FROM wallet_transactions WHERE "walletId" = ANY($1::text[]) ORDER BY date DESC`,
    [walletIds]
  )

  const result = wallets.map((w: any) => ({
    ...w,
    transactions: txs.filter((t: any) => t.walletId === w.id),
  }))
  return c.json(result)
})

router.get('/total-balance', async (c) => {
  const user = c.get('user')
  const { rows } = await db.query(
    `SELECT COALESCE(SUM("currentBalance"), 0) AS total, COUNT(*)::int AS count
     FROM wallets WHERE "userId" = $1`,
    [user.id]
  )
  return c.json({
    totalBalance: Number(rows[0].total),
    walletCount: rows[0].count,
  })
})

router.post('/', async (c) => {
  const body = await c.req.json()
  const user = c.get('user')
  const id = randomUUID()
  const initialBalance = body.initialBalance ?? 0

  const { rows } = await db.query(
    `INSERT INTO wallets (id, "userId", name, "walletType", "initialBalance", "currentBalance", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $5, NOW(), NOW())
     RETURNING *`,
    [id, user.id, body.name, body.walletType, initialBalance]
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
  if (body.walletType !== undefined) { fields.push(`"walletType" = $${i++}`); values.push(body.walletType) }
  if (body.currentBalance !== undefined) { fields.push(`"currentBalance" = $${i++}`); values.push(body.currentBalance) }

  if (fields.length === 0) return c.json({ error: 'No fields to update' }, 400)
  fields.push(`"updatedAt" = NOW()`)
  values.push(id)

  const { rows } = await db.query(
    `UPDATE wallets SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
    values
  )
  if (!rows[0]) return c.json({ error: 'Wallet not found' }, 404)
  return c.json(rows[0])
})

router.delete('/:id', async (c) => {
  const { id } = c.req.param()
  const { rowCount } = await db.query(`DELETE FROM wallets WHERE id = $1`, [id])
  if (!rowCount) return c.json({ error: 'Wallet not found' }, 404)
  return c.json({ success: true })
})

// ============================================================
// WALLET TRANSACTIONS — atomic via BEGIN/FOR UPDATE/COMMIT
// ============================================================

router.post('/transactions', async (c) => {
  const body = await c.req.json()
  const user = c.get('user')
  const { walletId, type, amount, note, date } = body
  const txId = randomUUID()
  const dateValue = date.includes('T') ? new Date(date) : new Date(date + 'T00:00:00.000Z')

  const client = await db.connect()
  try {
    await client.query('BEGIN')

    // Lock wallet row — cegah race condition
    const { rows: [wallet] } = await client.query(
      `SELECT * FROM wallets WHERE id = $1 AND "userId" = $2 FOR UPDATE`,
      [walletId, user.id]
    )
    if (!wallet) {
      await client.query('ROLLBACK')
      return c.json({ error: 'Wallet not found' }, 404)
    }

    // Hanya EWALLET yang boleh saldo minus (utang berjalan). CASH & BANK direm.
    if (type === 'EXPENSE' && wallet.walletType !== 'EWALLET' && Number(wallet.currentBalance) - amount < 0) {
      await client.query('ROLLBACK')
      return c.json({ error: 'Insufficient balance' }, 400)
    }

    const { rows: [tx] } = await client.query(
      `INSERT INTO wallet_transactions (id, "walletId", type, amount, note, date, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING *`,
      [txId, walletId, type, amount, note ?? null, dateValue]
    )

    const balanceChange = type === 'TOPUP' ? amount : -amount
    const { rows: [updatedWallet] } = await client.query(
      `UPDATE wallets SET "currentBalance" = "currentBalance" + $1, "updatedAt" = NOW()
       WHERE id = $2 RETURNING *`,
      [balanceChange, walletId]
    )

    await client.query('COMMIT')
    return c.json({ transaction: tx, wallet: updatedWallet }, 201)
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
})

router.post('/transfer', async (c) => {
  const body = await c.req.json()
  const user = c.get('user')
  const { fromWalletId, toWalletId, amount, note, date } = body

  if (fromWalletId === toWalletId)
    return c.json({ error: 'Cannot transfer to the same wallet' }, 400)
  if (!amount || amount <= 0)
    return c.json({ error: 'Invalid amount' }, 400)

  const dateValue = date.includes('T') ? new Date(date) : new Date(date + 'T00:00:00.000Z')

  const client = await db.connect()
  try {
    await client.query('BEGIN')

    const { rows: [fromWallet] } = await client.query(
      `SELECT * FROM wallets WHERE id = $1 AND "userId" = $2 FOR UPDATE`,
      [fromWalletId, user.id]
    )
    if (!fromWallet) {
      await client.query('ROLLBACK')
      return c.json({ error: 'Source wallet not found' }, 404)
    }
    // Hanya EWALLET yang boleh saldo minus (utang berjalan). CASH & BANK direm.
    if (fromWallet.walletType !== 'EWALLET' && Number(fromWallet.currentBalance) < amount) {
      await client.query('ROLLBACK')
      return c.json({ error: 'Insufficient balance' }, 400)
    }

    const { rows: [toWallet] } = await client.query(
      `SELECT * FROM wallets WHERE id = $1 AND "userId" = $2 FOR UPDATE`,
      [toWalletId, user.id]
    )
    if (!toWallet) {
      await client.query('ROLLBACK')
      return c.json({ error: 'Destination wallet not found' }, 404)
    }

    await client.query(
      `INSERT INTO wallet_transactions (id, "walletId", type, amount, note, date, "createdAt", "updatedAt")
       VALUES ($1, $2, 'TRANSFER_OUT', $3, $4, $5, NOW(), NOW())`,
      [randomUUID(), fromWalletId, amount, note ?? null, dateValue]
    )
    await client.query(
      `INSERT INTO wallet_transactions (id, "walletId", type, amount, note, date, "createdAt", "updatedAt")
       VALUES ($1, $2, 'TRANSFER_IN', $3, $4, $5, NOW(), NOW())`,
      [randomUUID(), toWalletId, amount, note ?? null, dateValue]
    )

    const { rows: [updatedFrom] } = await client.query(
      `UPDATE wallets SET "currentBalance" = "currentBalance" - $1, "updatedAt" = NOW() WHERE id = $2 RETURNING *`,
      [amount, fromWalletId]
    )
    const { rows: [updatedTo] } = await client.query(
      `UPDATE wallets SET "currentBalance" = "currentBalance" + $1, "updatedAt" = NOW() WHERE id = $2 RETURNING *`,
      [amount, toWalletId]
    )

    await client.query('COMMIT')
    return c.json({ fromWallet: updatedFrom, toWallet: updatedTo }, 201)
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
})

router.delete('/transactions/:id', async (c) => {
  const { id } = c.req.param()
  const user = c.get('user')

  const client = await db.connect()
  try {
    await client.query('BEGIN')

    // JOIN ke wallets untuk verifikasi ownership (cegah IDOR) + lock kedua row
    const { rows: [tx] } = await client.query(
      `SELECT wt.* FROM wallet_transactions wt
       JOIN wallets w ON wt."walletId" = w.id
       WHERE wt.id = $1 AND w."userId" = $2 FOR UPDATE`,
      [id, user.id]
    )
    if (!tx) {
      await client.query('ROLLBACK')
      return c.json({ error: 'Transaction not found' }, 404)
    }

    // Revert balance
    const balanceChange = tx.type === 'TOPUP' ? -tx.amount : tx.amount
    await client.query(
      `UPDATE wallets SET "currentBalance" = "currentBalance" + $1, "updatedAt" = NOW() WHERE id = $2`,
      [balanceChange, tx.walletId]
    )

    // Reverse efek pada record sumber, kalau tx ini berasal dari salah satunya
    if (tx.referenceId) {
      if (tx.type === 'TOPUP') {
        await client.query(`DELETE FROM incomes WHERE id = $1`, [tx.referenceId])
      } else if (tx.type === 'EXPENSE') {
        await client.query(`DELETE FROM expenses WHERE id = $1`, [tx.referenceId])
      } else if (tx.type === 'WISHLIST_FUND') {
        // Kurangi progress wishlist sebesar funding yang dibatalkan (kalau wishlist masih ada)
        await client.query(
          `UPDATE wishlists SET "currentProgress" = GREATEST(0, "currentProgress" - $1), "updatedAt" = NOW()
           WHERE id = $2 AND "userId" = $3`,
          [tx.amount, tx.referenceId, user.id]
        )
      }
    }

    await client.query(`DELETE FROM wallet_transactions WHERE id = $1`, [id])

    await client.query('COMMIT')
    return c.json({ success: true })
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
})

export default router
