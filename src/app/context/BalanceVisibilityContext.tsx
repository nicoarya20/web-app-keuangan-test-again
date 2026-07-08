import React, { createContext, useContext, useState, useCallback } from 'react';

const STORAGE_KEY = 'finance-balance-hidden';

interface BalanceVisibilityContextType {
  isHidden: boolean;
  toggle: () => void;
  formatAmount: (amount: number) => string;
}

const BalanceVisibilityContext = createContext<BalanceVisibilityContextType | null>(null);

export const BalanceVisibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isHidden, setIsHidden] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const toggle = useCallback(() => {
    setIsHidden((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {}
      return next;
    });
  }, []);

  const formatAmount = useCallback(
    (amount: number) => (isHidden ? '•••••' : amount.toLocaleString('id-ID')),
    [isHidden]
  );

  return (
    <BalanceVisibilityContext.Provider value={{ isHidden, toggle, formatAmount }}>
      {children}
    </BalanceVisibilityContext.Provider>
  );
};

export const useBalanceVisibility = () => {
  const ctx = useContext(BalanceVisibilityContext);
  if (!ctx) throw new Error('useBalanceVisibility must be used inside BalanceVisibilityProvider');
  return ctx;
};
