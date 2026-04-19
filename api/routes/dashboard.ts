import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'

const router = new Hono()

router.use('*', authMiddleware)

// Get full dashboard data for a user
router.get('/', async (c) => {
  const user = c.get('user')
  const userId = user.id
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const [
    monthlyIncomes,
    monthlyExpenses,
    totalSavings,
    totalWalletBalance,
    expensesByCategory,
    recentTransactions,
  ] = await Promise.all([
    // Monthly incomes
    prisma.income.findMany({
      where: { userId, date: { gte: startOfMonth, lte: endOfMonth } },
      orderBy: { date: 'desc' },
    }),
    // Monthly expenses
    prisma.expense.findMany({
      where: { userId, date: { gte: startOfMonth, lte: endOfMonth } },
      orderBy: { date: 'desc' },
    }),
    // Total savings
    prisma.saving.aggregate({
      where: { userId },
      _sum: { amount: true },
    }),
    // Total wallet balance
    prisma.wallet.aggregate({
      where: { userId },
      _sum: { currentBalance: true },
      _count: true,
    }),
    // Expenses by category (for pie chart)
    prisma.expense.groupBy({
      by: ['category'],
      where: { userId, date: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
    }),
    // Recent 10 transactions (mixed income + expense)
    prisma.$queryRaw`
      SELECT 'income' as "type", id, category, amount, date FROM incomes WHERE "userId" = ${userId}
      UNION ALL
      SELECT 'expense' as "type", id, category, amount, date FROM expenses WHERE "userId" = ${userId}
      ORDER BY date DESC
      LIMIT 10
    `,
  ])

  const totalIncome = monthlyIncomes.reduce((s, i) => s + i.amount, 0)
  const totalExpense = monthlyExpenses.reduce((s, e) => s + e.amount, 0)
  const balance = totalIncome - totalExpense
  const savingRate = totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(1) : '0'

  return c.json({
    stats: {
      totalBalance: balance,
      totalIncome,
      totalExpense,
      totalSavings: totalSavings._sum.amount ?? 0,
      totalWalletBalance: totalWalletBalance._sum.currentBalance ?? 0,
      activeWallets: totalWalletBalance._count,
      savingRate: Number(savingRate),
    },
    expensesByCategory: expensesByCategory.map((c) => ({
      category: c.category,
      total: c._sum.amount ?? 0,
    })),
    recentTransactions,
  })
})

// Get cashflow data (last 7 days)
router.get('/cashflow', async (c) => {
  const user = c.get('user')
  const userId = user.id
  const today = new Date()
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(today.getDate() - 6)
  sevenDaysAgo.setHours(0, 0, 0, 0)

  const [incomes, expenses] = await Promise.all([
    prisma.income.findMany({
      where: { userId, date: { gte: sevenDaysAgo } },
    }),
    prisma.expense.findMany({
      where: { userId, date: { gte: sevenDaysAgo } },
    }),
  ])

  const days: { date: string; income: number; expense: number }[] = []
  for (let i = 0; i < 7; i++) {
    const day = new Date(sevenDaysAgo)
    day.setDate(sevenDaysAgo.getDate() + i)
    const dateStr = day.toISOString().split('T')[0]

    const dayIncome = incomes
      .filter((inc) => inc.date.toISOString().split('T')[0] === dateStr)
      .reduce((s, inc) => s + inc.amount, 0)

    const dayExpense = expenses
      .filter((exp) => exp.date.toISOString().split('T')[0] === dateStr)
      .reduce((s, exp) => s + exp.amount, 0)

    days.push({
      date: day.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
      income: dayIncome,
      expense: dayExpense,
    })
  }

  return c.json(days)
})

export default router
