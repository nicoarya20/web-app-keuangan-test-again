import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

import { errorHandler } from './middleware/errorHandler'
import userRoutes from './routes/user'
import incomeRoutes from './routes/income'
import expenseRoutes from './routes/expense'
import walletRoutes from './routes/wallet'
import savingRoutes from './routes/saving'
import wishlistRoutes from './routes/wishlist'
import budgetRoutes from './routes/budget'
import dashboardRoutes from './routes/dashboard'

const app = new Hono()

// ============================================================
// GLOBAL MIDDLEWARE
// ============================================================
app.use('*', logger())
app.use('/*', cors({
  origin: 'http://localhost:5173',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}))
app.use('*', errorHandler)

// ============================================================
// HEALTH CHECK
// ============================================================
app.get('/', (c) => c.json({
  message: '🚀 Backend Web-App Keuangan',
  version: '1.0.0',
  endpoints: {
    health: 'GET /',
    user: 'POST /api/users, GET /api/users/:id, GET /api/users/email/:email',
    income: 'GET /api/incomes/user/:userId, POST /api/incomes, PATCH /api/incomes/:id, DELETE /api/incomes/:id',
    expense: 'GET /api/expenses/user/:userId, POST /api/expenses, PATCH /api/expenses/:id, DELETE /api/expenses/:id',
    wallet: 'GET /api/wallets/user/:userId, POST /api/wallets, PATCH /api/wallets/:id, DELETE /api/wallets/:id',
    walletTx: 'POST /api/wallets/transactions, DELETE /api/wallets/transactions/:id',
    saving: 'GET /api/savings/user/:userId, POST /api/savings, DELETE /api/savings/:id',
    wishlist: 'GET /api/wishlists/user/:userId, POST /api/wishlists, PATCH /api/wishlists/:id, DELETE /api/wishlists/:id',
    budget: 'GET /api/budgets/user/:userId, POST /api/budgets, DELETE /api/budgets/:id',
    dashboard: 'GET /api/dashboard/user/:userId, GET /api/dashboard/user/:userId/cashflow',
  },
}))

// ============================================================
// ROUTES
// ============================================================
app.route('/api/users', userRoutes)
app.route('/api/incomes', incomeRoutes)
app.route('/api/expenses', expenseRoutes)
app.route('/api/wallets', walletRoutes)
app.route('/api/savings', savingRoutes)
app.route('/api/wishlists', wishlistRoutes)
app.route('/api/budgets', budgetRoutes)
app.route('/api/dashboard', dashboardRoutes)

// ============================================================
// START SERVER
// ============================================================
const port = Number(process.env.PORT) || 3000

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`🚀 Server running at http://localhost:${info.port}`)
})

export default app
