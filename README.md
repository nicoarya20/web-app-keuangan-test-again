# 💰 Web App Keuangan — Personal Finance Manager

A clean, full-stack personal finance web app built with React + Hono + Supabase. Track your income, expenses, wallets, savings, and wishlist — all in one place, with support for both Indonesian and English.

**Live Demo:** [web-app-keuanganku.vercel.app](https://web-app-keuanganku.vercel.app)

---

## Features

- **Dashboard** — net worth overview, cashflow chart, expense breakdown by category, recent transactions
- **Income** — track income with categories, recurring flag, and wallet integration
- **Expenses** — track spending with category budgets and budget warnings
- **Wallet** — manage multiple wallets (cash, e-wallet, bank), top-up, expense, and transfer between wallets
- **Savings & Investments** — log savings/investment entries with goal names and growth chart
- **Wishlist** — set target prices, track progress toward each item
- **Authentication** — email/password login via Better Auth
- **Bilingual** — Indonesian & English (toggle in topbar)
- **Balance Privacy** — show/hide all monetary values with one click (eye icon)
- **What's New Modal** — changelog popup after login when new features are released
- **Dark/Light theme ready** — OKLCH design tokens in CSS

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, Vite, TypeScript |
| UI | shadcn/ui (Radix UI), Tailwind CSS v4 |
| Backend | Hono (Node.js) |
| Database | PostgreSQL via Supabase |
| ORM / Query | Prisma (schema only) + raw SQL via `node-postgres` |
| Auth | Better Auth |
| Deployment | Vercel (frontend + serverless API) |

---

## Project Structure

```
├── src/                  # React frontend (Vite)
│   ├── app/
│   │   ├── components/   # Shared UI components
│   │   ├── context/      # React contexts (Finance, Language, BalanceVisibility)
│   │   ├── hooks/        # Custom hooks
│   │   ├── pages/        # Page components
│   │   ├── layouts/      # RootLayout
│   │   └── constants/    # Changelog, etc.
│   ├── lib/              # API client, auth client
│   └── styles/           # Global CSS, theme tokens
├── backend/              # Hono API server (local dev)
│   └── src/
│       ├── routes/       # Route handlers
│       └── lib/          # DB client, auth, prisma
├── api/                  # Vercel serverless entry point
│   └── index.ts
└── backend/prisma/       # Prisma schema (source of truth)
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier works)

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd web-app-keuangan

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..
```

### 2. Environment Variables

Create a `.env` file in the root directory:

```env
# Supabase — from your Supabase project dashboard > Settings > Database
# Use port 6543 (connection pooler) for DATABASE_URL
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true

# Use port 5432 (direct connection) for migrations
MIGRATE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres

# Better Auth — generate a random secret (e.g. openssl rand -hex 32)
BETTER_AUTH_SECRET=your_random_secret_here

# URL where your app is running
BETTER_AUTH_URL=http://localhost:5173   # dev
# BETTER_AUTH_URL=https://your-app.vercel.app  # production
```

> **Where to find Supabase credentials:** Go to your Supabase project → Settings → Database → Connection string. Copy the "Transaction" URI for `DATABASE_URL` and "Session" URI for `MIGRATE_URL`.

### 3. Push Database Schema

```bash
npm run backend:db:push
```

This will create all the required tables in your Supabase database.

### 4. Run in Development

```bash
npm run dev
```

This starts:
- Frontend at `http://localhost:5173`
- Backend API at `http://localhost:3000`

All `/api/*` requests from the frontend are automatically proxied to the backend during development.

---

## Deployment (Vercel)

### 1. Push to GitHub

Push your code to a GitHub repository.

### 2. Import to Vercel

Go to [vercel.com](https://vercel.com) → New Project → Import your repo.

### 3. Set Environment Variables

In Vercel project settings → Environment Variables, add all variables from your `.env` file. For `BETTER_AUTH_URL`, use your Vercel deployment URL (e.g. `https://your-app.vercel.app`).

### 4. Deploy

Vercel will automatically build and deploy. The `vercel.json` config handles routing for both the frontend SPA and the `/api/*` serverless functions.

---

## Database Schema

8 models managed via Prisma:

| Model | Description |
|-------|-------------|
| `User` | Auth user |
| `Session` / `Account` | Better Auth sessions |
| `Income` | Income records |
| `Expense` | Expense records |
| `Wallet` | Wallet accounts |
| `WalletTransaction` | Wallet transaction history |
| `Saving` | Savings & investment entries |
| `Wishlist` | Wishlist items with progress tracking |

> After any schema change, run `npm run backend:db:generate` then `npm run backend:db:push`.

---

## Available Scripts

```bash
# Development
npm run dev                   # Start frontend + backend concurrently
npm run backend:dev           # Backend only (with hot reload)

# Build
npm run build                 # Vite production build

# Database
npm run backend:db:push       # Push schema changes to Supabase
npm run backend:db:generate   # Regenerate Prisma client
npm run backend:db:studio     # Open Prisma Studio GUI
npm run backend:db:migrate    # Run Prisma migrations
```

---

## Customization

### Adding a New Changelog Entry

When you release new features, update `src/app/constants/changelog.ts`:

```ts
export const APP_VERSION = '1.3.0';  // bump this

export const CHANGELOG = [
  {
    version: '1.3.0',
    date: '1 Aug 2026',
    features: ['Your new feature here'],
  },
  // ... previous entries
];
```

The "What's New" modal will automatically appear for all users on their next login.

### Changing the App Language Default

Edit `src/app/context/LanguageContext.tsx` — change the initial `lang` state from `'id'` to `'en'`.

---

## License

This source code is sold for **personal and commercial use**. You may use, modify, and deploy this code for your own projects or your clients' projects. You may **not** resell or redistribute this source code as-is.
