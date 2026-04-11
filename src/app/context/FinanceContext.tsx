import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api } from '../../lib/api'
import type {
  Income as ApiIncome,
  Expense as ApiExpense,
  Wishlist as ApiWishlist,
  Saving as ApiSaving,
  Wallet as ApiWallet,
  WalletTransaction as ApiWalletTransaction,
  Budget as ApiBudget,
} from '../../lib/api'

// ============================================================
// FRONTEND-FRIENDLY INTERFACES (matching existing page contracts)
// ============================================================

export interface Income {
  id: string
  amount: number
  category: string
  date: string
  recurring: boolean
  note?: string
}

export interface Expense {
  id: string
  amount: number
  category: string
  date: string
  note?: string
  tags?: string[]
}

export interface WishlistItem {
  id: string
  name: string
  targetPrice: number
  currentProgress: number
  priority: 'low' | 'medium' | 'high'
  note?: string
}

export interface Saving {
  id: string
  amount: number
  goalName: string
  date: string
  type: 'saving' | 'investment'
}

export interface WalletTransaction {
  id: string
  type: 'topup' | 'expense'
  amount: number
  note?: string
  date: string
}

export interface Wallet {
  id: string
  name: string
  walletType: 'cash' | 'ewallet' | 'bank'
  initialBalance: number
  currentBalance: number
  transactions: WalletTransaction[]
}

// ============================================================
// CONTEXT TYPE
// ============================================================

interface FinanceContextType {
  userId: string | null
  incomes: Income[]
  expenses: Expense[]
  wishlist: WishlistItem[]
  savings: Saving[]
  wallets: Wallet[]
  categoryBudgets: Record<string, number>
  addIncome: (income: Omit<Income, 'id'>) => Promise<void>
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>
  addWishlistItem: (item: Omit<WishlistItem, 'id'>) => Promise<void>
  addSaving: (saving: Omit<Saving, 'id'>) => Promise<void>
  addWallet: (wallet: Omit<Wallet, 'id' | 'currentBalance' | 'transactions'>) => Promise<void>
  addWalletTransaction: (walletId: string, tx: Omit<WalletTransaction, 'id'>) => Promise<void>
  updateWishlistItem: (id: string, updates: Partial<WishlistItem>) => Promise<void>
  deleteIncome: (id: string) => Promise<void>
  deleteExpense: (id: string) => Promise<void>
  deleteWishlistItem: (id: string) => Promise<void>
  deleteSaving: (id: string) => Promise<void>
  deleteWallet: (id: string) => Promise<void>
  deleteWalletTransaction: (walletId: string, txId: string) => Promise<void>
  setCategoryBudget: (category: string, budget: number) => Promise<void>
  loading: boolean
  error: string | null
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined)

// ============================================================
// HELPERS — map between API types and frontend types
// ============================================================

function mapIncome(api: ApiIncome): Income {
  return {
    id: api.id,
    amount: api.amount,
    category: api.category,
    date: api.date.split('T')[0],
    recurring: api.recurring,
    note: api.note || undefined,
  }
}

function mapExpense(api: ApiExpense): Expense {
  return {
    id: api.id,
    amount: api.amount,
    category: api.category,
    date: api.date.split('T')[0],
    note: api.note || undefined,
    tags: api.tags || [],
  }
}

function mapWishlist(api: ApiWishlist): WishlistItem {
  return {
    id: api.id,
    name: api.name,
    targetPrice: api.targetPrice,
    currentProgress: api.currentProgress,
    priority: api.priority.toLowerCase() as 'low' | 'medium' | 'high',
    note: api.note || undefined,
  }
}

function mapSaving(api: ApiSaving): Saving {
  return {
    id: api.id,
    amount: api.amount,
    goalName: api.goalName,
    date: api.date.split('T')[0],
    type: api.type.toLowerCase() as 'saving' | 'investment',
  }
}

