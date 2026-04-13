const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Include cookies for auth
    ...options,
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(error.error || `HTTP ${res.status}`)
  }

  return res.json() as Promise<T>
}

// ============================================================
// TYPES (mirroring backend Prisma models)
// ============================================================

export interface Income {
  id: string
  userId: string
  amount: number
  category: string
  date: string
  recurring: boolean
  note: string | null
  createdAt: string
}

export interface Expense {
  id: string
  userId: string
  amount: number
  category: string
  date: string
  note: string | null
  tags: string[]
  createdAt: string
}

export interface Wishlist {
  id: string
  userId: string
  name: string
  targetPrice: number
  currentProgress: number
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  note: string | null
  createdAt: string
  updatedAt: string
}

export interface Saving {
  id: string
  userId: string
  amount: number
  goalName: string
  date: string
  type: 'SAVING' | 'INVESTMENT'
  createdAt: string
}

export interface Wallet {
  id: string
  userId: string
  name: string
  walletType: 'CASH' | 'EWALLET' | 'BANK'
  initialBalance: number
  currentBalance: number
  transactions: WalletTransaction[]
  createdAt: string
  updatedAt: string
}

export interface WalletTransaction {
  id: string
  walletId: string
  type: 'TOPUP' | 'EXPENSE'
  amount: number
  note: string | null
  date: string
  createdAt: string
}

export interface Budget {
  id: string
  userId: string
  category: string
  amount: number
  createdAt: string
  updatedAt: string
}

// ============================================================
// SUMMARY TYPES
// ============================================================

export interface IncomeMonthlySummary {
  totalIncome: number
  recurringIncome: number
  categoryBreakdown: { category: string; total: number; count: number }[]
}

export interface ExpenseMonthlySummary {
  totalExpense: number
  transactionCount: number
  categoryBreakdown: { category: string; total: number; count: number }[]
  recentTransactions: Expense[]
}

export interface WalletTotalBalance {
  totalBalance: number
  walletCount: number
}

export interface SavingsSummary {
  totalSavings: number
  totalInvestments: number
  totalAmount: number
  goalBreakdown: { goalName: string; total: number }[]
  growthData: { date: string; total: number }[]
}

export interface WishlistSummary {
  totalTargetValue: number
  totalSaved: number
  progressPercent: number
  itemCount: number
}

export interface BudgetProgress {
  category: string
  budget: number
  spent: number
  percentage: number
  remaining: number
  isOverBudget: boolean
  isWarning: boolean
}

export interface DashboardStats {
  totalBalance: number
  totalIncome: number
  totalExpense: number
  totalSavings: number
  totalWalletBalance: number
  activeWallets: number
  savingRate: number
}

export interface DashboardData {
  stats: DashboardStats
  expensesByCategory: { category: string; total: number }[]
  recentTransactions: Record<string, unknown>[]
}

export type CashflowDay = { date: string; income: number; expense: number }

// ============================================================
// API FUNCTIONS (organized by feature)
// ============================================================

export const api = {
  // --- USER ---
  user: {
    create: (data: { email: string; name?: string }) =>
      request<{ id: string; email: string; name: string | null }>('/users', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getById: (id: string) =>
      request<{ id: string; email: string; name: string | null }>(`/users/${id}`),
    getByEmail: (email: string) =>
      request<{ id: string; email: string; name: string | null }>(`/users/email/${email}`),
  },

  // --- INCOME ---
  income: {
    list: () => request<Income[]>('/incomes'),
    monthlySummary: () =>
      request<IncomeMonthlySummary>('/incomes/monthly-summary'),
    create: (data: { amount: number; category: string; date: string; recurring: boolean; note?: string }) =>
      request<Income>('/incomes', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Income>) =>
      request<Income>(`/incomes/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/incomes/${id}`, { method: 'DELETE' }),
  },

  // --- EXPENSE ---
  expense: {
    list: () => request<Expense[]>('/expenses'),
    monthlySummary: () =>
      request<ExpenseMonthlySummary>('/expenses/monthly-summary'),
    create: (data: { amount: number; category: string; date: string; note?: string; tags?: string[] }) =>
      request<Expense>('/expenses', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Expense>) =>
      request<Expense>(`/expenses/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/expenses/${id}`, { method: 'DELETE' }),
  },

  // --- WALLET ---
  wallet: {
    list: () => request<Wallet[]>('/wallets'),
    totalBalance: () =>
      request<WalletTotalBalance>('/wallets/total-balance'),
    create: (data: { name: string; walletType: 'CASH' | 'EWALLET' | 'BANK'; initialBalance: number }) =>
      request<Wallet>('/wallets', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Wallet>) =>
      request<Wallet>(`/wallets/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/wallets/${id}`, { method: 'DELETE' }),
  },

  // --- WALLET TRANSACTION ---
  walletTx: {
    create: (data: { walletId: string; type: 'TOPUP' | 'EXPENSE'; amount: number; note?: string; date: string }) =>
      request<{ transaction: WalletTransaction; wallet: Wallet }>('/wallets/transactions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/wallets/transactions/${id}`, { method: 'DELETE' }),
  },

  // --- SAVING ---
  saving: {
    list: () => request<Saving[]>('/savings'),
    summary: () =>
      request<SavingsSummary>('/savings/summary'),
    create: (data: { amount: number; goalName: string; date: string; type: 'SAVING' | 'INVESTMENT' }) =>
      request<Saving>('/savings', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/savings/${id}`, { method: 'DELETE' }),
  },

  // --- WISHLIST ---
  wishlist: {
    list: () => request<Wishlist[]>('/wishlists'),
    summary: () =>
      request<WishlistSummary>('/wishlists/summary'),
    create: (data: { name: string; targetPrice: number; currentProgress: number; priority: 'LOW' | 'MEDIUM' | 'HIGH'; note?: string }) =>
      request<Wishlist>('/wishlists', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Wishlist>) =>
      request<Wishlist>(`/wishlists/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/wishlists/${id}`, { method: 'DELETE' }),
  },

  // --- BUDGET ---
  budget: {
    list: () => request<Budget[]>('/budgets'),
    progress: () =>
      request<BudgetProgress[]>('/budgets/progress'),
    create: (data: { category: string; amount: number }) =>
      request<Budget>('/budgets', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/budgets/${id}`, { method: 'DELETE' }),
  },

  // --- DASHBOARD ---
  dashboard: {
    get: () =>
      request<DashboardData>('/dashboard'),
    cashflow: () =>
      request<CashflowDay[]>('/dashboard/cashflow'),
  },
}
