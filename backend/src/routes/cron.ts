import { Hono } from 'hono'
import { db } from '../lib/db'

const router = new Hono()

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!
const CRON_SECRET = process.env.CRON_SECRET

// GET /api/cron/monthly-recap — dipanggil Vercel Cron tiap tanggal 1 jam 08.00 UTC
router.get('/monthly-recap', async (c) => {
  const isVercelCron = c.req.header('x-vercel-cron') === '1'
  const hasSecret = CRON_SECRET && c.req.header('x-cron-secret') === CRON_SECRET
  if (!isVercelCron && !hasSecret) return c.json({ error: 'Unauthorized' }, 401)

  const now = new Date()
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const monthStart = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), 1).toISOString()
  const monthEnd = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0, 23, 59, 59).toISOString()
  const monthLabel = prevMonth.toLocaleString('id-ID', { month: 'long', year: 'numeric' })

  const { rows: users } = await db.query<{ id: string; name: string | null; telegramChatId: string }>(
    `SELECT id, name, "telegramChatId" FROM users WHERE "telegramChatId" IS NOT NULL`
  )

  let sent = 0
  let errors = 0

  for (const user of users) {
    try {
      const { rows: expenseRows } = await db.query<{ category: string; total: number }>(
        `SELECT category, SUM(amount) as total
         FROM expenses
         WHERE "userId" = $1 AND date >= $2 AND date <= $3
         GROUP BY category
         ORDER BY total DESC`,
        [user.id, monthStart, monthEnd]
      )

      const { rows: incomeRows } = await db.query<{ total: number }>(
        `SELECT COALESCE(SUM(amount), 0) as total
         FROM incomes
         WHERE "userId" = $1 AND date >= $2 AND date <= $3`,
        [user.id, monthStart, monthEnd]
      )

      const totalExpense = expenseRows.reduce((sum, r) => sum + Number(r.total), 0)
      const totalIncome = Number(incomeRows[0]?.total ?? 0)
      const sisa = totalIncome - totalExpense
      const persentase = totalIncome > 0 ? ((sisa / totalIncome) * 100).toFixed(1) : '0'

      const rp = (n: number) => `Rp ${n.toLocaleString('id-ID')}`

      let msg = `📊 <b>Rekap Keuangan ${monthLabel}</b>\n\n`
      msg += `💰 Pemasukan: <b>${rp(totalIncome)}</b>\n`
      msg += `💸 Pengeluaran: <b>${rp(totalExpense)}</b>\n`
      msg += `${sisa >= 0 ? '✅' : '⚠️'} Sisa: <b>${rp(sisa)}</b>`
      if (totalIncome > 0) msg += ` (${persentase}%)`
      msg += '\n'

      if (expenseRows.length > 0) {
        msg += `\n📋 <b>Rincian Pengeluaran:</b>\n`
        for (const row of expenseRows) {
          msg += `• ${row.category}: ${rp(Number(row.total))}\n`
        }
      }

      msg += `\n<i>Dikirim otomatis oleh FinanceApp</i>`

      await sendTelegram(user.telegramChatId, msg)
      sent++
    } catch {
      errors++
    }
  }

  return c.json({ ok: true, sent, errors, month: monthLabel })
})

async function sendTelegram(chatId: string, text: string) {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  })
  if (!res.ok) throw new Error(`Telegram error ${res.status}: ${await res.text()}`)
}

export default router
