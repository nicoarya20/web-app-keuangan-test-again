# Task: Wallet / Dompet Feature

## Overview

Add a new "Wallet" (Dompet) menu/page for tracking wallet balances (cash, e-wallet, bank accounts) with transaction history.

## Subtasks

### Task 1: Extend FinanceContext with Wallet State
**File:** `src/app/context/FinanceContext.tsx`

- Add `WalletTransaction` and `Wallet` interfaces
- Add `wallets` state with localStorage persistence (`finance_wallets`)
- Add demo data: 3 wallets (Dompet Fisik, GoPay, BCA)
- CRUD functions:
  - `addWallet(wallet)` — create wallet
  - `deleteWallet(id)` — remove wallet
  - `addWalletTransaction(walletId, tx)` — add top-up/expense, update currentBalance
  - `deleteWalletTransaction(walletId, txId)` — delete transaction, recalculate balance
- Export in context value and `useFinance()` hook

### Task 2: Create WalletPage Component
**File:** `src/app/pages/WalletPage.tsx` (new file)

Layout:
- Header: "Wallet" title + "+ Add Wallet" button
- Total balance card: sum of all wallet balances
- Wallet cards grid: responsive grid showing each wallet's name, type icon, balance
- Each card has: "+ Top Up" and "- Expense" buttons
- Expandable transaction history below each wallet card
- Delete wallet option

Dialogs:
- Add Wallet dialog: name, type (cash/ewallet/bank), initial balance
- Add Transaction dialog: amount, type (topup/expense), note, date

Responsive:
- Mobile-first patterns from existing overhaul
- `flex-col sm:flex-row` headers
- `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` for wallet cards
- Text truncation, responsive font sizes

### Task 3: Add Wallet Route
**File:** `src/app/routes.ts`

- Import `WalletPage`
- Add `{ path: 'wallet', Component: WalletPage }` to routes

### Task 4: Add Wallet to Sidebar Navigation
**File:** `src/app/components/Sidebar.tsx`

- Import `Wallet` icon from lucide-react
- Add nav item: `{ path: '/wallet', label: 'Wallet', icon: Wallet }`

### Task 5: Add Wallet Summary to Dashboard (Optional)
**File:** `src/app/pages/Dashboard.tsx`

- Optionally add wallet total to the stats cards or show it in existing cards

## Execution Order

1. ✅ Task 1: Extend FinanceContext
2. ✅ Task 2: Create WalletPage
3. ✅ Task 3: Add Route
4. ✅ Task 4: Update Sidebar
5. ✅ Task 5: Dashboard update (optional)

## Acceptance Criteria

- [x] Wallet page accessible at `/wallet` route
- [x] Sidebar shows "Wallet" nav item with icon
- [x] Users can add new wallets with name, type, initial balance
- [x] Wallet cards show current balance correctly
- [x] Total balance card shows sum of all wallets
- [x] Users can add top-up transactions (increases balance)
- [x] Users can add expense transactions (decreases balance)
- [x] Transaction history is visible per wallet
- [x] Users can delete wallets and transactions
- [x] Data persists in localStorage
- [x] Responsive on mobile (no horizontal scroll)
- [x] Build passes without errors
