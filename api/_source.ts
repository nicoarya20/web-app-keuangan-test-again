import { Hono } from 'hono'
import { logger } from 'hono/logger'
import type { IncomingMessage, ServerResponse } from 'http'

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
import notificationRoutes from '../src/server/routes/notifications'
import telegramRoutes from '../src/server/routes/telegram'
import cronRoutes from '../src/server/routes/cron'

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
app.route('/api/notifications', notificationRoutes)
app.route('/api/telegram', telegramRoutes)
app.route('/api/cron', cronRoutes)

// Read POST body explicitly — Vercel's serverless runtime does not stream
// the body via data events the way @hono/node-server expects, causing all
// POST requests to hang. We buffer the body ourselves before building the
// Fetch API Request so Hono can read it normally.
function readBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
    // If body is already read (Vercel buffers it), resume the stream
    if (req.readableEnded) resolve(Buffer.alloc(0))
  })
}

export const config = { runtime: 'nodejs' }

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const host = req.headers.host ?? 'localhost'
  const url = `https://${host}${req.url ?? '/'}`

  const hasBody = req.method !== 'GET' && req.method !== 'HEAD'
  const rawBody = hasBody ? await readBody(req) : undefined

  const headers = new Headers()
  for (const [key, val] of Object.entries(req.headers)) {
    if (val == null) continue
    if (Array.isArray(val)) val.forEach((v) => headers.append(key, v))
    else headers.set(key, val)
  }

  const request = new Request(url, {
    method: req.method ?? 'GET',
    headers,
    body: rawBody?.length ? rawBody : undefined,
  })

  const response = await app.fetch(request)

  res.statusCode = response.status

  // Set-Cookie must be forwarded as an array — res.setHeader overwrites
  // previous values, so multiple Set-Cookie headers (session_token,
  // session_data, etc.) would be collapsed to one, breaking auth cookies.
  const cookies: string[] =
    typeof (response.headers as any).getSetCookie === 'function'
      ? (response.headers as any).getSetCookie()
      : []

  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'set-cookie') return  // handled separately below
    res.setHeader(key, value)
  })

  if (cookies.length > 0) {
    res.setHeader('Set-Cookie', cookies)
  }

  const buf = await response.arrayBuffer()
  res.end(Buffer.from(buf))
}
