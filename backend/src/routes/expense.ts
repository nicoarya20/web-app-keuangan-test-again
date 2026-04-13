import { Hono } from 'hono'
import { prisma } from '../lib/prisma'

const router = new Hono()

// Get all expenses for a user
router.get('/user/:userId', async (c) => {
  const { userId } = c.req.param()
  const expenses = await prisma.expense.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
  })
  return c.json(expenses)
})

// Get monthly summary with category breakdown for a user
router.get('/user/:userId/monthly-summary', async (c) => {
  const { userId } = c.req.param()
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const [totalExpense, categoryBreakdown, recentByCategory] = await Promise.all([
    prisma.expense.aggregate({
      where: { userId, date: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.expense.groupBy({
      by: ['category'],
      where: { userId, date: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
      _count: true,
      orderBy: { _sum: { amount: 'desc' } },
    }),
    prisma.expense.findMany({
      where: { userId, date: { gte: startOfMonth, lte: endOfMonth } },
      orderBy: { date: 'desc' },
      take: 5,
    }),
  ])

  return c.json({
    totalExpense: totalExpense._sum.amount ?? 0,
    transactionCount: totalExpense._count,
    categoryBreakdown: categoryBreakdown.map((c) => ({
      category: c.category,
      total: c._sum.amount ?? 0,
      count: c._count,
    })),
    recentTransactions: recentByCategory,
  })
})

// Create expense
router.post('/', async (c) => {
  const body = await c.req.json()
  
  // Ensure date is a proper DateTime
  const dateValue = body.date.includes('T') ? new Date(body.date) : new Date(body.date + 'T00:00:00.000Z')
  
  const expense = await prisma.expense.create({
    data: {
      userId: body.userId,
      amount: body.amount,
      category: body.category,
      date: dateValue,
      note: body.note,
      tags: body.tags ?? [],
    },
  })
  return c.json(expense, 201)
})

// Update expense
router.patch('/:id', async (c) => {
  const body = await c.req.json()
  
  // Ensure date is a proper DateTime if provided
  const data: Record<string, unknown> = { ...body }
  if (body.date) {
    data.date = body.date.includes('T') ? new Date(body.date) : new Date(body.date + 'T00:00:00.000Z')
  }
  
  const expense = await prisma.expense.update({
    where: { id: c.req.param('id') },
    data,
  })
  return c.json(expense)
})

// Delete expense
router.delete('/:id', async (c) => {
  await prisma.expense.delete({ where: { id: c.req.param('id') } })
  return c.json({ success: true })
})

export default router
