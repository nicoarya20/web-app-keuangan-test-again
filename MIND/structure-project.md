# Structure Project — Web-App Keuangan

> Personal Finance Management Web Application (Indonesian Rupiah)  
> Generated from Figma Design · React + TypeScript + Vite + Tailwind CSS v4

---

## Table of Contents

1. [Root Files](#root-files)
2. [Configuration Files](#configuration-files)
3. [Source Code (`src/`)](#source-code-src)
4. [App Architecture](#app-architecture)
5. [Pages](#pages)
6. [Components](#components)
7. [UI Components (shadcn/ui)](#ui-components-shadcnui)
8. [State Management](#state-management)
9. [Database Schema (Prisma)](#database-schema-prisma)
10. [Styling](#styling)
11. [Documentation (`MIND/`)](#documentation-mind)
12. [Key Decisions & Notes](#key-decisions--notes)

---

## Root Files

| File | Purpose |
|------|---------|
| `.env` | Environment variables: `DATABASE_URL`, `DIRECT_URL` (Supabase PostgreSQL) |
| `.gitignore` | Excludes `node_modules/`, `dist/`, `.DS_Store` |
| `ATTRIBUTIONS.md` | Third-party attributions |
| `bun.lock` | Bun lockfile |
| `package-lock.json` | npm lockfile |
| `pnpm-lock.yaml` | pnpm lockfile |
| `index.html` | HTML entry point — mounts `#root`, loads `src/main.tsx` |
| `package.json` | Dependencies, scripts (`dev`, `build`) |
| `postcss.config.mjs` | Empty — Tailwind v4 uses `@tailwindcss/vite` plugin |
| `prisma.config.ts` | Prisma config: schema path, migrations, classic engine |
| `QWEN.md` | AI assistant context for this project |
| `README.md` | Brief setup instructions from Figma Make |
| `vite.config.ts` | Vite config: React + Tailwind plugins, `@` alias |

---

## Configuration Files

### `package.json`

```json
{
  "name": "@figma/my-make-file",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  }
}
```

**Key Dependencies:**
- **Framework:** React 18.3.1, React Router 7.13.0
- **UI:** MUI 7.3.5, 38 Radix UI primitives, Lucide React, Motion
- **Charts:** Recharts 2.15.2
- **Forms:** React Hook Form 7.55.0
- **Dates:** date-fns 3.6.0
- **Notifications:** Sonner 2.0.3
- **Styling:** Tailwind CSS 4.1.12, class-variance-authority, clsx, tailwind-merge

**Dev Dependencies:**
- Vite 6.3.5, @vitejs/plugin-react, @tailwindcss/vite
- Prisma 6.19.3, dotenv

### `vite.config.ts`

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
```

### `prisma.config.ts`

```ts
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  engine: "classic",
  datasource: { url: env("DATABASE_URL") },
})
```

---

## Source Code (`src/`)

```
src/
├── main.tsx                           # Entry point
├── app/
│   ├── App.tsx                        # Root: FinanceProvider + Router + Toaster
│   ├── routes.ts                      # React Router v7 route definitions
│   ├── components/
│   │   ├── Sidebar.tsx                # Responsive sidebar navigation
│   │   ├── Topbar.tsx                 # Top bar: hamburger, search, notifications
│   │   ├── PageTransition.tsx         # Page transition animations
│   │   ├── figma/
│   │   │   └── ImageWithFallback.tsx  # Image component with fallback
│   │   └── ui/                        # 38 shadcn/ui components (see below)
│   ├── context/
│   │   └── FinanceContext.tsx         # Global state: localStorage CRUD
│   ├── layouts/
│   │   └── RootLayout.tsx            # Main layout: Sidebar + Topbar + Outlet
│   └── pages/
│       ├── Dashboard.tsx              # Financial overview with charts
│       ├── IncomePage.tsx             # Income tracking
│       ├── ExpensesPage.tsx           # Expense tracking + budgets
│       ├── WishlistPage.tsx           # Savings goals
│       ├── SavingsPage.tsx            # Savings & investment tracking
│       └── WalletPage.tsx             # Multi-wallet balance management
├── imports/
│   └── pasted_text/
│       └── personal-finance-app.md    # Original Figma Make source spec
├── lib/
│   └── supabase.ts                    # Supabase client (created, not wired)
├── styles/
│   ├── index.css                      # Main stylesheet (imports others)
│   ├── tailwind.css                   # Tailwind v4 imports
│   ├── theme.css                      # Custom design tokens (OKLCH colors)
│   └── fonts.css                      # Font definitions (empty)
└── generated/
    └── prisma/                        # Auto-generated Prisma client types
        ├── browser.ts
        ├── client.ts
        ├── commonInputTypes.ts
        ├── enums.ts
        ├── models.ts
        ├── internal/
        │   ├── class.ts
        │   ├── prismaNamespace.ts
        │   └── prismaNamespaceBrowser.ts
        └── models/
            ├── Budget.ts
            ├── Expense.ts
            ├── Income.ts
            ├── Saving.ts
            ├── User.ts
            ├── Wallet.ts
            ├── WalletTransaction.ts
            └── Wishlist.ts
```

---

## App Architecture

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

### Routing (`routes.ts`)

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `Dashboard` | Financial overview, charts, stats |
| `/income` | `IncomePage` | Income management |
| `/expenses` | `ExpensesPage` | Expense tracking + budgets |
| `/wishlist` | `WishlistPage` | Savings goals |
| `/savings` | `SavingsPage` | Savings & investments |
| `/wallet` | `WalletPage` | Multi-wallet management |

---

## Pages

### `Dashboard.tsx`
- **Stats Cards:** Total wallet balance, income, expenses, saving rate
- **Charts:** Expense pie chart (by category), Cashflow line chart (7 days)
- **Quick Insights:** Highest spending category, budget warnings (80%+)
- **Recent Transactions:** Mixed income + expenses, sorted by date

### `IncomePage.tsx`
- Add income: amount, category, date, recurring toggle, note
- Stats: Total income, Monthly recurring
- List: All incomes with delete

### `ExpensesPage.tsx`
- Add expense: amount, category, date, note, tags (comma-separated)
- Set category budgets via dialog
- Budget progress bars with color-coded warnings (green → amber → red)
- List: All expenses with tags, delete

### `WishlistPage.tsx`
- Add wishlist item: name, target price, current progress, priority, note
- Stats: Total wishlist value, total saved
- Cards: Progress bar, remaining amount, inline update, priority badge
- Grid: 1 col mobile → 2 col desktop

### `SavingsPage.tsx`
- Add saving: amount, goal name, date, type (saving/investment)
- Stats: Total amount, savings, investments
- Growth chart: Cumulative line chart
- Goals breakdown: Grid cards per goal

### `WalletPage.tsx`
- Add wallet: name, type (cash/ewallet/bank), initial balance
- Total balance card (gradient, sum of all wallets)
- Wallet cards: Color-coded by type, top-up/expense buttons, expandable transaction history
- Each transaction: type icon, amount, note, date, delete

---

## Components

### `RootLayout.tsx`
Responsive shell with `Sidebar` + `Topbar` + `<Outlet />`. Main content offset on desktop (`lg:pl-64`).

### `Sidebar.tsx`
- Fixed `w-64`, slides in/out on mobile with overlay
- 6 nav items with active route highlighting
- User profile footer

### `Topbar.tsx`
- Hamburger menu (mobile only)
- Search bar (`hidden sm:flex`)
- Notification bell with red dot

### `PageTransition.tsx`
Wraps page content for animated transitions between routes.

---

## UI Components (shadcn/ui)

38 components in `src/app/components/ui/`, built on Radix UI primitives:

| Component | Base Library | Used In |
|-----------|-------------|---------|
| `accordion.tsx` | Radix Accordion | — (unused) |
| `alert-dialog.tsx` | Radix Alert Dialog | — (unused) |
| `alert.tsx` | — | — (unused) |
| `aspect-ratio.tsx` | Radix Aspect Ratio | — (unused) |
| `avatar.tsx` | Radix Avatar | — (unused) |
| `badge.tsx` | — | — (unused) |
| `breadcrumb.tsx` | — | — (unused) |
| `button.tsx` | CVA variants | **All pages** |
| `calendar.tsx` | Radix + date-fns | — (unused) |
| `card.tsx` | — | **All pages** |
| `carousel.tsx` | Embla Carousel | — (unused) |
| `chart.tsx` | Recharts wrapper | — (unused) |
| `checkbox.tsx` | Radix Checkbox | — (unused) |
| `collapsible.tsx` | Radix Collapsible | — (unused) |
| `command.tsx` | cmdk | — (unused) |
| `context-menu.tsx` | Radix Context Menu | — (unused) |
| `dialog.tsx` | Radix Dialog | **All pages** |
| `drawer.tsx` | vaul | — (unused) |
| `dropdown-menu.tsx` | Radix Dropdown Menu | — (unused) |
| `form.tsx` | React Hook Form | — (unused) |
| `hover-card.tsx` | Radix Hover Card | — (unused) |
| `input-otp.tsx` | input-otp | — (unused) |
| `input.tsx` | — | **All pages** |
| `label.tsx` | Radix Label | **All pages** |
| `menubar.tsx` | Radix Menubar | — (unused) |
| `navigation-menu.tsx` | Radix Nav Menu | — (unused) |
| `pagination.tsx` | — | — (unused) |
| `popover.tsx` | Radix Popover | — (unused) |
| `progress.tsx` | Radix Progress | **Expenses, Wishlist** |
| `radio-group.tsx` | Radix Radio Group | — (unused) |
| `resizable.tsx` | React Resizable Panels | — (unused) |
| `scroll-area.tsx` | Radix Scroll Area | — (unused) |
| `select.tsx` | Radix Select | **All pages** |
| `separator.tsx` | Radix Separator | — (unused) |
| `sheet.tsx` | Radix Dialog (sheet) | — (unused) |
| `sidebar.tsx` | Radix + Context | — (unused, custom Sidebar used) |
| `skeleton.tsx` | — | — (unused) |
| `slider.tsx` | Radix Slider | — (unused) |
| `sonner.tsx` | Sonner | **App.tsx** |
| `switch.tsx` | Radix Switch | **IncomePage** |
| `table.tsx` | — | — (unused) |
| `tabs.tsx` | Radix Tabs | — (unused) |
| `textarea.tsx` | — | **WishlistPage** |
| `toggle.tsx` | Radix Toggle | — (unused) |
| `toggle-group.tsx` | Radix Toggle Group | — (unused) |
| `tooltip.tsx` | Radix Tooltip | — (unused) |
| `use-mobile.ts` | Custom hook | Returns `useIsMobile()` (768px) |
| `utils.ts` | clsx + tailwind-merge | `cn()` utility |

---

## State Management

### `FinanceContext.tsx`

All state is **localStorage-based** with 6 storage keys:

| Key | Data | Demo Records |
|-----|------|-------------|
| `finance_incomes` | Income[] | 2 (Salary, Freelance) |
| `finance_expenses` | Expense[] | 4 (Food, Transport, Bills, Entertainment) |
| `finance_wishlist` | WishlistItem[] | 2 (MacBook Pro, Bali Vacation) |
| `finance_savings` | Saving[] | 2 (Emergency Fund, Stock Investment) |
| `finance_wallets` | Wallet[] | 3 (Dompet Fisik, GoPay, BCA) |
| `finance_budgets` | Record\<string, number\> | 3 (Food, Transport, Entertainment) |

**CRUD Operations per entity:**
- `add*()` — generates ID via `Date.now().toString()`
- `delete*()` — filters by ID
- `updateWishlistItem()` — partial update
- `addWalletTransaction()` — adds tx, updates `currentBalance`
- `deleteWalletTransaction()` — removes tx, recalculates balance
- `setCategoryBudget()` — sets budget for a category

### Data Models (TypeScript)

```typescript
interface Income {
  id: string; amount: number; category: string;
  date: string; recurring: boolean; note?: string;
}
interface Expense {
  id: string; amount: number; category: string;
  date: string; note?: string; tags?: string[];
}
interface WishlistItem {
  id: string; name: string; targetPrice: number;
  currentProgress: number; priority: 'low'|'medium'|'high'; note?: string;
}
interface Saving {
  id: string; amount: number; goalName: string;
  date: string; type: 'saving'|'investment';
}
interface Wallet {
  id: string; name: string; walletType: 'cash'|'ewallet'|'bank';
  initialBalance: number; currentBalance: number;
  transactions: WalletTransaction[];
}
interface WalletTransaction {
  id: string; type: 'topup'|'expense'; amount: number;
  note?: string; date: string;
}
```

---

## Database Schema (Prisma)

**Status:** Schema defined, client generated, **not yet wired into app**.  
**Provider:** PostgreSQL (Supabase)  
**Models:** 8 models + 5 enums

### Entity Relationship Diagram

```
User (1) ──┬── (M) Income
           ├── (M) Expense  (tags: String[])
           ├── (M) Wishlist (priority: LOW | MEDIUM | HIGH)
           ├── (M) Saving   (type: SAVING | INVESTMENT)
           ├── (M) Budget   (unique: userId + category)
           └── (M) Wallet (type: CASH | EWALLET | BANK)
                     └── (M) WalletTransaction (type: TOPUP | EXPENSE)
```

### Design Decisions

| Decision | Rationale |
|----------|-----------|
| `amount` as `Int` | Stored as whole Rupiah (no decimals) |
| `String[]` for Expense tags | PostgreSQL native arrays |
| `currentBalance @default(0)` on Wallet | Computed by app from transactions |
| `@@unique([userId, category])` on Budget | One budget per category per user |
| `onDelete: Cascade` | Deleting parent cleans up children |
| Indexes on `[userId, date]` and `[userId, category]` | Optimizes monthly filtering & category grouping |
| `@map("snake_case")` | Clean table names in database |

---

## Styling

### Tailwind CSS v4

Uses `@tailwindcss/vite` plugin (no PostCSS). Configuration in `src/styles/tailwind.css`:

```css
@import 'tailwindcss' source(none);
@source '../**/*.{ts,tsx,html}';
@import 'tw-animate-css';
```

### Theme Tokens (`theme.css`)

- **OKLCH color palette** — light/dark mode via CSS variables
- **Font scale** — `--text-xs` through `--text-xl`
- **Border radius** — `--radius: 0.625rem` (sm/md/lg/xl variants)
- **Base font size:** 16px

### Design Patterns

| Pattern | Example Classes |
|---------|----------------|
| Card | `bg-white rounded-2xl shadow-sm` |
| Button | `bg-indigo-600 hover:bg-indigo-700 rounded-xl` |
| Input | `rounded-xl text-base md:text-sm` |
| Dialog | `max-w-[calc(100%-2rem)] max-h-[85vh] overflow-y-auto` |
| Stat card | `p-5 bg-white rounded-2xl shadow-sm` |
| Responsive header | `flex flex-col sm:flex-row sm:items-center gap-3` |
| List item (mobile) | `flex flex-col sm:flex-row gap-3` |

---

## Documentation (`MIND/`)

```
MIND/
├── PLAN/
│   ├── mobile-responsive-overhaul.md   # Plan for responsive fix
│   └── wallet-dompet-feature.md        # Plan for wallet feature
├── TASKS/
│   ├── mobile-responsive-overhaul.md   # Task checklist (all ✅)
│   └── wallet-dompet-feature.md        # Task checklist (all ✅)
└── SUMMARY/
    ├── mobile-responsive-overhaul.md   # Summary of responsive changes
    └── wallet-dompet-feature.md        # Summary of wallet feature
```

---

## Key Decisions & Notes

### Current State
1. **localStorage-only** — All data persists in browser. Supabase + Prisma backend is configured but **not integrated** into app logic.
2. **No `tsconfig.json`** — TypeScript compiles via Vite defaults.
3. **Generated by Figma Make** — `@figma/my-make-file` name, `src/imports/pasted_text/personal-finance-app.md` as original spec.
4. **Currency:** Indonesian Rupiah (`id-ID` locale), whole integers.
5. **Mixed language:** UI text is English + Indonesian (Wallet page heavily uses Indonesian).

### Git Branches
| Branch | Description |
|--------|-------------|
| `main` | Initial commit + mobile responsive overhaul |
| `tasks/wallet-feature/...` | Wallet/dompet feature |
| `tasks/prisma/schema-setup/...` | Prisma schema setup |

### Unused Components
24 of 38 UI components are **not used** in any page. They are available scaffold for future features:
`accordion`, `alert-dialog`, `alert`, `aspect-ratio`, `avatar`, `badge`, `breadcrumb`, `calendar`, `carousel`, `chart`, `checkbox`, `collapsible`, `command`, `context-menu`, `drawer`, `dropdown-menu`, `form`, `hover-card`, `input-otp`, `menubar`, `navigation-menu`, `pagination`, `popover`, `radio-group`, `resizable`, `scroll-area`, `separator`, `sheet`, `sidebar` (shadcn), `skeleton`, `slider`, `table`, `tabs`, `toggle`, `toggle-group`, `tooltip`.

### Commands

```bash
# Install
npm install

# Dev server
npm run dev

# Production build
npm run build

# Prisma
npx prisma validate     # Validate schema
npx prisma generate     # Generate client
npx prisma db push      # Push schema to DB
npx prisma studio       # Open DB GUI
```
