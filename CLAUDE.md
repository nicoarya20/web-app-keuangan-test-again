# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Web-App Keuangan** — Personal finance management app for Indonesian Rupiah (IDR). A React SPA frontend backed by a Hono API server, both in the same monorepo.

## Commands

### Development
```bash
npm install          # Install frontend dependencies (also runs prisma generate)
npm run dev          # Start both frontend (port 5173) and backend (port 3000) concurrently

# Frontend only
npm run build        # Vite production build

# Backend only
npm run backend:dev  # Start Hono server with hot reload

# Database
npm run backend:db:push      # Push Prisma schema changes to Supabase
npm run backend:db:generate  # Regenerate Prisma client after schema changes
npm run backend:db:studio    # Open Prisma Studio GUI
npm run backend:db:migrate   # Run Prisma migrations
```

### Backend (from backend/)
```bash
cd backend && npm install
cd backend && npm run build   # TypeScript compilation check
cd backend && npm run start   # Run compiled JS (production)
```

## Install dependencies setelah perubahan ini

```bash
npm install          # install pg + @types/pg di root (untuk src/server/ dan Vercel)
cd backend && npm install  # install pg + @types/pg di backend (untuk dev server)
```

## Architecture

### Repo Layout
```
src/           ← React SPA (Vite + TypeScript)
backend/       ← Hono API server (Node.js + Prisma)
api/           ← Vercel serverless function entry point
MIND/          ← Planning docs (PLAN/, TASKS/, SUMMARY/)
```

### Frontend (`src/`)
- Entry: `src/main.tsx` → `App.tsx` → `FinanceProvider` wraps `RouterProvider`
- Layout: `src/app/layouts/RootLayout.tsx` — `Sidebar` + `Topbar` + `<Outlet />`
- Pages: `Dashboard`, `IncomePage`, `ExpensesPage`, `WishlistPage`, `SavingsPage`, `WalletPage`
- Routes defined in `src/app/routes.tsx`
- UI: 38 shadcn/ui components in `src/app/components/ui/` (Radix UI primitives)
- `@` alias maps to `src/`

### Backend (`backend/src/`)
- Entry: `index.ts` — mounts CORS, logger, error handler, and 9 route modules
- Routes: per-feature modules in `backend/src/routes/` (user, income, expense, wallet, saving, wishlist, budget, dashboard, auth)
- DB: singleton Prisma client in `backend/src/lib/prisma.ts`
- Error mapping: `backend/src/middleware/errorHandler.ts`

### Database Layer

Semua route aplikasi (income, expense, wallet, dll) pakai **raw SQL via `pg`** (node-postgres), bukan Prisma ORM.

- **`lib/db.ts`** — `pg.Pool` singleton dengan BIGINT type parser. Satu-satunya cara akses DB di semua routes.
- **Pattern query**: `db.query('SELECT ... WHERE "userId" = $1', [user.id])` — parameterized, tidak ada string interpolation.
- **Kolom camelCase**: Kolom PostgreSQL warisan dari Prisma pakai camelCase (`"userId"`, `"createdAt"`, dll) — harus di-quote di SQL.
- **Atomic transactions** (wallet): pakai `client = await db.connect()` → `BEGIN/FOR UPDATE/COMMIT/ROLLBACK` → `client.release()` di `finally`. Jangan pakai `db.query()` langsung untuk operasi multi-tabel.
- **ID generation**: `randomUUID()` dari `'crypto'` (bukan Prisma `cuid()`).
- **Better Auth** adalah satu-satunya yang masih pakai `prismaAdapter` — jangan ubah `lib/auth.ts`.

### Vite Proxy (Dev)

Di dev, `/api/*` dari Vite (port 5173) di-proxy ke backend (port 3000) via `vite.config.ts`. Tidak ada CORS di dev. Di production (Vercel), `api/index.ts` menangani semua route secara langsung.

### State Management — Critical Context
The frontend currently has **dual persistence**:
1. `src/app/context/FinanceContext.tsx` — localStorage-based CRUD (still active for most pages)
2. `src/lib/api.ts` — typed fetch client to the Hono backend (migration in progress)
3. `src/lib/auth.ts` — Better Auth client for authentication

When working on a feature, **always check if `FinanceContext.tsx` should be migrated to use the API client** rather than adding more localStorage logic. The backend API is fully built; the frontend migration is the ongoing work.

### API Client (`src/lib/api.ts`)
All API types and fetch functions are co-located here. The `api` object has namespaced methods: `api.income.list()`, `api.expense.create(data)`, etc. `API_BASE` resolves to `localhost:3000/api` in dev and the Vercel URL in production.

### Authentication
Better Auth handles auth. Backend routes are at `/api/auth/*`. The auth client (`src/lib/auth.ts`) exports `signIn`, `signUp`, `signOut`, `useSession`. `credentials: 'include'` is set on all API requests for cookie-based auth.

### Database Schema
`backend/prisma/schema.prisma` is the source of truth. 8 models: `User`, `Session`, `Account`, `Income`, `Expense`, `Wishlist`, `Saving`, `Wallet`, `WalletTransaction`, `Budget`. All monetary `amount` fields are `Int` (whole Rupiah). After any schema change, run `npm run backend:db:generate` (and usually `npm run backend:db:push`).

### Styling
- Tailwind CSS v4 via `@tailwindcss/vite` plugin — no `tailwind.config.js`
- OKLCH design tokens in `src/styles/theme.css` (light/dark CSS variables)
- Use `cn()` from `src/app/components/ui/utils.ts` (clsx + tailwind-merge) for conditional classes
- `useIsMobile()` hook from `src/app/components/ui/use-mobile.ts` (breakpoint: 768px)

### Deployment
Vercel: `vercel.json` rewrites `/api/*` to the serverless function at `api/index.ts`, all other paths to `index.html`.

## Development Workflow (MIND Framework)

For non-trivial features, follow the `MIND/` workflow:
1. Create plan at `MIND/PLAN/[feature-name].md`
2. Track tasks at `MIND/TASKS/[feature-name].md`
3. Document completion at `MIND/SUMMARY/[feature-name].md`

## Git Conventions

- **Branch format:** `tasks/[task-name]/[description]/[date-time]`
- Run `npm run build` (and `cd backend && npm run build`) to verify no TypeScript errors before committing
- Commit after a successful build
