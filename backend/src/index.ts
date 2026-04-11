import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { PrismaClient } from '@prisma/client'

const app = new Hono()
const prisma = new PrismaClient()

app.use('/*', cors({
  origin: 'http://localhost:5173',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

app.get('/', (c) => c.json({ message: '🚀 Backend Web-App Keuangan is running!' }))

// ============================================================
// INCOME
// ============================================================
app.get('/api/incomes/:userId', async (c) => {
  const { userId } = c.req.param()
  const incomes = await prisma.income.findMany({
    where: { userId },
    orderBy: { date: 'desc' }
  })
  return c.json(incomes)
})

app.post('/api/incomes', async (c) => {
  const body = await c.req.json()
  const income = await prisma.income.create({ data: body })
  return c.json(income, 201)
})

app.delete('/api/incomes/:id', async (c) => {
  const { id } = c.req.param()
  await prisma.income.delete({ where: { id } })
  return c.json({ success: true })
})

// ============================================================
// EXPENSE
// ============================================================
app.get('/api/expenses/:userId', async (c) => {
  const { userId } = c.req.param()
  const expenses = await prisma.expense.findMany({
    where: { userId },
    orderBy: { date: 'desc' }
  })
  return c.json(expenses)
})

app.post('/api/expenses', async (c) => {
  const body = await c.req.json()
  const expense = await prisma.expense.create({ data: body })
  return c.json(expense, 201)
})

app.delete('/api/expenses/:id', async (c) => {
  const { id } = c.req.param()
  await prisma.expense.delete({ where: { id } })
  return c.json({ success: true })
})

// ============================================================
// WALLET
// ============================================================
app.get('/api/wallets/:userId', async (c) => {
  const { userId } = c.req.param()
  const wallets = await prisma.wallet.findMany({
    where: { userId },
    include: { transactions: { orderBy: { date: 'desc' } } }
  })
  return c.json(wallets)
})

app.post('/api/wallets', async (c) => {
  const body = await c.req.json()
  const wallet = await prisma.wallet.create({ data: body })
  return c.json(wallet, 201)
})

app.delete('/api/wallets/:id', async (c) => {
  const { id } = c.req.param()
  await prisma.wallet.delete({ where: { id } })
  return c.json({ success: true })
})

// ============================================================
// WALLET TRANSACTION
// ============================================================
app.post('/api/wallet-transactions', async (c) => {
  const body = await c.req.json()
  const { walletId, type, amount, note, date } = body
  const tx = await prisma.$transaction(async (tx) => {
    const transaction = await tx.walletTransaction.create({
      data: { walletId, type, amount, note, date }
    })
    await tx.wallet.update({
      where: { id: walletId },
      data: {
        currentBalance: {
          increment: type === 'TOPUP' ? amount : -amount
        }
      }
    })
    return transaction
  })
  return c.json(tx, 201)
})

app.delete('/api/wallet-transactions/:id', async (c) => {
  const { id } = c.req.param()
  await prisma.walletTransaction.delete({ where: { id } })
  return c.json({ success: true })
})

// ============================================================
// SAVING
// ============================================================
app.get('/api/savings/:userId', async (c) => {
  const { userId } = c.req.param()
  const savings = await prisma.saving.findMany({
    where: { userId },
    orderBy: { date: 'desc' }
  })
  return c.json(savings)
})

app.post('/api/savings', async (c) => {
  const body = await c.req.json()
  const saving = await prisma.saving.create({ data: body })
  return c.json(saving, 201)
})

app.delete('/api/savings/:id', async (c) => {
  const { id } = c.req.param()
  await prisma.saving.delete({ where: { id } })
  return c.json({ success: true })
})

// ============================================================
// WISHLIST
// ============================================================
app.get('/api/wishlists/:userId', async (c) => {
  const { userId } = c.req.param()
  const wishlists = await prisma.wishlist.findMany({ where: { userId } })
  return c.json(wishlists)
})

app.post('/api/wishlists', async (c) => {
  const body = await c.req.json()
  const wishlist = await prisma.wishlist.create({ data: body })
  return c.json(wishlist, 201)
})

app.patch('/api/wishlists/:id', async (c) => {
  const { id } = c.req.param()
  const body = await c.req.json()
  const wishlist = await prisma.wishlist.update({ where: { id }, data: body })
  return c.json(wishlist)
})

app.delete('/api/wishlists/:id', async (c) => {
  const { id } = c.req.param()
  await prisma.wishlist.delete({ where: { id } })
  return c.json({ success: true })
})

// ============================================================
// BUDGET
// ============================================================
app.get('/api/budgets/:userId', async (c) => {
  const { userId } = c.req.param()
  const budgets = await prisma.budget.findMany({ where: { userId } })
  return c.json(budgets)
})

app.post('/api/budgets', async (c) => {
  const body = await c.req.json()
  const budget = await prisma.budget.upsert({
    where: { userId_category: { userId: body.userId, category: body.category } },
    update: { amount: body.amount },
    create: body
  })
  return c.json(budget)
})

app.delete('/api/budgets/:id', async (c) => {
  const { id } = c.req.param()
  await prisma.budget.delete({ where: { id } })
  return c.json({ success: true })
})

// ============================================================
// START SERVER
// ============================================================
serve({
  fetch: app.fetch,
  port: 3000,
}, (info) => {
  console.log(`🚀 Server running at http://localhost:${info.port}`)
})
