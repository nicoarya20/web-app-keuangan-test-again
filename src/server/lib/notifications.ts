import { randomUUID } from 'crypto'
import { db } from './db'

let ensured: Promise<void> | null = null
export function ensureTable(): Promise<void> {
  if (!ensured) {
    ensured = db
      .query(
        `CREATE TABLE IF NOT EXISTS notifications (
           id          TEXT        PRIMARY KEY,
           "userId"    TEXT        NOT NULL,
           entity      TEXT        NOT NULL,
           action      TEXT        NOT NULL,
           "entityId"  TEXT,
           meta        JSONB       NOT NULL DEFAULT '{}',
           read        BOOLEAN     NOT NULL DEFAULT false,
           "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
         );
         CREATE INDEX IF NOT EXISTS notifications_user_date_idx
           ON notifications ("userId", "createdAt" DESC);`
      )
      .then(() => undefined)
      .catch((e) => {
        ensured = null
        throw e
      })
  }
  return ensured
}

export interface NotifyPayload {
  entity: 'income' | 'expense' | 'wallet' | 'saving' | 'wishlist' | 'budget'
  action: 'create' | 'update' | 'delete' | 'transfer' | 'topup' | 'fund'
  entityId?: string
  meta?: Record<string, unknown>
}

/**
 * Fire-and-forget notification insert. Failure is logged, never thrown —
 * notification errors must NOT fail the financial mutation that triggered them.
 * In serverless environments call with await before returning the response
 * (Vercel freezes the process after response is sent).
 */
export async function safeNotify(userId: string, payload: NotifyPayload): Promise<void> {
  try {
    await ensureTable()
    await db.query(
      `INSERT INTO notifications (id, "userId", entity, action, "entityId", meta)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        randomUUID(),
        userId,
        payload.entity,
        payload.action,
        payload.entityId ?? null,
        JSON.stringify(payload.meta ?? {}),
      ]
    )
  } catch (e) {
    console.error('[notifications] safeNotify failed (non-fatal):', e)
  }
}
