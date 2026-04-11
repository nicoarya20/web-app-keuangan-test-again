import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Income {
  id: string;
  amount: number;
  category: string;
  date: string;
  recurring: boolean;
  note?: string;
}

export interface Expense {
  id: string;
  amount: number;
  category: string;
  date: string;
  note?: string;
  tags?: string[];
}

export interface WishlistItem {
  id: string;
  name: string;
  targetPrice: number;
  currentProgress: number;
  priority: 'low' | 'medium' | 'high';
  note?: string;
}

export interface Saving {
  id: string;
  amount: number;
  goalName: string;
  date: string;
  type: 'saving' | 'investment';
}

interface FinanceContextType {
  incomes: Income[];
  expenses: Expense[];
  wishlist: WishlistItem[];
  savings: Saving[];
  addIncome: (income: Omit<Income, 'id'>) => void;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  addWishlistItem: (item: Omit<WishlistItem, 'id'>) => void;
  addSaving: (saving: Omit<Saving, 'id'>) => void;
  updateWishlistItem: (id: string, updates: Partial<WishlistItem>) => void;
  deleteIncome: (id: string) => void;
  deleteExpense: (id: string) => void;
  deleteWishlistItem: (id: string) => void;
  deleteSaving: (id: string) => void;
  categoryBudgets: Record<string, number>;
  setCategoryBudget: (category: string, budget: number) => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const STORAGE_KEYS = {
  incomes: 'finance_incomes',
  expenses: 'finance_expenses',
  wishlist: 'finance_wishlist',
  savings: 'finance_savings',
  budgets: 'finance_budgets',
};

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [incomes, setIncomes] = useState<Income[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.incomes);
    if (stored) return JSON.parse(stored);
    
    // Demo data
    const today = new Date();
    return [
      {
        id: '1',
        amount: 15000000,
        category: 'Salary',
        date: new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0],
        recurring: true,
        note: 'Monthly salary',
      },
      {
        id: '2',
        amount: 3000000,
        category: 'Freelance',
        date: new Date(today.getFullYear(), today.getMonth(), 15).toISOString().split('T')[0],
        recurring: false,
        note: 'Web design project',
      },
    ];
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.expenses);
    if (stored) return JSON.parse(stored);
    
    // Demo data
    const today = new Date();
    return [
      {
        id: '1',
        amount: 500000,
        category: 'Food & Dining',
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1).toISOString().split('T')[0],
        note: 'Groceries',
        tags: ['food'],
      },
      {
        id: '2',
        amount: 200000,
        category: 'Transportation',
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2).toISOString().split('T')[0],
        note: 'Gas',
        tags: ['car'],
      },
      {
        id: '3',
        amount: 1500000,
        category: 'Bills & Utilities',
        date: new Date(today.getFullYear(), today.getMonth(), 5).toISOString().split('T')[0],
        note: 'Rent',
      },
      {
        id: '4',
        amount: 350000,
        category: 'Entertainment',
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 3).toISOString().split('T')[0],
        note: 'Movie night',
        tags: ['leisure'],
      },
    ];
  });

  const [wishlist, setWishlist] = useState<WishlistItem[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.wishlist);
    if (stored) return JSON.parse(stored);
    
    // Demo data
    return [
      {
        id: '1',
        name: 'MacBook Pro M3',
        targetPrice: 25000000,
        currentProgress: 10000000,
        priority: 'high',
        note: 'Need for work and productivity',
      },
      {
        id: '2',
        name: 'Bali Vacation',
        targetPrice: 8000000,
        currentProgress: 3000000,
        priority: 'medium',
        note: 'Dream holiday with family',
      },
    ];
  });

  const [savings, setSavings] = useState<Saving[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.savings);
    if (stored) return JSON.parse(stored);
    
    // Demo data
    const today = new Date();
    return [
      {
        id: '1',
        amount: 5000000,
        goalName: 'Emergency Fund',
        date: new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0],
        type: 'saving',
      },
      {
        id: '2',
        amount: 3000000,
        goalName: 'Stock Investment',
        date: new Date(today.getFullYear(), today.getMonth(), 10).toISOString().split('T')[0],
        type: 'investment',
      },
    ];
  });

  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, number>>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.budgets);
    if (stored) return JSON.parse(stored);
    
    // Demo budgets
    return {
      'Food & Dining': 2000000,
      'Transportation': 1000000,
      'Entertainment': 500000,
    };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.incomes, JSON.stringify(incomes));
  }, [incomes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.expenses, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.wishlist, JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.savings, JSON.stringify(savings));
  }, [savings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.budgets, JSON.stringify(categoryBudgets));
  }, [categoryBudgets]);

  const addIncome = (income: Omit<Income, 'id'>) => {
    const newIncome = { ...income, id: Date.now().toString() };
    setIncomes((prev) => [newIncome, ...prev]);
  };

  const addExpense = (expense: Omit<Expense, 'id'>) => {
    const newExpense = { ...expense, id: Date.now().toString() };
    setExpenses((prev) => [newExpense, ...prev]);
  };

  const addWishlistItem = (item: Omit<WishlistItem, 'id'>) => {
    const newItem = { ...item, id: Date.now().toString() };
    setWishlist((prev) => [newItem, ...prev]);
  };

  const addSaving = (saving: Omit<Saving, 'id'>) => {
    const newSaving = { ...saving, id: Date.now().toString() };
    setSavings((prev) => [newSaving, ...prev]);
  };

  const updateWishlistItem = (id: string, updates: Partial<WishlistItem>) => {
    setWishlist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const deleteIncome = (id: string) => {
    setIncomes((prev) => prev.filter((item) => item.id !== id));
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((item) => item.id !== id));
  };

  const deleteWishlistItem = (id: string) => {
    setWishlist((prev) => prev.filter((item) => item.id !== id));
  };

  const deleteSaving = (id: string) => {
    setSavings((prev) => prev.filter((item) => item.id !== id));
  };

  const setCategoryBudget = (category: string, budget: number) => {
    setCategoryBudgets((prev) => ({ ...prev, [category]: budget }));
  };

  return (
    <FinanceContext.Provider
      value={{
        incomes,
        expenses,
        wishlist,
        savings,
        addIncome,
        addExpense,
        addWishlistItem,
        addSaving,
        updateWishlistItem,
        deleteIncome,
        deleteExpense,
        deleteWishlistItem,
        deleteSaving,
        categoryBudgets,
        setCategoryBudget,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};