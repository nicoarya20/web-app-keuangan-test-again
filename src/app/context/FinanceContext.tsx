import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useSession } from '../../lib/auth'
import { api, isDuplicateError } from '../../lib/api'
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
  walletId?: string | null
}

export interface Expense {
  id: string
  amount: number
  category: string
  date: string
  note?: string
  tags?: string[]
  walletId?: string | null
}

export interface WishlistItem {
  id: string
  name: string
  targetPrice: number
  currentProgress: number
  priority: 'low' | 'medium' | 'high'
  note?: string
  walletId?: string | null
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
  type: 'topup' | 'expense' | 'transfer_out' | 'transfer_in' | 'wishlist_fund'
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
  addIncome: (income: Omit<Income, 'id'>, idempotencyKey?: string) => Promise<void>
  addExpense: (expense: Omit<Expense, 'id'>, idempotencyKey?: string) => Promise<void>
  addWishlistItem: (item: Omit<WishlistItem, 'id'>, idempotencyKey?: string) => Promise<void>
  addSaving: (saving: Omit<Saving, 'id'>, idempotencyKey?: string) => Promise<void>
  addWallet: (wallet: Omit<Wallet, 'id' | 'currentBalance' | 'transactions'>, idempotencyKey?: string) => Promise<void>
  addWalletTransaction: (walletId: string, tx: Omit<WalletTransaction, 'id'>, idempotencyKey?: string) => Promise<void>
  updateWishlistItem: (id: string, updates: Partial<WishlistItem>) => Promise<void>
  fundWishlistItem: (id: string, amount: number, walletId?: string, date?: string) => Promise<void>
  completeWishlistItem: (id: string) => Promise<void>
  cancelWishlistItem: (id: string) => Promise<void>
  deleteIncome: (id: string) => Promise<void>
  deleteExpense: (id: string) => Promise<void>
  updateSaving: (id: string, updates: Partial<Omit<Saving, 'id'>>) => Promise<void>
  deleteSaving: (id: string) => Promise<void>
  deleteWallet: (id: string) => Promise<void>
  deleteWalletTransaction: (walletId: string, txId: string) => Promise<void>
  transferBetweenWallets: (data: { fromWalletId: string; toWalletId: string; amount: number; note?: string; date: string }, idempotencyKey?: string) => Promise<void>
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
    walletId: api.walletId ?? null,
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
    walletId: api.walletId ?? null,
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
    walletId: api.walletId ?? null,
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
    transactions: (api.transactions || []).map(mapWalletTransaction),
  }
}

function mapWalletTransaction(api: ApiWalletTransaction): WalletTransaction {
  return {
    id: api.id,
    type: api.type.toLowerCase() as 'topup' | 'expense' | 'transfer_out' | 'transfer_in' | 'wishlist_fund',
    amount: api.amount,
    note: api.note || undefined,
    date: api.date.split('T')[0],
  }
}

function mapBudget(api: ApiBudget) {
  return { category: api.category, amount: api.amount }
}

// ============================================================
// PROVIDER
// ============================================================

interface AuthProviderProps {
  children: React.ReactNode
  session: { user: { id: string; email: string; name?: string } } | null
}

