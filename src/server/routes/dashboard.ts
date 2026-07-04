import { Hono } from 'hono'
import { db } from '../lib/db'
import { authMiddleware } from '../middleware/auth'

const router = new Hono()
router.use('*', authMiddleware)

router.get('/', async (c) => {
  const user = c.get('user')
  const userId = user.id
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const [incomeRes, expenseRes, savingsRes, walletRes, categoryRes, recentRes] = await Promise.all([
    db.query(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM incomes WHERE "userId" = $1 AND date >= $2 AND date <= $3`,
      [userId, start, end]
    ),
    db.query(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM expenses WHERE "userId" = $1 AND date >= $2 AND date <= $3`,
      [userId, start, end]
    ),
    db.query(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM savings WHERE "userId" = $1`,
      [userId]
    ),
    db.query(
      `SELECT COALESCE(SUM("currentBalance"), 0) AS total, COUNT(*)::int AS count FROM wallets WHERE "userId" = $1`,
      [userId]
    ),
    db.query(
      `SELECT category, SUM(amount)::int AS total FROM expenses
       WHERE "userId" = $1 AND date >= $2 AND date <= $3
       GROUP BY category ORDER BY total DESC`,
      [userId, start, end]
    ),
    db.query(
      `SELECT 'income' AS type, id, category, amount, date FROM incomes WHERE "userId" = $1
       UNION ALL
       SELECT 'expense' AS type, id, category, amount, date FROM expenses WHERE "userId" = $1
       ORDER BY date DESC LIMIT 10`,
      [userId]
    ),
  ])

  const totalIncome = Number(incomeRes.rows[0].total)
  const totalExpense = Number(expenseRes.rows[0].total)
  const balance = totalIncome - totalExpense
  const savingRate = totalIncome > 0 ? Number(((balance / totalIncome) * 100).toFixed(1)) : 0

  return c.json({
    stats: {
      totalBalance: balance,
      totalIncome,
      totalExpense,
      totalSavings: Number(savingsRes.rows[0].total),
      totalWalletBalance: Number(walletRes.rows[0].total),
      activeWallets: walletRes.rows[0].count,
      savingRate,
    },
    expensesByCategory: categoryRes.rows,
    recentTransactions: recentRes.rows,
  })
})

router.get('/cashflow', async (c) => {
  const user = c.get('user')
  const userId = user.id
  const today = new Date()
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(today.getDate() - 6)
  sevenDaysAgo.setHours(0, 0, 0, 0)

  const [incomeRes, expenseRes] = await Promise.all([
    db.query(
      `SELECT date, amount FROM incomes WHERE "userId" = $1 AND date >= $2`,
      [userId, sevenDaysAgo]
    ),
    db.query(
      `SELECT date, amount FROM expenses WHERE "userId" = $1 AND date >= $2`,
      [userId, sevenDaysAgo]
    ),
  ])

  const days = []
  for (let i = 0; i < 7; i++) {
    const day = new Date(sevenDaysAgo)
    day.setDate(sevenDaysAgo.getDate() + i)
    const dateStr = day.toISOString().split('T')[0]

    const income = incomeRes.rows
      .filter((r: any) => new Date(r.date).toISOString().split('T')[0] === dateStr)
      .reduce((sum: number, r: any) => sum + r.amount, 0)

    const expense = expenseRes.rows
      .filter((r: any) => new Date(r.date).toISOString().split('T')[0] === dateStr)
      .reduce((sum: number, r: any) => sum + r.amount, 0)

    days.push({
      date: day.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
      income,
      expense,
    })
  }

  return c.json(days)
})

export default router
