import { Hono } from 'hono'
import { prisma } from '../lib/prisma'

const router = new Hono()

// Get all wishlists for a user
router.get('/user/:userId', async (c) => {
  const { userId } = c.req.param()
  const wishlists = await prisma.wishlist.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })
  return c.json(wishlists)
})

// Get wishlist summary
router.get('/user/:userId/summary', async (c) => {
  const { userId } = c.req.param()

  const [totalTarget, totalSaved] = await Promise.all([
    prisma.wishlist.aggregate({
      where: { userId },
      _sum: { targetPrice: true },
      _count: true,
    }),
    prisma.wishlist.aggregate({
      where: { userId },
      _sum: { currentProgress: true },
    }),
  ])

  const target = totalTarget._sum.targetPrice ?? 0
  const saved = totalSaved._sum.currentProgress ?? 0

  return c.json({
    totalTargetValue: target,
    totalSaved: saved,
    progressPercent: target > 0 ? Number(((saved / target) * 100).toFixed(1)) : 0,
    itemCount: totalTarget._count,
  })
})

// Create wishlist
router.post('/', async (c) => {
  const body = await c.req.json()
  const wishlist = await prisma.wishlist.create({ data: body })
  return c.json(wishlist, 201)
})

// Update wishlist (partial update: progress, note, etc.)
router.patch('/:id', async (c) => {
  const body = await c.req.json()
  const wishlist = await prisma.wishlist.update({
    where: { id: c.req.param('id') },
    data: body,
  })
  return c.json(wishlist)
})

// Delete wishlist
router.delete('/:id', async (c) => {
  await prisma.wishlist.delete({ where: { id: c.req.param('id') } })
  return c.json({ success: true })
})

export default router