export const FinanceProvider: React.FC<AuthProviderProps> = ({ children, session }) => {
  const userId = session?.user?.id ?? null
  const [incomes, setIncomes] = useState<Income[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [wishlist, setWishlist] = useState<WishlistItem[]>([])
  const [savings, setSavings] = useState<Saving[]>([])
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch data when userId is available
  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    let cancelled = false

    async function fetchData() {
      try {
        // Fetch all data in parallel
        const [incomesRes, expensesRes, wishlistRes, savingsRes, walletsRes, budgetsRes] =
          await Promise.all([
            api.income.list(),
            api.expense.list(),
            api.wishlist.list(),
            api.saving.list(),
            api.wallet.list(),
            api.budget.list(),
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
        console.error('[FinanceContext] Fetch error:', msg)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [userId])

  // CRUD Operations
  const addIncome = useCallback(
    async (income: Omit<Income, 'id'>, idempotencyKey?: string) => {
      try {
        const created = await api.income.create({
          amount: income.amount,
          category: income.category,
          date: income.date,
          recurring: income.recurring,
          note: income.note,
          walletId: income.walletId ?? undefined,
        }, idempotencyKey)
        setIncomes((prev) => [mapIncome(created), ...prev])
        if (income.walletId) {
          const walletsRes = await api.wallet.list()
          setWallets(walletsRes.map(mapWallet))
        }
      } catch (e) {
        if (isDuplicateError(e)) {
          // Request duplikat: data sudah tersimpan sebelumnya → sinkronkan ulang dari server
          const [incomesRes, walletsRes] = await Promise.all([api.income.list(), api.wallet.list()])
          setIncomes(incomesRes.map(mapIncome))
          setWallets(walletsRes.map(mapWallet))
          return
        }
        throw e
      }
    },
    []
  )

  const addExpense = useCallback(
    async (expense: Omit<Expense, 'id'>, idempotencyKey?: string) => {
      try {
        const created = await api.expense.create({
          amount: expense.amount,
          category: expense.category,
          date: expense.date,
          note: expense.note,
          tags: expense.tags,
          walletId: expense.walletId ?? undefined,
        }, idempotencyKey)
        setExpenses((prev) => [mapExpense(created), ...prev])
        if (expense.walletId) {
          const walletsRes = await api.wallet.list()
          setWallets(walletsRes.map(mapWallet))
        }
      } catch (e) {
        if (isDuplicateError(e)) {
          // Request duplikat: data sudah tersimpan sebelumnya → sinkronkan ulang dari server
          const [expensesRes, walletsRes] = await Promise.all([api.expense.list(), api.wallet.list()])
          setExpenses(expensesRes.map(mapExpense))
          setWallets(walletsRes.map(mapWallet))
          return
        }
        throw e
      }
    },
    []
  )

  const addWishlistItem = useCallback(
    async (item: Omit<WishlistItem, 'id'>, idempotencyKey?: string) => {
      try {
        const created = await api.wishlist.create({
          name: item.name,
          targetPrice: item.targetPrice,
          currentProgress: item.currentProgress,
          priority: item.priority.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH',
          note: item.note,
          walletId: item.walletId ?? undefined,
        }, idempotencyKey)
        setWishlist((prev) => [mapWishlist(created), ...prev])
      } catch (e) {
        if (isDuplicateError(e)) {
          const wishlistRes = await api.wishlist.list()
          setWishlist(wishlistRes.map(mapWishlist))
          return
        }
        throw e
      }
    },
    []
  )

  const addSaving = useCallback(
    async (saving: Omit<Saving, 'id'>, idempotencyKey?: string) => {
      try {
        const created = await api.saving.create({
          amount: saving.amount,
          goalName: saving.goalName,
          date: saving.date,
          type: saving.type.toUpperCase() as 'SAVING' | 'INVESTMENT',
        }, idempotencyKey)
        setSavings((prev) => [mapSaving(created), ...prev])
      } catch (e) {
        if (isDuplicateError(e)) {
          const savingsRes = await api.saving.list()
          setSavings(savingsRes.map(mapSaving))
          return
        }
        throw e
      }
    },
    []
  )

  const addWallet = useCallback(
    async (wallet: Omit<Wallet, 'id' | 'currentBalance' | 'transactions'>, idempotencyKey?: string) => {
      try {
        const created = await api.wallet.create({
          name: wallet.name,
          walletType: wallet.walletType.toUpperCase() as 'CASH' | 'EWALLET' | 'BANK',
          initialBalance: wallet.initialBalance,
        }, idempotencyKey)
        setWallets((prev) => [...prev, mapWallet(created)])
      } catch (e) {
        if (isDuplicateError(e)) {
          const walletsRes = await api.wallet.list()
          setWallets(walletsRes.map(mapWallet))
          return
        }
        throw e
      }
    },
    []
  )

  const addWalletTransaction = useCallback(
    async (walletId: string, tx: Omit<WalletTransaction, 'id'>, idempotencyKey?: string) => {
      try {
        const result = await api.walletTx.create({
          walletId,
          type: tx.type.toUpperCase() as 'TOPUP' | 'EXPENSE',
          amount: tx.amount,
          note: tx.note,
          date: tx.date,
        }, idempotencyKey)
        setWallets((prev) =>
          prev.map((w) => (w.id === walletId ? mapWallet(result.wallet) : w))
        )
      } catch (e) {
        if (isDuplicateError(e)) {
          // Duplikat: mutasi sudah tercatat → ambil ulang state wallet dari server
          const walletsRes = await api.wallet.list()
          setWallets(walletsRes.map(mapWallet))
          return
        }
        throw e
      }
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
      const income = incomes.find((i) => i.id === id)
      await api.income.delete(id)
      setIncomes((prev) => prev.filter((item) => item.id !== id))
      if (income?.walletId) {
        const walletsRes = await api.wallet.list()
        setWallets(walletsRes.map(mapWallet))
      }
    },
    [incomes]
  )

  const deleteExpense = useCallback(
    async (id: string) => {
      const expense = expenses.find((e) => e.id === id)
      await api.expense.delete(id)
      setExpenses((prev) => prev.filter((item) => item.id !== id))
      if (expense?.walletId) {
        const walletsRes = await api.wallet.list()
        setWallets(walletsRes.map(mapWallet))
      }
    },
    [expenses]
  )

  // Tambah tabungan dari wallet — update wishlist + wallet yang terpengaruh
  const fundWishlistItem = useCallback(
    async (id: string, amount: number, walletId?: string, date?: string) => {
      const result = await api.wishlist.fund(id, {
        amount,
        walletId,
        date: date ?? new Date().toISOString().split('T')[0],
      })
      setWishlist((prev) =>
        prev.map((item) => (item.id === id ? mapWishlist(result.wishlist) : item))
      )
      setWallets((prev) =>
        prev.map((w) => (w.id === result.wallet.id ? mapWallet(result.wallet) : w))
      )
    },
    []
  )

  // "Sudah Dibeli": tidak refund. Refresh wallets karena note tx funding berubah.
  const completeWishlistItem = useCallback(
    async (id: string) => {
      await api.wishlist.complete(id)
      setWishlist((prev) => prev.filter((item) => item.id !== id))
      const walletsRes = await api.wallet.list()
      setWallets(walletsRes.map(mapWallet))
    },
    []
  )

  // "Batalkan": refund ke wallet asal. Refresh wallets karena saldo berubah.
  const cancelWishlistItem = useCallback(
    async (id: string) => {
      await api.wishlist.cancel(id)
      setWishlist((prev) => prev.filter((item) => item.id !== id))
      const walletsRes = await api.wallet.list()
      setWallets(walletsRes.map(mapWallet))
    },
    []
  )

  const updateSaving = useCallback(
    async (id: string, updates: Partial<Omit<Saving, 'id'>>) => {
      const payload: Record<string, unknown> = {}
      if (updates.amount !== undefined) payload.amount = updates.amount
      if (updates.goalName !== undefined) payload.goalName = updates.goalName
      if (updates.date !== undefined) payload.date = updates.date
      if (updates.type !== undefined) payload.type = updates.type.toUpperCase()
      const updated = await api.saving.update(id, payload as Parameters<typeof api.saving.update>[1])
      setSavings((prev) => prev.map((item) => (item.id === id ? mapSaving(updated) : item)))
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

  const transferBetweenWallets = useCallback(
    async (data: { fromWalletId: string; toWalletId: string; amount: number; note?: string; date: string }, idempotencyKey?: string) => {
      try {
        await api.walletTx.transfer(data, idempotencyKey)
      } catch (e) {
        // Duplikat: transfer sudah diproses → lanjut refresh saldo, jangan lempar error
        if (!isDuplicateError(e)) throw e
      }
      if (!userId) return
      const walletsRes = await api.wallet.list(userId)
      setWallets(walletsRes.map(mapWallet))
    },
    [userId]
  )

  const setCategoryBudget = useCallback(
    async (category: string, budget: number) => {
      await api.budget.create({ category, amount: budget })
      setCategoryBudgets((prev) => ({ ...prev, [category]: budget }))
    },
    []
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
        fundWishlistItem,
        completeWishlistItem,
        cancelWishlistItem,
        deleteIncome,
        deleteExpense,
        updateSaving,
        deleteSaving,
        deleteWallet,
        deleteWalletTransaction,
        transferBetweenWallets,
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
