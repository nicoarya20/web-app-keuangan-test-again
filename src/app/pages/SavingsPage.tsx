import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, PiggyBank, TrendingUp, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useT } from '../context/LanguageContext';
import { AmountText } from '../components/AmountText';
import { useIdempotencyKey } from '../../lib/useIdempotencyKey';

export const SavingsPage: React.FC = () => {
  const { savings, addSaving, deleteSaving } = useFinance();
  const t = useT();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const idem = useIdempotencyKey();
  const [formData, setFormData] = useState({
    amount: '',
    goalName: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    type: 'saving' as 'saving' | 'investment',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error(t.savings.toast.invalidAmount);
      return;
    }

    if (!formData.goalName) {
      toast.error(t.savings.toast.noGoalName);
      return;
    }

    setIsSubmitting(true);
    try {
      await addSaving({
        amount: parseFloat(formData.amount),
        goalName: formData.goalName,
        date: formData.date,
        type: formData.type,
      }, idem.getKey());
      idem.reset();

      setFormData({
        amount: '',
        goalName: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        type: 'saving',
      });
      setIsOpen(false);
      toast.success(t.savings.toast.added);
    } catch {
      toast.error('Gagal menyimpan. Coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    deleteSaving(id);
    toast.success(t.savings.toast.deleted);
  };

  const totalSavings = savings
    .filter((s) => s.type === 'saving')
    .reduce((sum, saving) => sum + saving.amount, 0);

  const totalInvestments = savings
    .filter((s) => s.type === 'investment')
    .reduce((sum, saving) => sum + saving.amount, 0);

  const totalAmount = totalSavings + totalInvestments;

  const sortedSavings = [...savings].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let cumulativeAmount = 0;
  const growthData = sortedSavings.map((saving) => {
    cumulativeAmount += saving.amount;
    return { date: format(parseISO(saving.date), 'MMM dd'), total: cumulativeAmount };
  });

  const goalBreakdown = savings.reduce((acc, saving) => {
    acc[saving.goalName] = (acc[saving.goalName] || 0) + saving.amount;
    return acc;
  }, {} as Record<string, number>);

  const getSavingTypeLabel = (type: string) =>
    type === 'saving' ? t.savings.typeSaving : t.savings.typeInvestment;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{t.savings.title}</h1>
          <p className="text-gray-500 mt-1">{t.savings.subtitle}</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700 rounded-xl">
              <Plus className="w-4 h-4 mr-2" />
              {t.savings.addSaving}
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>{t.savings.addSavingInvestment}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="amount">{t.savings.amount}</Label>
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
                <Label htmlFor="goalName">{t.savings.goalName}</Label>
                <Input
                  id="goalName"
                  placeholder={t.savings.goalNamePlaceholder}
                  value={formData.goalName}
                  onChange={(e) => setFormData({ ...formData, goalName: e.target.value })}
                  className="rounded-xl"
                  required
                />
              </div>

              <div>
                <Label htmlFor="type">{t.savings.type}</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'saving' | 'investment') =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="saving">{t.savings.typeSaving}</SelectItem>
                    <SelectItem value="investment">{t.savings.typeInvestment}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="date">{t.savings.date}</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="rounded-xl"
                  required
                />
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full bg-purple-600 hover:bg-purple-700 rounded-xl">
                {isSubmitting ? 'Menyimpan...' : t.savings.addSaving}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 bg-white rounded-2xl shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600">{t.savings.totalAmount}</p>
              <AmountText
                amount={totalAmount}
                className="text-xl sm:text-2xl font-bold text-gray-900 mt-1 break-words block"
              />
              <p className="text-xs text-gray-500 mt-2">{t.savings.allSavingsSubtitle}</p>
            </div>
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
              <PiggyBank className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-white rounded-2xl shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600">{t.savings.savings}</p>
              <AmountText
                amount={totalSavings}
                className="text-xl sm:text-2xl font-bold text-gray-900 mt-1 break-words block"
              />
              <p className="text-xs text-gray-500 mt-2">{t.savings.safeDeposits}</p>
            </div>
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <PiggyBank className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-white rounded-2xl shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600">{t.savings.investments}</p>
              <AmountText
                amount={totalInvestments}
                className="text-xl sm:text-2xl font-bold text-gray-900 mt-1 break-words block"
              />
              <p className="text-xs text-gray-500 mt-2">{t.savings.growthAssets}</p>
            </div>
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Growth Chart */}
      <Card className="p-6 bg-white rounded-2xl shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.savings.growthVisualization}</h3>
        {growthData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={growthData}>
              <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: '12px' }} />
              <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
              <Tooltip formatter={(value: number) => `Rp ${value.toLocaleString('id-ID')}`} />
              <Line type="monotone" dataKey="total" stroke="#8b5cf6" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-400">
            {t.savings.noSavingsData}
          </div>
        )}
      </Card>

      {/* Goals Breakdown */}
      {Object.keys(goalBreakdown).length > 0 && (
        <Card className="p-6 bg-white rounded-2xl shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.savings.goalsBreakdown}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {Object.entries(goalBreakdown).map(([goal, amount]) => (
              <div key={goal} className="p-3 sm:p-4 bg-purple-50 rounded-xl border border-purple-100">
                <p className="text-xs sm:text-sm text-purple-700 font-medium truncate">{goal}</p>
                <AmountText
                  amount={amount}
                  className="text-lg sm:text-xl font-bold text-purple-900 mt-1 break-words block"
                />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Savings List */}
      <Card className="p-6 bg-white rounded-2xl shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.savings.allSavingsInvestments}</h3>
        <div className="space-y-3">
          {savings.length === 0 ? (
            <p className="text-center text-gray-400 py-8">{t.savings.noRecords}</p>
          ) : (
            savings.map((saving) => (
              <div
                key={saving.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      saving.type === 'saving' ? 'bg-green-50' : 'bg-indigo-50'
                    }`}
                  >
                    {saving.type === 'saving' ? (
                      <PiggyBank className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                    ) : (
                      <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900 truncate">{saving.goalName}</p>
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full ${
                          saving.type === 'saving'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-indigo-100 text-indigo-700'
                        }`}
                      >
                        {getSavingTypeLabel(saving.type)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {format(parseISO(saving.date), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3">
                  <AmountText
                    amount={saving.amount}
                    prefix="+"
                    className="text-lg sm:text-xl font-bold text-purple-600 whitespace-nowrap"
                  />
                  <button
                    onClick={() => handleDelete(saving.id)}
                    className="p-2.5 hover:bg-red-50 rounded-lg transition-colors"
                    aria-label="Delete saving"
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
