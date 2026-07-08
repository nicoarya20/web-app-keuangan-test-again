# 💰 Web App Keuangan — Aplikasi Pencatat Keuangan Pribadi

Aplikasi keuangan pribadi full-stack yang dibangun dengan React + Hono + Supabase. Catat pemasukan, pengeluaran, dompet, tabungan, dan wishlist — semua dalam satu aplikasi, dengan dukungan Bahasa Indonesia dan Inggris.

**Demo Langsung:** [web-app-keuanganku.vercel.app](https://web-app-keuanganku.vercel.app)

---

## Fitur

- **Dashboard** — ringkasan kekayaan bersih, grafik cashflow, rincian pengeluaran per kategori, transaksi terbaru
- **Pemasukan** — catat pemasukan dengan kategori, tandai berulang, dan integrasi ke dompet
- **Pengeluaran** — catat pengeluaran dengan budget per kategori dan peringatan jika melebihi budget
- **Dompet** — kelola beberapa dompet (tunai, e-wallet, bank), isi saldo, catat pengeluaran, dan transfer antar dompet
- **Tabungan & Investasi** — catat tabungan/investasi dengan nama tujuan dan grafik pertumbuhan
- **Wishlist** — tentukan target harga dan pantau progress menabung untuk setiap item
- **Autentikasi** — login email/password via Better Auth
- **Dwibahasa** — Indonesia & Inggris (toggle di topbar)
- **Privasi Saldo** — sembunyikan/tampilkan semua nominal uang dengan satu klik (icon mata)
- **Modal Update Fitur** — popup changelog muncul otomatis setelah login saat ada fitur baru
- **Siap Dark/Light theme** — design token OKLCH di CSS

---

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | React 19, Vite, TypeScript |
| UI | shadcn/ui (Radix UI), Tailwind CSS v4 |
| Backend | Hono (Node.js) |
| Database | PostgreSQL via Supabase |
| ORM / Query | Prisma (schema) + raw SQL via `node-postgres` |
| Auth | Better Auth |
| Deployment | Vercel (frontend + serverless API) |

---

## Struktur Project

```
├── src/                  # Frontend React (Vite)
│   ├── app/
│   │   ├── components/   # Komponen UI bersama
│   │   ├── context/      # React context (Finance, Language, BalanceVisibility)
│   │   ├── hooks/        # Custom hooks
│   │   ├── pages/        # Halaman aplikasi
│   │   ├── layouts/      # RootLayout
│   │   └── constants/    # Changelog, dll
│   ├── lib/              # API client, auth client
│   └── styles/           # CSS global, design token
├── backend/              # Hono API server (dev lokal)
│   └── src/
│       ├── routes/       # Route handler
│       └── lib/          # DB client, auth, prisma
├── api/                  # Entry point Vercel serverless
│   └── index.ts
└── backend/prisma/       # Prisma schema (sumber kebenaran)
```

---

## Cara Memulai

### Prasyarat

- Node.js 18+
- Project [Supabase](https://supabase.com) (tier gratis sudah cukup)

### 1. Clone & Install

```bash
git clone <url-repo-kamu>
cd web-app-keuangan

# Install dependensi frontend
npm install

# Install dependensi backend
cd backend && npm install && cd ..
```

### 2. Environment Variables

Buat file `.env` di folder root (lihat `.env.example` sebagai panduan):

```env
# Supabase — dari Supabase Dashboard > Settings > Database
# Gunakan port 6543 (connection pooler) untuk DATABASE_URL
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true

# Gunakan port 5432 (koneksi langsung) untuk migrasi
MIGRATE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres

# Better Auth — buat secret acak (contoh: openssl rand -hex 32)
BETTER_AUTH_SECRET=secret_acak_kamu

# URL tempat app berjalan
BETTER_AUTH_URL=http://localhost:5173   # dev
# BETTER_AUTH_URL=https://app-kamu.vercel.app  # production
```

> **Cara dapat kredensial Supabase:** Buka project Supabase → Settings → Database → Connection string. Salin URI "Transaction" untuk `DATABASE_URL` dan URI "Session" untuk `MIGRATE_URL`.

### 3. Push Skema Database

```bash
npm run backend:db:push
```

Perintah ini akan membuat semua tabel yang dibutuhkan di database Supabase kamu.

### 4. Jalankan di Mode Development

```bash
npm run dev
```

Ini akan menjalankan:
- Frontend di `http://localhost:5173`
- Backend API di `http://localhost:3000`

Semua request `/api/*` dari frontend otomatis di-proxy ke backend saat development.

---

## Deployment ke Vercel

### 1. Push ke GitHub

Push kode kamu ke repository GitHub.

### 2. Import ke Vercel

Buka [vercel.com](https://vercel.com) → New Project → Import repo kamu.

### 3. Atur Environment Variables

Di Vercel project settings → Environment Variables, tambahkan semua variabel dari file `.env` kamu. Untuk `BETTER_AUTH_URL`, gunakan URL Vercel deployment kamu (contoh: `https://app-kamu.vercel.app`).

### 4. Deploy

Vercel akan otomatis build dan deploy. File `vercel.json` sudah mengatur routing untuk frontend SPA dan serverless function `/api/*`.

---

## Skema Database

8 model yang dikelola via Prisma:

| Model | Keterangan |
|-------|------------|
| `User` | Data pengguna |
| `Session` / `Account` | Sesi Better Auth |
| `Income` | Data pemasukan |
| `Expense` | Data pengeluaran |
| `Wallet` | Akun dompet |
| `WalletTransaction` | Riwayat transaksi dompet |
| `Saving` | Data tabungan & investasi |
| `Wishlist` | Item wishlist dengan tracking progress |

> Setelah mengubah skema, jalankan `npm run backend:db:generate` lalu `npm run backend:db:push`.

---

## Perintah yang Tersedia

```bash
# Development
npm run dev                   # Jalankan frontend + backend sekaligus
npm run backend:dev           # Backend saja (dengan hot reload)

# Build
npm run build                 # Build produksi Vite

# Database
npm run backend:db:push       # Push perubahan skema ke Supabase
npm run backend:db:generate   # Regenerasi Prisma client
npm run backend:db:studio     # Buka Prisma Studio GUI
npm run backend:db:migrate    # Jalankan migrasi Prisma
```

---

## Kustomisasi

### Menambah Entri Changelog Baru

Saat kamu merilis fitur baru, update `src/app/constants/changelog.ts`:

```ts
export const APP_VERSION = '1.3.0';  // naikkan versi ini

export const CHANGELOG = [
  {
    version: '1.3.0',
    date: '1 Agu 2026',
    features: ['Fitur baru kamu di sini'],
  },
  // ... entri sebelumnya
];
```

Modal "Yang Baru" akan otomatis muncul ke semua pengguna saat login berikutnya.

### Mengubah Bahasa Default Aplikasi

Edit `src/app/context/LanguageContext.tsx` — ubah nilai awal state `lang` dari `'id'` ke `'en'` (atau sebaliknya).

---

## Lisensi

Source code ini dijual untuk **penggunaan personal dan komersial**. Kamu boleh menggunakan, memodifikasi, dan men-deploy kode ini untuk project pribadi maupun project klien. Kamu **tidak boleh** menjual kembali atau mendistribusikan ulang source code ini apa adanya.
