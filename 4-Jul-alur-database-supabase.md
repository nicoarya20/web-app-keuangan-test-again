# Alur Database — Supabase + Hono + React
## Referensi untuk Project Lain

---

## Stack

| Layer | Teknologi |
|---|---|
| Database | Supabase (PostgreSQL) |
| Server / API | Hono (Node.js) |
| ORM / Query | `pg` (node-postgres) — raw SQL, tanpa ORM |
| Frontend | React + TypeScript |
| Deploy | Vercel (Serverless Functions) |

---

## Gambaran Alur

```
Browser (React)
    │
    │  fetch("/api/barang")
    ▼
API Layer
    ├── Dev  → server/index.ts   (Hono, port 3001, di-proxy Vite ke :5173)
    └── Prod → api/index.ts      (Vercel Serverless Function)
    │
    │  db.query("SELECT ...")
    ▼
Supabase PostgreSQL
    └── DATABASE_URL (connection string via env var)
```

---

## 1. Koneksi Database — `server/db.ts`

File ini di-extract terpisah supaya bisa dipakai bersama oleh auth dan semua routes.

```ts
import "dotenv/config";
import pg from "pg";
const { Pool, types } = pg;

// PENTING: pg mengembalikan BIGINT (OID 20) sebagai string by default
// Parse manual supaya jadi JS number
types.setTypeParser(20, (val: string) => parseInt(val, 10));

export const db = new Pool({ connectionString: process.env.DATABASE_URL });
```

