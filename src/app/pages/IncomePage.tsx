import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { Plus, TrendingUp, Trash2, CalendarIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { useT } from '../context/LanguageContext';

const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Side Hustle', 'Bonus', 'Investment', 'Other'];
const NO_WALLET = '__none__';

export const IncomePage: React.FC = () => {
  const { incomes, wallets, addIncome, deleteIncome } = useFinance();
  const t = useT();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    category: 'Salary',
    date: format(new Date(), 'yyyy-MM-dd'),
    recurring: false,
    note: '',
    walletId: NO_WALLET,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error(t.income.toast.invalidAmount);
      return;
    }

    addIncome({
      amount: parseFloat(formData.amount),
      category: formData.category,
      date: formData.date,
      recurring: formData.recurring,
      note: formData.note,
      walletId: formData.walletId === NO_WALLET ? null : formData.walletId,
    });

    setFormData({
      amount: '',
      category: 'Salary',
      date: format(new Date(), 'yyyy-MM-dd'),
      recurring: false,
      note: '',
      walletId: NO_WALLET,
    });
    setIsOpen(false);
    toast.success(t.income.toast.added);
  };

  const handleDelete = (id: string) => {
    deleteIncome(id);
    toast.success(t.income.toast.deleted);
  };

  const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);
  const monthlyRecurring = incomes
    .filter((income) => income.recurring)
    .reduce((sum, income) => sum + income.amount, 0);

  const walletMap = Object.fromEntries(wallets.map((w) => [w.id, w.name]));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{t.income.title}</h1>
          <p className="text-gray-500 mt-1">{t.income.subtitle}</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 rounded-xl">
              <Plus className="w-4 h-4 mr-2" />
              {t.income.addIncome}
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>{t.income.addNewIncome}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="amount">{t.income.amount}</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="1000000"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="rounded-xl"
                  required
                />
              </div>

              <div>
                <Label htmlFor="category">{t.income.category}</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INCOME_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {t.income.categories[cat] ?? cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="date">{t.income.date}</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="rounded-xl"
                  required
                />
              </div>

              {wallets.length > 0 && (
                <div>
                  <Label htmlFor="walletId">{t.income.addToWallet}</Label>
                  <Select
                    value={formData.walletId}
                    onValueChange={(value) => setFormData({ ...formData, walletId: value })}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_WALLET}>{t.income.noWalletAddition}</SelectItem>
                      {wallets.map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center justify-between">
                <Label htmlFor="recurring">{t.income.recurring}</Label>
                <Switch
                  id="recurring"
                  checked={formData.recurring}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, recurring: checked })
                  }
                />
              </div>

              <div>
                <Label htmlFor="note">{t.income.note}</Label>
                <Input
                  id="note"
                  placeholder={t.income.notePlaceholder}
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="rounded-xl"
                />
              </div>

              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 rounded-xl">
                {t.income.addIncome}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-5 bg-white rounded-2xl shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600">{t.income.totalIncome}</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1 break-words">
                Rp {totalIncome.toLocaleString('id-ID')}
              </p>
              <p className="text-xs text-gray-500 mt-2">{t.income.allTime}</p>
            </div>
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-white rounded-2xl shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600">{t.income.monthlyRecurring}</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1 break-words">
                Rp {monthlyRecurring.toLocaleString('id-ID')}
              </p>
              <p className="text-xs text-gray-500 mt-2">{t.income.expectedMonthly}</p>
            </div>
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
              <CalendarIcon className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Income List */}
      <Card className="p-6 bg-white rounded-2xl shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.income.allIncome}</h3>
        <div className="space-y-3">
          {incomes.length === 0 ? (
            <p className="text-center text-gray-400 py-8">{t.income.noRecords}</p>
          ) : (
            incomes.map((income) => (
              <div
                key={income.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900 truncate">
                        {t.income.categories[income.category] ?? income.category}
                      </p>
                      {income.recurring && (
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                          {t.income.recurringBadge}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {format(parseISO(income.date), 'MMM dd, yyyy')}
                    </p>
                    {income.walletId && walletMap[income.walletId] && (
                      <p className="text-xs text-green-600 mt-0.5">{walletMap[income.walletId]}</p>
                    )}
                    {income.note && (
                      <p className="text-sm text-gray-600 mt-1 truncate">{income.note}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3">
                  <p className="text-lg sm:text-xl font-bold text-green-600 whitespace-nowrap">
                    +Rp {income.amount.toLocaleString('id-ID')}
                  </p>
                  <button
                    onClick={() => handleDelete(income.id)}
                    className="p-2.5 hover:bg-red-50 rounded-lg transition-colors"
                    aria-label="Delete income"
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
