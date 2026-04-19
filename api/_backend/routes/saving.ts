import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'

const router = new Hono()

router.use('*', authMiddleware)

// Get all savings for a user
router.get('/', async (c) => {
  const user = c.get('user')
  const savings = await prisma.saving.findMany({
    where: { userId: user.id },
    orderBy: { date: 'asc' },
  })
  return c.json(savings)
})

// Get savings summary with growth data
router.get('/summary', async (c) => {
  const user = c.get('user')

  const [totalSavings, totalInvestments, goalBreakdown, growthData] = await Promise.all([
    prisma.saving.aggregate({
      where: { userId: user.id, type: 'SAVING' },
      _sum: { amount: true },
    }),
    prisma.saving.aggregate({
      where: { userId: user.id, type: 'INVESTMENT' },
      _sum: { amount: true },
    }),
    prisma.saving.groupBy({
      by: ['goalName'],
      where: { userId: user.id },
      _sum: { amount: true },
    }),
    prisma.saving.findMany({
      where: { userId: user.id },
      orderBy: { date: 'asc' },
    }),
  ])

  // Compute cumulative growth
  let cumulative = 0
  const growth = growthData.map((s: any) => {
    cumulative += s.amount
    return { date: s.date.toISOString().split('T')[0], total: cumulative }
  })

  return c.json({
    totalSavings: totalSavings._sum.amount ?? 0,
    totalInvestments: totalInvestments._sum.amount ?? 0,
    totalAmount: (totalSavings._sum.amount ?? 0) + (totalInvestments._sum.amount ?? 0),
    goalBreakdown: goalBreakdown.map((g: any) => ({
      goalName: g.goalName,
      total: g._sum.amount ?? 0,
    })),
    growthData: growth,
  })
})

// Create saving
router.post('/', async (c) => {
  const body = await c.req.json()
  const user = c.get('user')

  // Ensure date is a proper DateTime
  const dateValue = body.date.includes('T') ? new Date(body.date) : new Date(body.date + 'T00:00:00.000Z')

  const saving = await prisma.saving.create({
    data: {
      userId: user.id,
      amount: body.amount,
      goalName: body.goalName,
      date: dateValue,
      type: body.type,
    },
  })
  return c.json(saving, 201)
})

// Delete saving
router.delete('/:id', async (c) => {
  await prisma.saving.delete({ where: { id: c.req.param('id') } })
  return c.json({ success: true })
})

export default router
