# Plan: Wallet / Dompet Feature

## Objective

Add a new "Wallet" (Dompet) feature that allows users to track their physical/digital wallet balances. Users can add wallets with initial balances, then add or subtract money (top-up, expense, transfer) and see the total balance across all wallets.

## Feature Description

A **Wallet** represents a place where the user stores money. Examples:
- Physical cash wallet (dompet fisik)
- E-wallet (GoPay, OVO, Dana, ShopeePay)
- Bank account (BCA, Mandiri, BNI)

Each wallet has:
- **Name** (e.g., "Dompet Fisik", "GoPay", "BCA")
- **Icon/Type** (cash, ewallet, bank)
- **Current Balance**
- **Currency** (default: IDR)

Each wallet tracks a **transaction history**:
- **Top Up** (add money) — increases balance
- **Expense** (remove money) — decreases balance

The page shows:
1. **Total balance card** — sum of all wallet balances
2. **Wallet cards grid** — each wallet shows name, icon, and current balance
3. **Add Wallet dialog** — form to create a new wallet
4. **Wallet detail** — expand or tap to see transaction history, with option to add top-up or expense

## Data Model

```typescript
interface WalletTransaction {
  id: string;
  type: 'topup' | 'expense';
  amount: number;
  note?: string;
  date: string;
}

interface Wallet {
  id: string;
  name: string;
  type: 'cash' | 'ewallet' | 'bank';
  initialBalance: number;
  currentBalance: number;
  transactions: WalletTransaction[];
}
```

## Context Changes

Add to `FinanceContext.tsx`:
- `wallets: Wallet[]` state (persisted to localStorage as `finance_wallets`)
- Demo data: 2-3 sample wallets
- `addWallet(wallet)` — create new wallet with initial balance
- `deleteWallet(id)` — remove wallet
- `addWalletTransaction(walletId, transaction)` — add top-up or expense, update balance
- `deleteWalletTransaction(walletId, transactionId)` — remove a transaction, revert balance

## Route & Navigation

- New route: `/wallet` → `WalletPage`
- New sidebar nav item: "Wallet" with `Wallet` icon from lucide-react
- Same `RootLayout` pattern as other pages

## Page Layout (WalletPage)

```
┌──────────────────────────────────┐
│ Wallet                    [+ Add]│
│ Kelola saldo dompet Anda         │
├──────────────────────────────────┤
│ ┌──────────────────────────────┐ │
│ │ Total Saldo                  │ │
│ │ Rp 2,500,000                 │ │
│ │ 3 dompet aktif               │ │
│ └──────────────────────────────┘ │
├──────────────────────────────────┤
│ Dompet Anda                      │
├──────────────────────────────────┤
│ ┌─────────────────┐ ┌──────────┐ │
│ │ 💰 Dompet Fisik │ │ 📱 GoPay │ │
│ │ Rp 500,000      │ │ Rp 150K  │ │
│ │ [+ Tambah] [-]  │ │ [+][-]   │ │
│ └─────────────────┘ └──────────┘ │
│ ┌─────────────────┐              │
│ │ 🏦 BCA          │              │
│ │ Rp 1,850,000    │              │
│ │ [+ Tambah] [-]  │              │
│ └─────────────────┘              │
└──────────────────────────────────┘
```

### Interactions
- **"+ Add Wallet" button** — opens dialog to create new wallet (name, type, initial balance)
- **"+ Tambah" button on each card** — opens quick dialog to add top-up
- **"- Kurang" button on each card** — opens quick dialog to record expense
- **Transaction list** — expandable below each wallet card showing history
- **Delete wallet** — confirmation dialog

## Files to Create

1. `src/app/pages/WalletPage.tsx` — new page component

## Files to Modify

1. `src/app/context/FinanceContext.tsx` — add wallet state and CRUD operations
2. `src/app/routes.ts` — add `/wallet` route
3. `src/app/components/Sidebar.tsx` — add "Wallet" nav item
4. `src/app/pages/Dashboard.tsx` — optionally show total wallet balance in stats

## Design Decisions

- **Wallet balance = initialBalance + sum(topups) - sum(expenses)** — balance is computed from transactions for accuracy
- **Transactions are immutable** — add/delete only, no editing (simpler, auditable)
- **Single dialog approach** — one dialog for top-up/expense to keep it clean
- **Responsive from the start** — use patterns established in mobile overhaul (flex-col, truncation, etc.)
