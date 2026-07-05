import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { getRequestListener } from '@hono/node-server'

import { errorHandler } from '../src/server/middleware/errorHandler'
import authRoutes from '../src/server/routes/auth'
import userRoutes from '../src/server/routes/user'
import incomeRoutes from '../src/server/routes/income'
import expenseRoutes from '../src/server/routes/expense'
import walletRoutes from '../src/server/routes/wallet'
import savingRoutes from '../src/server/routes/saving'
import wishlistRoutes from '../src/server/routes/wishlist'
import budgetRoutes from '../src/server/routes/budget'
import dashboardRoutes from '../src/server/routes/dashboard'

const app = new Hono()

app.use('*', logger())
app.use('*', errorHandler)

app.get('/', (c) => c.json({ message: '🚀 Backend Web-App Keuangan', version: '2.0.0' }))

app.get('/api/health', async (c) => {
  try {
    const { db } = await import('../src/server/lib/db')
    const result = await db.query('SELECT NOW() as time')
    return c.json({ ok: true, db: 'connected', time: result.rows[0].time })
  } catch (err: any) {
    return c.json({ ok: false, error: err.message }, 500)
  }
})

app.route('/api/auth', authRoutes)
app.route('/api/users', userRoutes)
app.route('/api/incomes', incomeRoutes)
app.route('/api/expenses', expenseRoutes)
app.route('/api/wallets', walletRoutes)
app.route('/api/savings', savingRoutes)
app.route('/api/wishlists', wishlistRoutes)
app.route('/api/budgets', budgetRoutes)
app.route('/api/dashboard', dashboardRoutes)

export const config = { runtime: 'nodejs' }
export default getRequestListener(app.fetch)
