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

const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Side Hustle', 'Bonus', 'Investment', 'Other'];

export const IncomePage: React.FC = () => {
  const { incomes, addIncome, deleteIncome } = useFinance();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    category: 'Salary',
    date: format(new Date(), 'yyyy-MM-dd'),
    recurring: false,
    note: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    addIncome({
      amount: parseFloat(formData.amount),
      category: formData.category,
      date: formData.date,
      recurring: formData.recurring,
      note: formData.note,
    });

    setFormData({
      amount: '',
      category: 'Salary',
      date: format(new Date(), 'yyyy-MM-dd'),
      recurring: false,
      note: '',
    });
    setIsOpen(false);
    toast.success('Income added successfully!');
  };

  const handleDelete = (id: string) => {
    deleteIncome(id);
    toast.success('Income deleted');
  };

  const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);
  const monthlyRecurring = incomes
    .filter((income) => income.recurring)
    .reduce((sum, income) => sum + income.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Income Management</h1>
          <p className="text-gray-500 mt-1">Track your income sources</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 rounded-xl">
              <Plus className="w-4 h-4 mr-2" />
              Add Income
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>Add New Income</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="amount">Amount (Rp)</Label>
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
                <Label htmlFor="category">Category</Label>
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
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="rounded-xl"
                  required
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="recurring">Recurring (Monthly)</Label>
                <Switch
                  id="recurring"
                  checked={formData.recurring}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, recurring: checked })
                  }
                />
              </div>

              <div>
                <Label htmlFor="note">Note (Optional)</Label>
                <Input
                  id="note"
                  placeholder="Additional details..."
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="rounded-xl"
                />
              </div>

              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 rounded-xl">
                Add Income
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
              <p className="text-sm text-gray-600">Total Income</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1 break-words">
                Rp {totalIncome.toLocaleString('id-ID')}
              </p>
              <p className="text-xs text-gray-500 mt-2">All time</p>
            </div>
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-white rounded-2xl shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600">Monthly Recurring</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1 break-words">
                Rp {monthlyRecurring.toLocaleString('id-ID')}
              </p>
              <p className="text-xs text-gray-500 mt-2">Expected monthly</p>
            </div>
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
              <CalendarIcon className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Income List */}
      <Card className="p-6 bg-white rounded-2xl shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">All Income</h3>
        <div className="space-y-3">
          {incomes.length === 0 ? (
            <p className="text-center text-gray-400 py-8">No income records yet. Add your first income!</p>
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
                      <p className="font-semibold text-gray-900 truncate">{income.category}</p>
                      {income.recurring && (
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                          Recurring
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {format(parseISO(income.date), 'MMM dd, yyyy')}
                    </p>
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
