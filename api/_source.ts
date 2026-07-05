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

// Test: does POST body work at all?
app.post('/api/test-post', async (c) => {
  const body = await c.req.json().catch(() => ({ err: 'no body' }))
  return c.json({ ok: true, received: body, time: Date.now() })
})

app.get('/api/health', async (c) => {
  try {
    const { db } = await import('../src/server/lib/db')
    const result = await db.query('SELECT NOW() as time')
    return c.json({ ok: true, db: 'connected', time: result.rows[0].time })
  } catch (err: any) {
    return c.json({ ok: false, error: err.message }, 500)
  }
})

// Debug: test verification table + env vars
app.get('/api/debug', async (c) => {
  process.stdout.write('[debug] GET /api/debug\n')
  const { db } = await import('../src/server/lib/db')
  const out: Record<string, any> = {
    env: {
      BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ? 'set' : 'MISSING',
      BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || 'NOT SET (using default)',
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'set' : 'MISSING',
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'set' : 'MISSING',
      DATABASE_URL: process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/:([^@]+)@/, ':***@') : 'MISSING',
    }
  }
  for (const table of ['verification', 'user', 'session', 'account']) {
    try {
      const r = await db.query(`SELECT count(*) FROM "${table}"`)
      out[table] = 'exists (rows: ' + r.rows[0].count + ')'
    } catch (err: any) {
      out[table] = 'ERROR: ' + err.message
    }
  }
  return c.json(out)
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
