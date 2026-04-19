import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { handle } from 'hono/vercel'

import { errorHandler } from './middleware/errorHandler'
import authRoutes from './routes/auth'
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
  message: '🚀 Backend Web-App Keuangan (Vercel-Unified)',
  version: '1.0.2',
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
