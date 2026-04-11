# Structure Project — Web-App Keuangan

> Personal Finance Management Web Application (Indonesian Rupiah)  
> Generated from Figma Design · React + TypeScript + Vite + Tailwind CSS v4 · Hono Backend API

---

## Table of Contents

1. [Project Structure (Overview)](#project-structure-overview)
2. [Root Files](#root-files)
3. [Configuration Files](#configuration-files)
4. [Frontend (`src/`)](#frontend-src)
5. [Backend (`backend/`)](#backend)
6. [App Architecture (Frontend)](#app-architecture-frontend)
7. [API Architecture (Backend)](#api-architecture-backend)
8. [Pages](#pages)
9. [Components](#components)
10. [UI Components (shadcn/ui)](#ui-components-shadcnui)
11. [State Management](#state-management)
12. [Database Schema (Prisma)](#database-schema-prisma)
13. [Backend API Endpoints](#backend-api-endpoints)
14. [Styling](#styling)
15. [Documentation (`MIND/`)](#documentation-mind)
16. [Git Branches](#git-branches)
17. [Commands](#commands)
18. [Key Decisions & Notes](#key-decisions--notes)

---

## Project Structure (Overview)

```
Web-App-Keuangan/
├── src/                        ← Frontend (React SPA)
├── backend/                    ← Backend (Hono API)
│   ├── src/
│   │   ├── index.ts            # Entry point, route mounting
│   │   ├── lib/prisma.ts       # Singleton Prisma client
│   │   ├── middleware/          # Error handler
│   │   └── routes/              # 8 feature route modules
│   ├── prisma/schema.prisma    # Database schema (8 models, 5 enums)
│   ├── .env                    # Supabase credentials
│   └── package.json
├── prisma/                     # Root Prisma (legacy)
│   └── schema.prisma
├── MIND/                       # Planning & documentation
├── guidelines/
├── package.json                # Frontend deps
├── vite.config.ts
└── prisma.config.ts
```

---

## Root Files

| File | Purpose |
|------|---------|
| `.env` | `DATABASE_URL`, `DIRECT_URL` (Supabase PostgreSQL) |
| `.gitignore` | Excludes `node_modules/`, `dist/`, `.DS_Store` |
| `ATTRIBUTIONS.md` | Third-party attributions |
| `bun.lock` | Bun lockfile |
| `package-lock.json` | npm lockfile |
| `pnpm-lock.yaml` | pnpm lockfile |
| `index.html` | HTML entry — mounts `#root`, loads `src/main.tsx` |
| `package.json` | Frontend dependencies & scripts |
| `postcss.config.mjs` | Empty — Tailwind v4 uses `@tailwindcss/vite` |
| `prisma.config.ts` | Root Prisma config (legacy, backend has its own) |
| `QWEN.md` | AI assistant context |
| `README.md` | Setup instructions from Figma Make |
| `vite.config.ts` | Vite: React + Tailwind, `@` alias |

---

## Configuration Files

### Frontend `package.json`

```json
{
  "name": "@figma/my-make-file",
  "type": "module",
  "scripts": { "dev": "vite", "build": "vite build" }
}
```

**Key Dependencies:** React 18, React Router 7, MUI 7, Radix UI (38 components), Lucide React, Recharts, Motion, date-fns, Sonner, Tailwind CSS 4, @supabase/supabase-js  
**Dev Dependencies:** Vite 6, @vitejs/plugin-react, @tailwindcss/vite, Prisma 6, dotenv

### Backend `package.json`

```json
{
  "name": "web-app-keuangan-backend",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio",
    "db:generate": "prisma generate"
  }
}
```

**Dependencies:** Hono, @hono/node-server, @prisma/client  
**Dev Dependencies:** Prisma, TypeScript, tsx, @types/node

---

## Frontend (`src/`)

```
src/
├── main.tsx                           # Entry: renders <App />
├── app/
│   ├── App.tsx                        # FinanceProvider + Router + Toaster
│   ├── routes.ts                      # React Router v7 definitions
│   ├── components/
│   │   ├── Sidebar.tsx                # Responsive sidebar nav (6 items)
│   │   ├── Topbar.tsx                 # Hamburger, search, notifications
│   │   ├── PageTransition.tsx         # Page transition animations
│   │   ├── figma/ImageWithFallback.tsx
│   │   └── ui/                        # 38 shadcn/ui components
│   ├── context/FinanceContext.tsx     # localStorage CRUD state
│   ├── layouts/RootLayout.tsx        # Sidebar + Topbar + <Outlet />
│   └── pages/
│       ├── Dashboard.tsx              # Financial overview + charts
│       ├── IncomePage.tsx             # Income tracking
│       ├── ExpensesPage.tsx           # Expense tracking + budgets
│       ├── WishlistPage.tsx           # Savings goals
│       ├── SavingsPage.tsx            # Savings & investments
│       └── WalletPage.tsx             # Multi-wallet management
├── imports/pasted_text/personal-finance-app.md   # Original Figma spec
├── lib/supabase.ts                    # Supabase client (fixed types)
├── styles/
│   ├── index.css                      # Main (imports tailwind, theme, fonts)
│   ├── tailwind.css                   # Tailwind v4 config
│   ├── theme.css                      # OKLCH design tokens
│   └── fonts.css                      # (empty)
└── generated/prisma/                  # Auto-generated Prisma types
    ├── client.ts, browser.ts, models.ts, enums.ts
    └── models/{Budget,Expense,Income,Saving,User,Wallet,WalletTransaction,Wishlist}.ts
```

---

## Backend (`backend/`)

```
backend/
├── .env                               # DATABASE_URL, DIRECT_URL (Supabase)
├── .gitignore                         # node_modules/, dist/, .env
├── package.json                       # Hono + Prisma + tsx
├── tsconfig.json                      # ES2020, strict, bundler resolution
├── prisma/
│   └── schema.prisma                  # 8 models + 5 enums
└── src/                               # 749 lines total
    ├── index.ts                       # Entry: CORS, logger, error handler, routes
    ├── lib/
    │   └── prisma.ts                  # Singleton Prisma client (7 lines)
    ├── middleware/
    │   └── errorHandler.ts            # Centralized error handling (20 lines)
    └── routes/                        # 8 feature modules (651 lines)
        ├── user.ts                    # User CRUD, get by email (47 lines)
        ├── income.ts                  # Income CRUD + monthly summary (75 lines)
        ├── expense.ts                 # Expense CRUD + monthly summary (78 lines)
        ├── wallet.ts                  # Wallet CRUD + transactions + balance (115 lines)
        ├── saving.ts                  # Saving CRUD + growth data (72 lines)
        ├── wishlist.ts                # Wishlist CRUD + progress summary (66 lines)
        ├── budget.ts                  # Budget CRUD + spending progress (75 lines)
        └── dashboard.ts               # Full dashboard stats + cashflow (123 lines)
```

---

## App Architecture (Frontend)

```
index.html
  └── src/main.tsx
        └── <App />
              ├── <FinanceProvider>        (localStorage state)
              │     └── <RouterProvider>
              │           └── <RootLayout>
              │                 ├── <Sidebar />
              │                 ├── <Topbar />
              │                 └── <main>
              │                       └── <Outlet />  (page content)
              └── <Toaster />             (notifications)
```

### Frontend Routing

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `Dashboard` | Overview, charts, stats |
| `/income` | `IncomePage` | Income management |
| `/expenses` | `ExpensesPage` | Expense tracking + budgets |
| `/wishlist` | `WishlistPage` | Savings goals |
| `/savings` | `SavingsPage` | Savings & investments |
| `/wallet` | `WalletPage` | Multi-wallet management |

---

## API Architecture (Backend)

```
Hono Server (port 3000)
  ├── Global Middleware
  │   ├── logger()              — Request logging
  │   ├── cors()                — Allow localhost:5173
  │   └── errorHandler          — Prisma error mapping
  ├── GET /                     — Health check + endpoint list
  └── /api/*                    — Feature routes
        ├── /api/users          — userRoutes
        ├── /api/incomes        — incomeRoutes
        ├── /api/expenses       — expenseRoutes
        ├── /api/wallets        — walletRoutes (+ /transactions)
        ├── /api/savings        — savingRoutes
        ├── /api/wishlists      — wishlistRoutes
        ├── /api/budgets        — budgetRoutes
        └── /api/dashboard      — dashboardRoutes
```

---

## Pages

### `Dashboard.tsx`
Stats: wallet balance, income, expenses, saving rate. Charts: expense pie, cashflow line (7 days). Insights: highest category, budget warnings (80%+). Recent transactions (mixed, sorted by date).

### `IncomePage.tsx`
Add income: amount, category, date, recurring toggle, note. Stats: total, monthly recurring. List with delete. Mobile-responsive stacking.

### `ExpensesPage.tsx`
Add expense: amount, category, date, note, tags. Set category budgets. Progress bars with color-coded warnings (green → amber → red). List with tags, delete.

### `WishlistPage.tsx`
Add items: name, target price, progress, priority, note. Cards with progress bar, remaining amount, inline update. Grid 1 col → 2 col.

### `SavingsPage.tsx`
Add saving: amount, goal, date, type. Growth chart (cumulative). Goals breakdown grid.

### `WalletPage.tsx`
Add wallets: name, type (cash/ewallet/bank), initial balance. Gradient total card. Color-coded wallet cards. Top-up/expense buttons. Expandable transaction history.

---

## Components

| Component | Description |
|-----------|-------------|
| `RootLayout.tsx` | Responsive shell: Sidebar + Topbar + `<Outlet />`. Offset `lg:pl-64` on desktop. |
| `Sidebar.tsx` | Fixed `w-64`, slides on mobile with overlay. 6 nav items. Active highlighting. User footer. |
| `Topbar.tsx` | Hamburger (mobile), search bar (`hidden sm:flex`), notification bell with dot. |
| `PageTransition.tsx` | Animated page transitions. |

---

## UI Components (shadcn/ui)

38 components in `src/app/components/ui/` on Radix UI primitives.

**Actively used:** `button`, `card`, `dialog`, `input`, `label`, `select`, `switch`, `progress`, `textarea`, `sonner`  
**Scaffolded (unused):** `accordion`, `alert-dialog`, `alert`, `avatar`, `badge`, `calendar`, `carousel`, `checkbox`, `command`, `context-menu`, `drawer`, `dropdown-menu`, `form`, `hover-card`, `input-otp`, `menubar`, `navigation-menu`, `pagination`, `popover`, `radio-group`, `resizable`, `scroll-area`, `separator`, `sheet`, `skeleton`, `slider`, `table`, `tabs`, `toggle`, `tooltip`

**Utilities:** `utils.ts` (`cn()` = clsx + tailwind-merge), `use-mobile.ts` (`useIsMobile()` at 768px)

---

## State Management

### `FinanceContext.tsx` — localStorage

| Key | Data | Demo Records |
|-----|------|-------------|
| `finance_incomes` | Income[] | 2 (Salary, Freelance) |
| `finance_expenses` | Expense[] | 4 (Food, Transport, Bills, Entertainment) |
| `finance_wishlist` | WishlistItem[] | 2 (MacBook Pro, Bali Vacation) |
| `finance_savings` | Saving[] | 2 (Emergency Fund, Stock Investment) |
| `finance_wallets` | Wallet[] | 3 (Dompet Fisik Rp 350K, GoPay Rp 150K, BCA Rp 4.2M) |
| `finance_budgets` | Record\<string, number\> | 3 (Food 2M, Transport 1M, Entertainment 500K) |

CRUD: `add*()`, `delete*()`, `updateWishlistItem()`, `addWalletTransaction()`, `deleteWalletTransaction()`, `setCategoryBudget()`. IDs via `Date.now().toString()`.

---

## Database Schema (Prisma)

**Provider:** PostgreSQL (Supabase) · **Models:** 8 + **Enums:** 5

```
User (1) ──┬── (M) Income
           ├── (M) Expense  (tags: String[])
           ├── (M) Wishlist (priority: LOW | MEDIUM | HIGH)
           ├── (M) Saving   (type: SAVING | INVESTMENT)
           ├── (M) Budget   (unique: userId + category)
           └── (M) Wallet (type: CASH | EWALLET | BANK)
                     └── (M) WalletTransaction (type: TOPUP | EXPENSE)
```

| Decision | Rationale |
|----------|-----------|
| `amount` as `Int` | Whole Rupiah, no decimals |
| `String[]` for tags | PostgreSQL native arrays |
| `currentBalance @default(0)` | Computed by app from transactions |
| `@@unique([userId, category])` on Budget | One budget per category per user |
| `onDelete: Cascade` | Parent deletion cascades to children |
| Indexes on `[userId, date]`, `[userId, category]` | Monthly filtering & category grouping |

---

## Backend API Endpoints

### User
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users` | Create user |
| GET | `/api/users/:id` | Get by ID |
| GET | `/api/users/email/:email` | Get by email |
| PATCH | `/api/users/:id` | Update user |
| DELETE | `/api/users/:id` | Delete user |

### Income
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/incomes/user/:userId` | All incomes (date desc) |
| GET | `/api/incomes/user/:userId/monthly-summary` | Total + recurring + by category |
| POST | `/api/incomes` | Create income |
| PATCH | `/api/incomes/:id` | Update income |
| DELETE | `/api/incomes/:id` | Delete income |

### Expense
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/expenses/user/:userId` | All expenses (date desc) |
| GET | `/api/expenses/user/:userId/monthly-summary` | Total + category breakdown + recent 5 |
| POST | `/api/expenses` | Create expense |
| PATCH | `/api/expenses/:id` | Update expense |
| DELETE | `/api/expenses/:id` | Delete expense |

### Wallet
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/wallets/user/:userId` | Wallets + transactions (date desc) |
| GET | `/api/wallets/user/:userId/total-balance` | Sum of all balances + count |
| POST | `/api/wallets` | Create wallet (sets currentBalance = initialBalance) |
| PATCH | `/api/wallets/:id` | Update wallet |
| DELETE | `/api/wallets/:id` | Delete wallet (cascades to transactions) |

### Wallet Transaction
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/wallets/transactions` | Create tx + atomic balance update via `$transaction` |
| DELETE | `/api/wallets/transactions/:id` | Delete tx + revert balance |

### Saving
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/savings/user/:userId` | All savings (date asc) |
| GET | `/api/savings/user/:userId/summary` | Totals + goals + cumulative growth data |
| POST | `/api/savings` | Create saving |
| DELETE | `/api/savings/:id` | Delete saving |

### Wishlist
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/wishlists/user/:userId` | All wishlists |
| GET | `/api/wishlists/user/:userId/summary` | Total target + saved + progress % + count |
| POST | `/api/wishlists` | Create wishlist |
| PATCH | `/api/wishlists/:id` | Update wishlist |
| DELETE | `/api/wishlists/:id` | Delete wishlist |

### Budget
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/budgets/user/:userId` | All budgets |
| GET | `/api/budgets/user/:userId/progress` | Budget vs actual spending per category (% isOverBudget, isWarning) |
| POST | `/api/budgets` | Upsert budget (by userId + category) |
| DELETE | `/api/budgets/:id` | Delete budget |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/user/:userId` | Full stats (balance, income, expense, savings, wallets) + category pie data + recent 10 transactions |
| GET | `/api/dashboard/user/:userId/cashflow` | 7-day income vs expense data (for line chart) |

---

## Styling

### Tailwind CSS v4
Uses `@tailwindcss/vite` plugin. Source: `@source '../**/*.{ts,tsx,html}'`. Animations via `tw-animate-css`.

### Theme Tokens (`theme.css`)
- **OKLCH color palette** — light/dark via CSS variables
- **Font scale:** `--text-xs` → `--text-xl`
- **Border radius:** `--radius: 0.625rem` (sm/md/lg/xl)
- **Base font size:** 16px

### Responsive Patterns
| Pattern | Classes |
|---------|---------|
| Header stacking | `flex flex-col sm:flex-row sm:items-center gap-3` |
| List item (mobile) | `flex flex-col sm:flex-row gap-3` |
| Text truncation | `min-w-0 truncate` |
| Amount scaling | `text-xl sm:text-2xl` |
| Grid responsive | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` |
| Dialog mobile-safe | `max-w-[calc(100%-2rem)] max-h-[85vh] overflow-y-auto` |

---

## Documentation (`MIND/`)

```
MIND/
├── PLAN/
│   ├── mobile-responsive-overhaul.md
│   └── wallet-dompet-feature.md
├── TASKS/
│   ├── mobile-responsive-overhaul.md   (all ✅)
│   └── wallet-dompet-feature.md        (all ✅)
├── SUMMARY/
│   ├── mobile-responsive-overhaul.md
│   └── wallet-dompet-feature.md
└── structure-project.md                ← This file
```

---

## Git Branches

### Local & Remote (6 branches)

| Branch | Description | Files Changed |
|--------|-------------|---------------|
| `main` | Initial commit + mobile responsive overhaul | 80 files |
| `tasks/wallet-feature/wallet-dompet-feature/2026-04-12-14-00` | Wallet/Dompet feature | 8 files, +927 lines |
| `tasks/prisma/schema-setup/prisma-schema-all-models/2026-04-12-15-00` | Root Prisma schema | 6 files, +4514 lines |
| `tasks/backend-setup/hono-prisma-api-server/2026-04-12-16-00` | Initial Hono backend (monolithic) | 7 files, +1515 lines |
| `tasks/fix/supabase-import-type-error/2026-04-12-17-00` | Fix `import.meta.env` types | 7 files, +4696 lines |
| `tasks/backend-api/modular-routes-per-feature/2026-04-12-18-00` | Modular backend API (current) | 12 files, +732 lines |

---

## Commands

### Frontend
```bash
npm install          # Install frontend dependencies
npm run dev          # Start Vite dev server (localhost:5173)
npm run build        # Production build
```

### Backend
```bash
cd backend
npm install          # Install backend dependencies
npm run dev          # Start Hono server with hot reload (localhost:3000)
npm run build        # TypeScript compilation
npm run start        # Run compiled JS
npm run db:push      # Push schema to Supabase
npm run db:generate  # Generate Prisma client
npm run db:studio    # Open Prisma Studio (DB GUI)
```

### Prisma (root)
```bash
npx prisma validate     # Validate schema
npx prisma generate     # Generate client
```

---

## Key Decisions & Notes

### Current State
1. **Dual persistence** — Frontend uses `localStorage` (6 keys). Backend API is built and tested but **not yet wired into the frontend**. The migration path is to replace `FinanceContext` localStorage calls with `fetch()` to the backend API.
2. **Backend runs on port 3000**, frontend on 5173. CORS configured for cross-origin.
3. **Prisma singleton** — `backend/src/lib/prisma.ts` prevents multiple instances during HMR.
4. **Atomic transactions** — Wallet balance updates use `prisma.$transaction` to ensure consistency.
5. **No `tsconfig.json`** on frontend — TypeScript compiles via Vite defaults. Backend has full `tsconfig.json` with strict mode.
6. **Supabase client** (`src/lib/supabase.ts`) is fixed but not actively used. Backend connects directly via Prisma.

### Architecture Decisions
- **Hono** over Express — lighter, better TypeScript support, native fetch API
- **tsx watch** — faster dev experience than nodemon + ts-node
- **Per-feature route modules** — each feature has its own file with CRUD + summary endpoints
- **Summary endpoints** — `/monthly-summary`, `/summary`, `/progress`, `/cashflow` pre-compute data for frontend charts
- **Error handler middleware** — maps Prisma errors to HTTP status codes (404, 409, 500)

### Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| **Frontend Framework** | React 18 + TypeScript |
| **Frontend Build** | Vite 6 |
| **Frontend Router** | React Router 7 |
| **Frontend UI** | MUI 7 + Radix UI (38 components) |
| **Frontend Styling** | Tailwind CSS 4 |
| **Frontend Charts** | Recharts 2 |
| **Backend Framework** | Hono |
| **Backend Runtime** | Node.js + @hono/node-server |
| **Backend Dev** | tsx (watch mode) |
| **Database** | PostgreSQL (Supabase) |
| **ORM** | Prisma 6 |
| **State (current)** | React Context + localStorage |
| **Notifications** | Sonner |
| **Animations** | Motion (Framer Motion) |
