import type { Context } from 'hono'
import { db } from './db'

// Tabel idempotency dibuat lazy (sekali per proses) supaya tidak perlu migrasi Prisma.
// Kolom camelCase konsisten dgn skema warisan lain.
let ensured: Promise<void> | null = null
function ensureTable(): Promise<void> {
  if (!ensured) {
    ensured = db
      .query(
        `CREATE TABLE IF NOT EXISTS idempotency_keys (
           key TEXT PRIMARY KEY,
           "userId" TEXT NOT NULL,
           "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
         )`
      )
      .then(() => undefined)
      .catch((e) => {
        ensured = null // biar dicoba lagi di request berikutnya
        throw e
      })
  }
  return ensured
}

/**
 * Klaim key. Return true kalau request pertama (boleh diproses),
 * false kalau key sudah dipakai (duplikat — jangan proses ulang).
 */
async function claimIdempotencyKey(userId: string, key: string): Promise<boolean> {
  await ensureTable()
  const { rowCount } = await db.query(
    `INSERT INTO idempotency_keys (key, "userId") VALUES ($1, $2)
     ON CONFLICT (key) DO NOTHING`,
    [key, userId]
  )
  return rowCount === 1
}

/** Lepas key supaya user boleh retry (dipakai saat operasi gagal / non-2xx). */
async function releaseIdempotencyKey(key: string): Promise<void> {
  await db.query(`DELETE FROM idempotency_keys WHERE key = $1`, [key])
}

/**
 * Bungkus handler create dengan proteksi idempotency.
 * - Tanpa header `Idempotency-Key` → jalan seperti biasa (backward compatible).
 * - Duplikat → 409 { duplicate: true } tanpa memproses ulang.
 * - Kalau operasi gagal (throw atau balas non-2xx) → key dilepas supaya boleh retry.
 */
export async function withIdempotency(
  c: Context,
  userId: string,
  fn: () => Promise<Response>
): Promise<Response> {
  const key = c.req.header('Idempotency-Key')
  if (!key) return fn()

  if (!(await claimIdempotencyKey(userId, key))) {
    return c.json({ error: 'Permintaan duplikat sudah diproses.', duplicate: true }, 409)
  }

  try {
    const res = await fn()
    if (res.status < 200 || res.status >= 300) await releaseIdempotencyKey(key)
    return res
  } catch (e) {
    await releaseIdempotencyKey(key)
    throw e
  }
}
