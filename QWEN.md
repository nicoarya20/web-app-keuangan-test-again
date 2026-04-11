# Web-App Keuangan (Finance Web App)

## Project Overview

A personal finance management web application built with React, TypeScript, and Tailwind CSS. The app was generated from a Figma design (["Buat Web-App dari Markdown"](https://www.figma.com/design/ctiGWogwkMBHuOERpVxaNg/Buat-Web-App-dari-Markdown)) and provides tools for tracking income, expenses, wishlist items, and savings.

### Key Features

- **Dashboard** — Overview of financial data with charts and summaries
- **Income Tracking** — Record and categorize income sources (salary, freelance, etc.)
- **Expense Tracking** — Log expenses with categories, notes, and tags
- **Wishlist Management** — Track savings goals for items with progress tracking
- **Savings & Investments** — Monitor savings and investment contributions
- **Budget Management** — Set category-based budgets via localStorage persistence

### Architecture

- **State Management**: React Context API (`FinanceContext`) with localStorage persistence
- **Routing**: React Router v7 with nested route structure
- **UI Components**: MUI (Material-UI), Radix UI primitives, and custom Tailwind-styled components
- **Charts**: Recharts for data visualization
- **Styling**: Tailwind CSS v4 with custom theme tokens

## Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | React 18 + TypeScript |
| Build Tool | Vite 6 |
| Routing | React Router v7 |
| UI Library | MUI (Material-UI) v7, Radix UI |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| Forms | React Hook Form |
| Notifications | Sonner |
| Animations | Motion (Framer Motion) |
| Icons | Lucide React, MUI Icons |

## Project Structure

```
src/
├── main.tsx                  # Entry point
├── app/
│   ├── App.tsx               # Root app with providers and router
│   ├── routes.ts             # Route definitions
│   ├── components/
│   │   ├── figma/            # Figma-generated components
│   │   ├── ui/               # Reusable UI components (Radix-based)
│   │   ├── Sidebar.tsx       # Navigation sidebar
│   │   ├── Topbar.tsx        # Top navigation bar
│   │   └── PageTransition.tsx # Page transition animations
│   ├── context/
│   │   └── FinanceContext.tsx # Global finance state management
│   ├── layouts/
│   │   └── RootLayout.tsx    # Main app layout with sidebar/topbar
│   └── pages/
│       ├── Dashboard.tsx     # Home/overview page
│       ├── IncomePage.tsx    # Income management
│       ├── ExpensesPage.tsx  # Expense management
│       ├── WishlistPage.tsx  # Wishlist goals tracking
│       └── SavingsPage.tsx   # Savings & investments
├── imports/                  # Static asset imports
└── styles/
    ├── index.css             # Main stylesheet (imports tailwind, theme, fonts)
    ├── tailwind.css          # Tailwind configuration
    ├── theme.css             # Custom theme tokens
    └── fonts.css             # Font definitions
```

## Building and Running

### Prerequisites

- Node.js (compatible with the project's dependencies)
- npm, pnpm, or bun (package.json present, bun.lock exists indicating bun is used)

### Commands

```bash
# Install dependencies
npm install
# or
bun install

# Start development server
npm run dev
# or
bun run dev

# Build for production
npm run build
# or
bun run build
```

The development server runs via Vite with hot module replacement (HMR).

## Data Models

### Income
```typescript
interface Income {
  id: string;
  amount: number;
  category: string;
  date: string;
  recurring: boolean;
  note?: string;
}
```

### Expense
```typescript
interface Expense {
  id: string;
  amount: number;
  category: string;
  date: string;
  note?: string;
  tags?: string[];
}
```

### Wishlist Item
```typescript
interface WishlistItem {
  id: string;
  name: string;
  targetPrice: number;
  currentProgress: number;
  priority: 'low' | 'medium' | 'high';
  note?: string;
}
```

### Saving
```typescript
interface Saving {
  id: string;
  amount: number;
  goalName: string;
  date: string;
  type: 'saving' | 'investment';
}
```

## State Management

All financial data is managed through `FinanceContext` using React's `useState` with lazy initialization from `localStorage`. Data persists across sessions. The context provides:

- CRUD operations for all entity types (incomes, expenses, wishlist, savings)
- Category budget management
- Demo data seeded when localStorage is empty

## Development Conventions

- **Path Aliases**: `@` is aliased to `src/` for cleaner imports
- **Component Structure**: Pages are at the route level; reusable components in `components/ui`
- **Currency**: Indonesian Rupiah (IDR) — amounts are stored as raw numbers
- **Date Format**: ISO date strings (`YYYY-MM-DD`)
- **UI Components**: Leverages Radix UI primitives for accessible, composable components
- **Styling**: Tailwind CSS utility classes with custom theme tokens
