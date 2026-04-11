import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, Heart, Trash2, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '../components/ui/progress';

export const WishlistPage: React.FC = () => {
  const { wishlist, addWishlistItem, deleteWishlistItem, updateWishlistItem } = useFinance();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    targetPrice: '',
    currentProgress: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    note: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.targetPrice) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (parseFloat(formData.targetPrice) <= 0) {
      toast.error('Please enter a valid target price');
      return;
    }

    addWishlistItem({
      name: formData.name,
      targetPrice: parseFloat(formData.targetPrice),
      currentProgress: formData.currentProgress ? parseFloat(formData.currentProgress) : 0,
      priority: formData.priority,
      note: formData.note,
    });

    setFormData({
      name: '',
      targetPrice: '',
      currentProgress: '',
      priority: 'medium',
      note: '',
    });
    setIsOpen(false);
    toast.success('Wishlist item added!');
  };

  const handleDelete = (id: string) => {
    deleteWishlistItem(id);
    toast.success('Item removed from wishlist');
  };

  const handleUpdateProgress = (id: string, amount: string) => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 0) return;
    
    updateWishlistItem(id, { currentProgress: parsedAmount });
    toast.success('Progress updated!');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'low':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const totalWishlistValue = wishlist.reduce((sum, item) => sum + item.targetPrice, 0);
  const totalSaved = wishlist.reduce((sum, item) => sum + item.currentProgress, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Wishlist</h1>
          <p className="text-gray-500 mt-1">Track your savings goals</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-pink-600 hover:bg-pink-700 rounded-xl">
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>Add Wishlist Item</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Item Name</Label>
                <Input
                  id="name"
                  placeholder="MacBook Pro, Holiday Trip, etc."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="rounded-xl"
                  required
                />
              </div>

              <div>
                <Label htmlFor="targetPrice">Target Price (Rp)</Label>
                <Input
                  id="targetPrice"
                  type="number"
                  placeholder="10000000"
                  value={formData.targetPrice}
                  onChange={(e) => setFormData({ ...formData, targetPrice: e.target.value })}
                  className="rounded-xl"
                  required
                />
              </div>

              <div>
                <Label htmlFor="currentProgress">Current Savings (Rp)</Label>
                <Input
                  id="currentProgress"
                  type="number"
                  placeholder="0"
                  value={formData.currentProgress}
                  onChange={(e) => setFormData({ ...formData, currentProgress: e.target.value })}
                  className="rounded-xl"
                />
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: 'low' | 'medium' | 'high') =>
                    setFormData({ ...formData, priority: value })
                  }
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="note">Motivation Note (Optional)</Label>
                <Textarea
                  id="note"
                  placeholder="Why do you want this?"
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="rounded-xl"
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full bg-pink-600 hover:bg-pink-700 rounded-xl">
                Add to Wishlist
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
              <p className="text-sm text-gray-600">Total Wishlist Value</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1 break-words">
                Rp {totalWishlistValue.toLocaleString('id-ID')}
              </p>
              <p className="text-xs text-gray-500 mt-2">{wishlist.length} items</p>
            </div>
            <div className="w-10 h-10 bg-pink-50 rounded-xl flex items-center justify-center">
              <Heart className="w-5 h-5 text-pink-600" />
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-white rounded-2xl shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Saved</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1 break-words">
                Rp {totalSaved.toLocaleString('id-ID')}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {totalWishlistValue > 0
                  ? `${((totalSaved / totalWishlistValue) * 100).toFixed(1)}% of goal`
                  : '0% of goal'}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Wishlist Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {wishlist.length === 0 ? (
          <Card className="p-8 col-span-full bg-white rounded-2xl shadow-sm">
            <p className="text-center text-gray-400">
              No wishlist items yet. Start tracking your dreams!
            </p>
          </Card>
        ) : (
          wishlist.map((item) => {
            const progressPercentage = (item.currentProgress / item.targetPrice) * 100;
            const remaining = item.targetPrice - item.currentProgress;

            return (
              <Card key={item.id} className="p-4 sm:p-5 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="space-y-3 sm:space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base sm:text-lg text-gray-900 truncate">{item.name}</h3>
                      <span
                        className={`inline-block px-2 py-1 text-xs rounded-full mt-2 border ${getPriorityColor(
                          item.priority
                        )}`}
                      >
                        {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)} Priority
                      </span>
                    </div>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2.5 hover:bg-red-50 rounded-lg transition-colors"
                      aria-label="Delete wishlist item"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>

                  {/* Target & Progress */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium text-gray-900">
                        {progressPercentage.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Rp {item.currentProgress.toLocaleString('id-ID')}</span>
                      <span>Rp {item.targetPrice.toLocaleString('id-ID')}</span>
                    </div>
                  </div>

                  {/* Remaining */}
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs sm:text-sm text-gray-600">Remaining</p>
                    <p className="text-base sm:text-lg font-bold text-gray-900">
                      Rp {remaining.toLocaleString('id-ID')}
                    </p>
                  </div>

                  {/* Note */}
                  {item.note && (
                    <div className="p-3 bg-pink-50 rounded-xl border border-pink-100">
                      <p className="text-sm text-pink-900 italic">"{item.note}"</p>
                    </div>
                  )}

                  {/* Update Progress */}
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Add savings..."
                      className="rounded-xl flex-1 text-base"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const input = e.currentTarget;
                          handleUpdateProgress(item.id, input.value);
                          input.value = '';
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 rounded-xl"
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                        if (input) {
                          handleUpdateProgress(item.id, input.value);
                          input.value = '';
                        }
                      }}
                    >
                      Update
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};
