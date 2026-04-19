import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'

const router = new Hono()

router.use('*', authMiddleware)

// Get all budgets for a user
router.get('/', async (c) => {
  const user = c.get('user')
  const budgets = await prisma.budget.findMany({
    where: { userId: user.id },
  })
  return c.json(budgets)
})

// Get budget progress (budget vs actual spending this month)
router.get('/progress', async (c) => {
  const user = c.get('user')
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const budgets = await prisma.budget.findMany({ where: { userId: user.id } })

  const progress = await Promise.all(
    budgets.map(async (budget: any) => {
      const spent = await prisma.expense.aggregate({
        where: {
          userId: user.id,
          category: budget.category,
          date: { gte: startOfMonth, lte: endOfMonth },
        },
        _sum: { amount: true },
      })

      const amount = spent._sum.amount ?? 0
      const percentage = budget.amount > 0 ? (amount / budget.amount) * 100 : 0

      return {
        category: budget.category,
        budget: budget.amount,
        spent: amount,
        percentage: Number(percentage.toFixed(1)),
        remaining: budget.amount - amount,
        isOverBudget: percentage > 100,
        isWarning: percentage > 80 && percentage <= 100,
      }
    })
  )

  return c.json(progress)
})

// Create or update budget (upsert by userId + category)
router.post('/', async (c) => {
  const body = await c.req.json()
  const user = c.get('user')
  const budget = await prisma.budget.upsert({
    where: {
      userId_category: {
        userId: user.id,
        category: body.category,
      },
    },
    update: { amount: body.amount },
    create: {
      userId: user.id,
      category: body.category,
      amount: body.amount,
    },
  })
  return c.json(budget)
})

// Delete budget
router.delete('/:id', async (c) => {
  await prisma.budget.delete({ where: { id: c.req.param('id') } })
  return c.json({ success: true })
})

export default router