**Env var yang dibutuhkan:**
```
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

Di Supabase, ambil dari: **Project Settings → Database → Connection string → URI**

---

## 2. Schema Tabel

Dijalankan manual di Supabase SQL Editor (atau otomatis via `CREATE TABLE IF NOT EXISTS` di `server/index.ts` saat dev).

```sql
CREATE TABLE barang (
  id         SERIAL PRIMARY KEY,
  nama       TEXT NOT NULL,
  kategori   TEXT NOT NULL DEFAULT 'Lainnya',
  harga_beli INTEGER NOT NULL DEFAULT 0,
  harga_jual INTEGER NOT NULL DEFAULT 0,
  stok_awal  INTEGER NOT NULL DEFAULT 0,
  terjual    INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE transaksi (
  id         SERIAL PRIMARY KEY,
  barang_id  INTEGER REFERENCES barang(id) ON DELETE SET NULL,
  nama       TEXT NOT NULL,
  qty        INTEGER NOT NULL,
  harga_jual INTEGER NOT NULL,
  harga_beli INTEGER NOT NULL,
  timestamp  BIGINT NOT NULL,       -- simpan sebagai Unix ms (Date.now())
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

> `ON DELETE SET NULL` pada `barang_id`: kalau barang dihapus, riwayat transaksi tetap ada — hanya `barang_id`-nya jadi NULL.

> Supabase akan minta konfirmasi RLS → pilih **"Run without RLS"** karena akses DB lewat server sendiri, bukan Supabase JS client langsung.

---

## 3. Route Handler — `server/routes/barang.ts`

### Pola SELECT dengan alias snake_case → camelCase

Daripada transform manual di JS, pakai SQL alias langsung:

```ts
const SELECT = `id, nama, kategori,
  harga_beli AS "hargaBeli",
  harga_jual AS "hargaJual",
  stok_awal  AS "stokAwal",
  terjual`;
```

Semua query SELECT pakai konstanta ini agar konsisten.

### Endpoint CRUD

| Method | Path | Query |
|---|---|---|
| GET | `/api/barang` | `SELECT ... FROM barang ORDER BY nama` |
| POST | `/api/barang` | `INSERT ... RETURNING` |
| PUT | `/api/barang/:id` | `UPDATE ... WHERE id=$n RETURNING` |
| PATCH | `/api/barang/:id/restock` | `UPDATE barang SET stok_awal = stok_awal + $1` |
| DELETE | `/api/barang/:id` | `DELETE FROM barang WHERE id=$1` |

> Selalu pakai `RETURNING` setelah INSERT/UPDATE agar response langsung berisi data terbaru — tidak perlu query kedua.

---

## 4. Atomic Transaction — `server/routes/transaksi.ts`

Operasi yang menyentuh lebih dari satu tabel harus atomic. Pakai `client` (bukan `db`) supaya bisa `BEGIN/COMMIT/ROLLBACK`:

```ts
app.post("/", async (c) => {
  const { barangId, qty } = await c.req.json();
  const client = await db.connect();       // ambil koneksi dedicated dari pool
  try {
    await client.query("BEGIN");

    // 1. Lock baris yang akan diupdate — cegah race condition
    const { rows: [b] } = await client.query(
      `SELECT ... FROM barang WHERE id=$1 FOR UPDATE`,
      [barangId]
    );
    if (!b) { await client.query("ROLLBACK"); return c.json({ error: "..." }, 404); }

    // 2. Validasi stok
    const sisa = b.stokAwal - b.terjual;
    if (qty > sisa) { await client.query("ROLLBACK"); return c.json({ error: "..." }, 400); }

    // 3. Update & insert secara bersamaan
    await client.query("UPDATE barang SET terjual = terjual + $1 WHERE id=$2", [qty, barangId]);
    const { rows: [t] } = await client.query(`INSERT INTO transaksi ... RETURNING ...`);

    await client.query("COMMIT");
    return c.json(t, 201);
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();                      // WAJIB: kembalikan koneksi ke pool
  }
});
```

**Pattern ini dipakai ketika:**
- Satu request mengubah lebih dari satu tabel
- Ada risiko race condition (stok bisa habis kalau dua request masuk bersamaan)
- Operasi harus all-or-nothing

---

## 5. Frontend API Client — `src/lib/api.ts`

Helper `req<T>` untuk semua fetch — handle error dari server secara terpusat:

```ts
async function req<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json() as Promise<T>;
}

export const api = {
  barang: {
    list:    ()               => req<Barang[]>("/api/barang"),
    create:  (data)           => req<Barang>("/api/barang", { method: "POST", body: JSON.stringify(data) }),
    update:  (id, data)       => req<Barang>(`/api/barang/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    restock: (id, qty)        => req<Barang>(`/api/barang/${id}/restock`, { method: "PATCH", body: JSON.stringify({ qty }) }),
    delete:  (id)             => req<{ ok: boolean }>(`/api/barang/${id}`, { method: "DELETE" }),
  },
  transaksi: {
    list:   ()                => req<Transaksi[]>("/api/transaksi"),
    create: (barangId, qty)   => req<Transaksi>("/api/transaksi", { method: "POST", body: JSON.stringify({ barangId, qty }) }),
  },
};
```

---

## 6. Dual Server Setup (Dev vs Prod)

### Dev — `server/index.ts`

Hono dijalankan sebagai Node.js server biasa di port 3001. Vite proxy `/api/*` ke sana via `vite.config.ts`:

```ts
// vite.config.ts
server: {
  proxy: {
    "/api": "http://localhost:3001",
  },
}
```

Jalankan dua terminal:
```bash
bun run dev          # Vite frontend :5173
bun run server       # Hono backend :3001
```

### Prod — `api/index.ts`

Vercel mendeteksi file di folder `api/` sebagai Serverless Function. Export HTTP method yang dipakai:

```ts
export const config = { runtime: "nodejs" };

const app = new Hono();
app.route("/api/barang", barangRoutes);
app.route("/api/transaksi", transaksiRoutes);

const handler = handle(app);
export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
```

> Satu file `api/index.ts` menangani semua route — Vercel routing di-handle oleh Hono internal.

---

## 7. Hal yang Perlu Diperhatikan

| Masalah | Solusi |
|---|---|
| `pg` mengembalikan BIGINT sebagai string | `types.setTypeParser(20, val => parseInt(val, 10))` di `db.ts` |
| Kolom DB snake_case, frontend camelCase | Pakai SQL alias: `harga_beli AS "hargaBeli"` |
| Race condition saat update multi-tabel | Pakai `BEGIN/FOR UPDATE/COMMIT` pattern |
| Koneksi pool bocor | Selalu `client.release()` di blok `finally` |
| Tabel tidak ada saat dev pertama kali | `CREATE TABLE IF NOT EXISTS` di `server/index.ts` |
| Vercel butuh semua HTTP method di-export | Export `GET`, `POST`, `PUT`, `PATCH`, `DELETE` semua dari `api/index.ts` |
