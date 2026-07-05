import pg from 'pg'
const { Pool, types } = pg

// BIGINT (OID 20) dikembalikan sebagai string oleh pg — parse manual ke number
types.setTypeParser(20, (val: string) => parseInt(val, 10))

const globalForDb = globalThis as unknown as { _db: pg.Pool }
export const db = globalForDb._db ?? new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1,
  connectionTimeoutMillis: 5000,  // fail fast if DB unreachable, don't hang forever
  idleTimeoutMillis: 10000,
})
if (process.env.NODE_ENV !== 'production') globalForDb._db = db
