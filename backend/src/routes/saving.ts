import { Hono } from 'hono'
import { prisma } from '../lib/prisma'

const router = new Hono()

// Get all savings for a user
router.get('/user/:userId', async (c) => {
  const { userId } = c.req.param()
  const savings = await prisma.saving.findMany({
    where: { userId },
    orderBy: { date: 'asc' },
  })
  return c.json(savings)
})

// Get savings summary with growth data
router.get('/user/:userId/summary', async (c) => {
  const { userId } = c.req.param()

  const [totalSavings, totalInvestments, goalBreakdown, growthData] = await Promise.all([
    prisma.saving.aggregate({
      where: { userId, type: 'SAVING' },
      _sum: { amount: true },
    }),
    prisma.saving.aggregate({
      where: { userId, type: 'INVESTMENT' },
      _sum: { amount: true },
    }),
    prisma.saving.groupBy({
      by: ['goalName'],
      where: { userId },
      _sum: { amount: true },
    }),
    prisma.saving.findMany({
      where: { userId },
      orderBy: { date: 'asc' },
    }),
  ])

  // Compute cumulative growth
  let cumulative = 0
  const growth = growthData.map((s) => {
    cumulative += s.amount
    return { date: s.date.toISOString().split('T')[0], total: cumulative }
  })

  return c.json({
    totalSavings: totalSavings._sum.amount ?? 0,
    totalInvestments: totalInvestments._sum.amount ?? 0,
    totalAmount: (totalSavings._sum.amount ?? 0) + (totalInvestments._sum.amount ?? 0),
    goalBreakdown: goalBreakdown.map((g) => ({
      goalName: g.goalName,
      total: g._sum.amount ?? 0,
    })),
    growthData: growth,
  })
})

// Create saving
router.post('/', async (c) => {
  const body = await c.req.json()
  const saving = await prisma.saving.create({ data: body })
  return c.json(saving, 201)
})

// Delete saving
router.delete('/:id', async (c) => {
  await prisma.saving.delete({ where: { id: c.req.param('id') } })
  return c.json({ success: true })
})

export default router
