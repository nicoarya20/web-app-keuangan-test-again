import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'

const router = new Hono()

router.use('*', authMiddleware)

// Get all expenses for a user
router.get('/', async (c) => {
  const user = c.get('user')
  const expenses = await prisma.expense.findMany({
    where: { userId: user.id },
    orderBy: { date: 'desc' },
  })
  return c.json(expenses)
})

// Get monthly summary with category breakdown for a user
router.get('/monthly-summary', async (c) => {
  const user = c.get('user')
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const [totalExpense, categoryBreakdown, recentByCategory] = await Promise.all([
    prisma.expense.aggregate({
      where: { userId: user.id, date: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.expense.groupBy({
      by: ['category'],
      where: { userId: user.id, date: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
      _count: true,
      orderBy: { _sum: { amount: 'desc' } },
    }),
    prisma.expense.findMany({
      where: { userId: user.id, date: { gte: startOfMonth, lte: endOfMonth } },
      orderBy: { date: 'desc' },
      take: 5,
    }),
  ])

  return c.json({
    totalExpense: totalExpense._sum.amount ?? 0,
    transactionCount: totalExpense._count,
    categoryBreakdown: categoryBreakdown.map((item: any) => ({
      category: item.category,
      total: item._sum.amount ?? 0,
      count: item._count,
    })),
    recentTransactions: recentByCategory,
  })
})

// Create expense
router.post('/', async (c) => {
  const body = await c.req.json()
  const user = c.get('user')

  // Ensure date is a proper DateTime
  const dateValue = body.date.includes('T') ? new Date(body.date) : new Date(body.date + 'T00:00:00.000Z')

  const expense = await prisma.expense.create({
    data: {
      userId: user.id,
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
