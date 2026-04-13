import { Hono } from 'hono'
import { prisma } from '../lib/prisma'

const router = new Hono()

// Get all incomes for a user
router.get('/user/:userId', async (c) => {
  const { userId } = c.req.param()
  const incomes = await prisma.income.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
  })
  return c.json(incomes)
})

// Get monthly summary for a user
router.get('/user/:userId/monthly-summary', async (c) => {
  const { userId } = c.req.param()
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const [totalIncome, recurringIncome, categoryBreakdown] = await Promise.all([
    prisma.income.aggregate({
      where: { userId, date: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
    }),
    prisma.income.aggregate({
      where: { userId, recurring: true, date: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
    }),
    prisma.income.groupBy({
      by: ['category'],
      where: { userId, date: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
      _count: true,
      orderBy: { _sum: { amount: 'desc' } },
    }),
  ])

  return c.json({
    totalIncome: totalIncome._sum.amount ?? 0,
    recurringIncome: recurringIncome._sum.amount ?? 0,
    categoryBreakdown: categoryBreakdown.map((c) => ({
      category: c.category,
      total: c._sum.amount ?? 0,
      count: c._count,
    })),
  })
})

// Create income
router.post('/', async (c) => {
  const body = await c.req.json()
  
  // Ensure date is a proper DateTime
  const dateValue = body.date.includes('T') ? new Date(body.date) : new Date(body.date + 'T00:00:00.000Z')
  
  const income = await prisma.income.create({
    data: {
      userId: body.userId,
      amount: body.amount,
      category: body.category,
      date: dateValue,
      recurring: body.recurring ?? false,
      note: body.note,
    },
  })
  return c.json(income, 201)
})

// Update income
router.patch('/:id', async (c) => {
  const body = await c.req.json()
  
  // Ensure date is a proper DateTime if provided
  const data: Record<string, unknown> = { ...body }
  if (body.date) {
    data.date = body.date.includes('T') ? new Date(body.date) : new Date(body.date + 'T00:00:00.000Z')
  }
  
  const income = await prisma.income.update({
    where: { id: c.req.param('id') },
    data,
  })
  return c.json(income)
})

// Delete income
router.delete('/:id', async (c) => {
  await prisma.income.delete({ where: { id: c.req.param('id') } })
  return c.json({ success: true })
})

export default router
