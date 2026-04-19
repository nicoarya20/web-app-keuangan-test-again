import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { handle } from 'hono/vercel'

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

// ============================================================
// GLOBAL MIDDLEWARE
// ============================================================
app.use('*', logger())

// Build allowed origins from environment variables
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://web-app-keuangan-test-again.vercel.app',
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
  ...(process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : []),
].filter((origin, index, self) => self.indexOf(origin) === index) // deduplicate

app.use('/*', cors({
  origin: allowedOrigins,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  credentials: true,
  exposeHeaders: ['Set-Cookie'],
}))
app.use('*', errorHandler)

// ============================================================
// HEALTH CHECK
// ============================================================
app.get('/', (c) => c.json({
  message: '🚀 Backend Web-App Keuangan (Vercel-Monolith-v3)',
  version: '1.0.5',
}))

// ============================================================
// ROUTES
// ============================================================
app.route('/api/auth', authRoutes)
app.route('/api/users', userRoutes)
app.route('/api/incomes', incomeRoutes)
app.route('/api/expenses', expenseRoutes)
app.route('/api/wallets', walletRoutes)
app.route('/api/savings', savingRoutes)
app.route('/api/wishlists', wishlistRoutes)
app.route('/api/budgets', budgetRoutes)
app.route('/api/dashboard', dashboardRoutes)

// Vercel Export
export const config = {
  runtime: 'nodejs'
}

export default handle(app)
