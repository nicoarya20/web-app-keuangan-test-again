import { Hono } from 'hono'
import { prisma } from '../lib/prisma'

const router = new Hono()

// Create user
router.post('/', async (c) => {
  const body = await c.req.json()
  const user = await prisma.user.create({ data: body })
  return c.json(user, 201)
})

// Get user by ID
router.get('/:id', async (c) => {
  const user = await prisma.user.findUnique({
    where: { id: c.req.param('id') },
  })
  if (!user) return c.json({ error: 'User not found' }, 404)
  return c.json(user)
})

// Get user by email
router.get('/email/:email', async (c) => {
  const user = await prisma.user.findUnique({
    where: { email: c.req.param('email') },
  })
  if (!user) return c.json({ error: 'User not found' }, 404)
  return c.json(user)
})

// Update user
router.patch('/:id', async (c) => {
  const body = await c.req.json()
  const user = await prisma.user.update({
    where: { id: c.req.param('id') },
    data: body,
  })
  return c.json(user)
})

// Delete user
router.delete('/:id', async (c) => {
  await prisma.user.delete({ where: { id: c.req.param('id') } })
  return c.json({ success: true })
})

export default router
