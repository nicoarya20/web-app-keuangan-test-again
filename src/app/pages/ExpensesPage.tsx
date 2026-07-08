import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, TrendingDown, Trash2, AlertCircle, Settings } from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { toast } from 'sonner';
import { Progress } from '../components/ui/progress';
import { useT } from '../context/LanguageContext';
import { AmountText } from '../components/AmountText';
import { useBalanceVisibility } from '../context/BalanceVisibilityContext';

const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Entertainment',
  'Shopping',
  'Bills & Utilities',
  'Healthcare',
  'Education',
  'Other',
];

export const ExpensesPage: React.FC = () => {
  const { expenses, wallets, addExpense, deleteExpense, categoryBudgets, setCategoryBudget } = useFinance();
  const t = useT();
  const { formatAmount } = useBalanceVisibility();
  const [isOpen, setIsOpen] = useState(false);
  const [isBudgetOpen, setIsBudgetOpen] = useState(false);
  const [budgetCategory, setBudgetCategory] = useState('Food & Dining');
  const [budgetAmount, setBudgetAmount] = useState('');

  const [formData, setFormData] = useState({
    amount: '',
    category: 'Food & Dining',
    date: format(new Date(), 'yyyy-MM-dd'),
    note: '',
    tags: '',
    walletId: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error(t.expenses.toast.invalidAmount);
      return;
    }

    setIsSubmitting(true);
    try {
      await addExpense({
        amount: parseFloat(formData.amount),
        category: formData.category,
        date: formData.date,
        note: formData.note,
        tags: formData.tags ? formData.tags.split(',').map((tag) => tag.trim()) : [],
        walletId: formData.walletId || null,
      });

      setFormData({
        amount: '',
        category: 'Food & Dining',
        date: format(new Date(), 'yyyy-MM-dd'),
        note: '',
        tags: '',
        walletId: '',
      });
      setIsOpen(false);
      toast.success(t.expenses.toast.added);
    } catch {
      toast.error('Gagal menyimpan pengeluaran. Coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteExpense(id);
      toast.success(t.expenses.toast.deleted);
    } catch {
      toast.error('Gagal menghapus pengeluaran.');
    }
  };

  const handleSetBudget = () => {
    if (!budgetAmount || parseFloat(budgetAmount) <= 0) {
      toast.error(t.expenses.toast.invalidBudget);
      return;
    }
    setCategoryBudget(budgetCategory, parseFloat(budgetAmount));
    setBudgetAmount('');
    setIsBudgetOpen(false);
    toast.success(t.expenses.toast.budgetSet(budgetCategory));
  };

  const currentMonth = new Date();
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const monthlyExpenses = expenses.filter((expense) => {
    const expenseDate = parseISO(expense.date);
    return expenseDate >= monthStart && expenseDate <= monthEnd;
  });

  const totalExpense = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  const categoryBreakdown = monthlyExpenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{t.expenses.title}</h1>
          <p className="text-gray-500 mt-1">{t.expenses.subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Dialog open={isBudgetOpen} onOpenChange={setIsBudgetOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-xl">
                <Settings className="w-4 h-4 mr-2" />
                {t.expenses.setBudget}
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl">
              <DialogHeader>
                <DialogTitle>{t.expenses.setCategoryBudget}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="budget-category">{t.expenses.category}</Label>
                  <Select value={budgetCategory} onValueChange={setBudgetCategory}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {t.expenses.categories[cat] ?? cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="budget-amount">{t.expenses.monthlyBudget}</Label>
                  <Input
                    id="budget-amount"
                    type="number"
                    placeholder="1000000"
                    value={budgetAmount}
                    onChange={(e) => setBudgetAmount(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <Button
                  onClick={handleSetBudget}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 rounded-xl"
                >
                  {t.expenses.setBudget}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-red-600 hover:bg-red-700 rounded-xl">
                <Plus className="w-4 h-4 mr-2" />
                {t.expenses.addExpense}
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl">
              <DialogHeader>
                <DialogTitle>{t.expenses.addNewExpense}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="amount">{t.expenses.amount}</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="50000"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="rounded-xl"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="category">{t.expenses.category}</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {t.expenses.categories[cat] ?? cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="date">{t.expenses.date}</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="rounded-xl"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="note">{t.expenses.note}</Label>
                  <Input
                    id="note"
                    placeholder={t.expenses.notePlaceholder}
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    className="rounded-xl"
                  />
                </div>

                <div>
                  <Label htmlFor="tags">{t.expenses.tags}</Label>
                  <Input
                    id="tags"
                    placeholder={t.expenses.tagsPlaceholder}
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="rounded-xl"
                  />
                </div>

                {wallets.length > 0 && (
                  <div>
                    <Label>{t.expenses.deductFromWallet}</Label>
                    <Select
                      value={formData.walletId}
                      onValueChange={(value) => setFormData({ ...formData, walletId: value === 'none' ? '' : value })}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder={t.expenses.noWalletDeduction} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{t.expenses.noWalletDeduction}</SelectItem>
                        {wallets.map((w) => (
                          <SelectItem key={w.id} value={w.id}>
                            {w.name} — Rp {w.currentBalance.toLocaleString('id-ID')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Button type="submit" disabled={isSubmitting} className="w-full bg-red-600 hover:bg-red-700 rounded-xl">
                  {isSubmitting ? 'Menyimpan...' : t.expenses.addExpense}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <Card className="p-5 bg-white rounded-2xl shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-600">{t.expenses.totalExpenses}</p>
            <AmountText
              amount={totalExpense}
              className="text-xl sm:text-2xl font-bold text-gray-900 mt-1 break-words block"
            />
            <p className="text-xs text-gray-500 mt-2">
              {t.expenses.transactions(monthlyExpenses.length)}
            </p>
          </div>
          <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
            <TrendingDown className="w-5 h-5 text-red-600" />
          </div>
        </div>
      </Card>

      {/* Category Budgets */}
      {Object.keys(categoryBudgets).length > 0 && (
        <Card className="p-4 sm:p-6 bg-white rounded-2xl shadow-sm">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
            {t.expenses.budgetOverview}
          </h3>
          <div className="space-y-4">
            {Object.entries(categoryBudgets).map(([category, budget]) => {
              const spent = categoryBreakdown[category] || 0;
              const percentage = (spent / budget) * 100;
              const isOverBudget = percentage > 100;
              const isWarning = percentage > 80 && percentage <= 100;

              return (
                <div key={category}>
                  <div className="flex items-center justify-between mb-2 gap-2">
                    <span className="text-sm font-medium text-gray-700 truncate">
                      {t.expenses.categories[category] ?? category}
                    </span>
                    <span className="text-sm text-gray-500 whitespace-nowrap">
                      Rp {formatAmount(spent)} / Rp {formatAmount(budget)}
                    </span>
                  </div>
                  <Progress
                    value={Math.min(percentage, 100)}
                    className={`h-2 ${
                      isOverBudget
                        ? '[&>div]:bg-red-500'
                        : isWarning
                        ? '[&>div]:bg-amber-500'
                        : '[&>div]:bg-green-500'
                    }`}
                  />
                  {isOverBudget && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-red-600">
                      <AlertCircle className="w-3 h-3" />
                      <span>{t.expenses.overBudget(formatAmount(spent - budget))}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Expense List */}
      <Card className="p-6 bg-white rounded-2xl shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.expenses.allExpenses}</h3>
        <div className="space-y-3">
          {expenses.length === 0 ? (
            <p className="text-center text-gray-400 py-8">{t.expenses.noRecords}</p>
          ) : (
            expenses.map((expense) => (
              <div
                key={expense.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 truncate">
                      {t.expenses.categories[expense.category] ?? expense.category}
                    </p>
                    <p className="text-sm text-gray-500">
                      {format(parseISO(expense.date), 'MMM dd, yyyy')}
                      {expense.walletId && (() => {
                        const w = wallets.find((w) => w.id === expense.walletId);
                        return w ? <span className="ml-2 text-xs text-indigo-500">· {w.name}</span> : null;
                      })()}
                    </p>
                    {expense.note && (
                      <p className="text-sm text-gray-600 mt-1 truncate">{expense.note}</p>
                    )}
                    {expense.tags && expense.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {expense.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3">
                  <AmountText
                    amount={expense.amount}
                    prefix="-"
                    className="text-lg sm:text-xl font-bold text-red-600 whitespace-nowrap"
                  />
                  <button
                    onClick={() => handleDelete(expense.id)}
                    className="p-2.5 hover:bg-red-50 rounded-lg transition-colors"
                    aria-label="Delete expense"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};
