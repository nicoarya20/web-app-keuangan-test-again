import { Hono } from 'hono'
import { prisma } from '../lib/prisma'

const router = new Hono()

// ============================================================
// WALLETS
// ============================================================

// Get all wallets for a user (with transactions)
router.get('/user/:userId', async (c) => {
  const { userId } = c.req.param()
  const wallets = await prisma.wallet.findMany({
    where: { userId },
    include: {
      transactions: {
        orderBy: { date: 'desc' },
      },
    },
  })
  return c.json(wallets)
})

// Get total balance across all wallets
router.get('/user/:userId/total-balance', async (c) => {
  const { userId } = c.req.param()
  const result = await prisma.wallet.aggregate({
    where: { userId },
    _sum: { currentBalance: true },
    _count: true,
  })
  return c.json({
    totalBalance: result._sum.currentBalance ?? 0,
    walletCount: result._count,
  })
})

// Create wallet
router.post('/', async (c) => {
  const body = await c.req.json()
  const wallet = await prisma.wallet.create({
    data: {
      ...body,
      currentBalance: body.initialBalance ?? 0,
    },
  })
  return c.json(wallet, 201)
})

// Update wallet
router.patch('/:id', async (c) => {
  const body = await c.req.json()
  const wallet = await prisma.wallet.update({
    where: { id: c.req.param('id') },
    data: body,
  })
  return c.json(wallet)
})

// Delete wallet (cascades to transactions)
router.delete('/:id', async (c) => {
  await prisma.wallet.delete({ where: { id: c.req.param('id') } })
  return c.json({ success: true })
})

// ============================================================
// WALLET TRANSACTIONS
// ============================================================

// Create transaction + update balance atomically
router.post('/transactions', async (c) => {
  const body = await c.req.json()
  const { walletId, type, amount, note, date } = body

  // Ensure date is a proper DateTime
  const dateValue = date.includes('T') ? new Date(date) : new Date(date + 'T00:00:00.000Z')

  const result = await prisma.$transaction(async (tx) => {
    const transaction = await tx.walletTransaction.create({
      data: { walletId, type, amount, note, date: dateValue },
    })

    const balanceChange = type === 'TOPUP' ? amount : -amount
    const updatedWallet = await tx.wallet.update({
      where: { id: walletId },
      data: { currentBalance: { increment: balanceChange } },
    })

    return { transaction, wallet: updatedWallet }
  })

  return c.json(result, 201)
})

// Delete transaction (does NOT revert balance — caller must handle)
router.delete('/transactions/:id', async (c) => {
  const { id } = c.req.param()

  // Get transaction to know which wallet and type
  const tx = await prisma.walletTransaction.findUnique({ where: { id } })
  if (!tx) return c.json({ error: 'Transaction not found' }, 404)

  await prisma.$transaction(async (prismaTx) => {
    // Revert the balance
    const balanceChange = tx.type === 'TOPUP' ? -tx.amount : tx.amount
    await prismaTx.wallet.update({
      where: { id: tx.walletId },
      data: { currentBalance: { increment: balanceChange } },
    })

    // Delete the transaction
    await prismaTx.walletTransaction.delete({ where: { id } })
  })

  return c.json({ success: true })
})

export default router
