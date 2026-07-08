import React from 'react';
import { useBalanceVisibility } from '../context/BalanceVisibilityContext';

interface AmountTextProps {
  amount: number;
  prefix?: string;
  className?: string;
}

export const AmountText: React.FC<AmountTextProps> = ({ amount, prefix = '', className }) => {
  const { formatAmount } = useBalanceVisibility();
  return (
    <span className={className}>
      {prefix}Rp {formatAmount(amount)}
    </span>
  );
};
