import { Hono } from 'hono'
import { prisma } from '../lib/prisma'

const router = new Hono()

// Get all budgets for a user
router.get('/user/:userId', async (c) => {
  const { userId } = c.req.param()
  const budgets = await prisma.budget.findMany({
    where: { userId },
  })
  return c.json(budgets)
})

// Get budget progress (budget vs actual spending this month)
router.get('/user/:userId/progress', async (c) => {
  const { userId } = c.req.param()
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const budgets = await prisma.budget.findMany({ where: { userId } })

  const progress = await Promise.all(
    budgets.map(async (budget) => {
      const spent = await prisma.expense.aggregate({
        where: {
          userId,
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
  const budget = await prisma.budget.upsert({
    where: {
      userId_category: {
        userId: body.userId,
        category: body.category,
      },
    },
    update: { amount: body.amount },
    create: body,
  })
  return c.json(budget)
})

// Delete budget
router.delete('/:id', async (c) => {
  await prisma.budget.delete({ where: { id: c.req.param('id') } })
  return c.json({ success: true })
})

export default router
