import { Hono } from 'hono'
import { db } from '../lib/db'

const router = new Hono()

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!

// POST /api/telegram/test — kirim pesan test ke chat user
router.post('/test', async (c) => {
  const { userId } = await c.req.json()
  if (!userId) return c.json({ error: 'userId required' }, 400)

  const { rows } = await db.query<{ telegramChatId: string | null }>(
    `SELECT "telegramChatId" FROM users WHERE id = $1`,
    [userId]
  )
  const chatId = rows[0]?.telegramChatId
  if (!chatId) return c.json({ error: 'Telegram belum terhubung' }, 400)

  await sendMessage(Number(chatId),
    `✅ <b>Test berhasil!</b>\n\nBot Telegram kamu sudah terhubung ke FinanceApp.\nRekap bulanan akan dikirim otomatis setiap tanggal 1.`
  )
  return c.json({ ok: true })
})

// POST /api/telegram/webhook — dipanggil Telegram saat user chat ke bot
router.post('/webhook', async (c) => {
  const body = await c.req.json()
  const message = body?.message
  if (!message) return c.json({ ok: true })

  const chatId: number = message.chat?.id
  const text: string = message.text?.trim() ?? ''

  if (text === '/start' || text.startsWith('/start ')) {
    await sendMessage(chatId, `👋 Halo!\n\nChat ID kamu adalah:\n\n<code>${chatId}</code>\n\nCopy angka di atas, lalu paste ke halaman <b>Settings</b> di FinanceApp untuk mengaktifkan rekap bulanan Telegram.`)
  }

  return c.json({ ok: true })
})

async function sendMessage(chatId: number, text: string) {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Telegram sendMessage failed: ${err}`)
  }
}

export default router