function mapWallet(api: ApiWallet): Wallet {
  return {
    id: api.id,
    name: api.name,
    walletType: api.walletType.toLowerCase() as 'cash' | 'ewallet' | 'bank',
    initialBalance: api.initialBalance,
    currentBalance: api.currentBalance,
    transactions: api.transactions.map(mapWalletTransaction),
  }
}

function mapWalletTransaction(api: ApiWalletTransaction): WalletTransaction {
  return {
    id: api.id,
    type: api.type.toLowerCase() as 'topup' | 'expense',
    amount: api.amount,
    note: api.note || undefined,
    date: api.date.split('T')[0],
  }
}

function mapBudget(api: ApiBudget) {
  return { category: api.category, amount: api.amount }
}

// ============================================================
// USER INITIALIZATION
// ============================================================

const USER_STORAGE_KEY = 'finance_user_id'

async function getOrCreateUser(): Promise<string> {
  const stored = localStorage.getItem(USER_STORAGE_KEY)
  if (stored) return stored

  const demoEmail = `user_${Date.now()}@demo.local`
  const user = await api.user.create({ email: demoEmail, name: 'Demo User' })
  localStorage.setItem(USER_STORAGE_KEY, user.id)
  return user.id
}

// ============================================================
// PROVIDER
// ============================================================

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userId, setUserId] = useState<string | null>(null)
  const [incomes, setIncomes] = useState<Income[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [wishlist, setWishlist] = useState<WishlistItem[]>([])
  const [savings, setSavings] = useState<Saving[]>([])
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize user and fetch data
  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        const uid = await getOrCreateUser()
        if (cancelled) return
        setUserId(uid)

        // Fetch all data in parallel
        const [incomesRes, expensesRes, wishlistRes, savingsRes, walletsRes, budgetsRes] =
          await Promise.all([
            api.income.list(uid),
            api.expense.list(uid),
            api.wishlist.list(uid),
            api.saving.list(uid),
            api.wallet.list(uid),
            api.budget.list(uid),
          ])

        if (cancelled) return
        setIncomes(incomesRes.map(mapIncome))
        setExpenses(expensesRes.map(mapExpense))
        setWishlist(wishlistRes.map(mapWishlist))
        setSavings(savingsRes.map(mapSaving))
        setWallets(walletsRes.map(mapWallet))
        const budgetMap: Record<string, number> = {}
        budgetsRes.forEach((b) => {
          const mapped = mapBudget(b)
          budgetMap[mapped.category] = mapped.amount
        })
        setCategoryBudgets(budgetMap)
      } catch (err) {
        if (cancelled) return
        const msg = err instanceof Error ? err.message : 'Failed to load data'
        setError(msg)
        console.error('[FinanceContext] Init error:', msg)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    init()
    return () => { cancelled = true }
  }, [])

  // CRUD Operations
  const addIncome = useCallback(
    async (income: Omit<Income, 'id'>) => {
      if (!userId) return
      const created = await api.income.create({
        userId,
        amount: income.amount,
        category: income.category,
        date: income.date,
        recurring: income.recurring,
        note: income.note,
      })
      setIncomes((prev) => [mapIncome(created), ...prev])
    },
    [userId]
  )

  const addExpense = useCallback(
    async (expense: Omit<Expense, 'id'>) => {
      if (!userId) return
      const created = await api.expense.create({
        userId,
        amount: expense.amount,
        category: expense.category,
        date: expense.date,
        note: expense.note,
        tags: expense.tags,
      })
      setExpenses((prev) => [mapExpense(created), ...prev])
    },
    [userId]
  )

  const addWishlistItem = useCallback(
    async (item: Omit<WishlistItem, 'id'>) => {
      if (!userId) return
      const created = await api.wishlist.create({
        userId,
        name: item.name,
        targetPrice: item.targetPrice,
        currentProgress: item.currentProgress,
        priority: item.priority.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH',
        note: item.note,
      })
      setWishlist((prev) => [mapWishlist(created), ...prev])
    },
    [userId]
  )

  const addSaving = useCallback(
    async (saving: Omit<Saving, 'id'>) => {
      if (!userId) return
      const created = await api.saving.create({
        userId,
        amount: saving.amount,
        goalName: saving.goalName,
        date: saving.date,
        type: saving.type.toUpperCase() as 'SAVING' | 'INVESTMENT',
      })
      setSavings((prev) => [mapSaving(created), ...prev])
    },
    [userId]
  )

  const addWallet = useCallback(
    async (wallet: Omit<Wallet, 'id' | 'currentBalance' | 'transactions'>) => {
      if (!userId) return
      const created = await api.wallet.create({
        userId,
        name: wallet.name,
        walletType: wallet.walletType.toUpperCase() as 'CASH' | 'EWALLET' | 'BANK',
        initialBalance: wallet.initialBalance,
      })
      setWallets((prev) => [...prev, mapWallet(created)])
    },
    [userId]
  )

  const addWalletTransaction = useCallback(
    async (walletId: string, tx: Omit<WalletTransaction, 'id'>) => {
      const result = await api.walletTx.create({
        walletId,
        type: tx.type.toUpperCase() as 'TOPUP' | 'EXPENSE',
        amount: tx.amount,
        note: tx.note,
        date: tx.date,
      })
      setWallets((prev) =>
        prev.map((w) => (w.id === walletId ? mapWallet(result.wallet) : w))
      )
    },
    []
  )

  const updateWishlistItem = useCallback(
    async (id: string, updates: Partial<WishlistItem>) => {
      const apiUpdates: Record<string, unknown> = { ...updates }
      if (updates.priority) {
        apiUpdates.priority = updates.priority.toUpperCase()
      }
      const updated = await api.wishlist.update(id, apiUpdates)
      setWishlist((prev) =>
        prev.map((item) => (item.id === id ? mapWishlist(updated) : item))
      )
    },
    []
  )

  const deleteIncome = useCallback(
    async (id: string) => {
      await api.income.delete(id)
      setIncomes((prev) => prev.filter((item) => item.id !== id))
    },
    []
  )

  const deleteExpense = useCallback(
    async (id: string) => {
      await api.expense.delete(id)
      setExpenses((prev) => prev.filter((item) => item.id !== id))
    },
    []
  )

  const deleteWishlistItem = useCallback(
    async (id: string) => {
      await api.wishlist.delete(id)
      setWishlist((prev) => prev.filter((item) => item.id !== id))
    },
    []
  )

  const deleteSaving = useCallback(
    async (id: string) => {
      await api.saving.delete(id)
      setSavings((prev) => prev.filter((item) => item.id !== id))
    },
    []
  )

  const deleteWallet = useCallback(
    async (id: string) => {
      await api.wallet.delete(id)
      setWallets((prev) => prev.filter((w) => w.id !== id))
    },
    []
  )

  const deleteWalletTransaction = useCallback(
    async (_walletId: string, txId: string) => {
      await api.walletTx.delete(txId)
      // Refresh wallets to get updated balances
      if (!userId) return
      const walletsRes = await api.wallet.list(userId)
      setWallets(walletsRes.map(mapWallet))
    },
    [userId]
  )

  const setCategoryBudget = useCallback(
    async (category: string, budget: number) => {
      if (!userId) return
      await api.budget.create({ userId, category, amount: budget })
      setCategoryBudgets((prev) => ({ ...prev, [category]: budget }))
    },
    [userId]
  )

  return (
    <FinanceContext.Provider
      value={{
        userId,
        incomes,
        expenses,
        wishlist,
        savings,
        wallets,
        categoryBudgets,
        addIncome,
        addExpense,
        addWishlistItem,
        addSaving,
        addWallet,
        addWalletTransaction,
        updateWishlistItem,
        deleteIncome,
        deleteExpense,
        deleteWishlistItem,
        deleteSaving,
        deleteWallet,
        deleteWalletTransaction,
        setCategoryBudget,
        loading,
        error,
      }}
    >
      {children}
    </FinanceContext.Provider>
  )
}

export const useFinance = () => {
  const context = useContext(FinanceContext)
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider')
  }
  return context
}
