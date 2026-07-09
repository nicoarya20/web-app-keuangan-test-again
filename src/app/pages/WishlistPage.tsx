import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, Heart, TrendingUp, Check, Ban } from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '../components/ui/progress';
import { useT } from '../context/LanguageContext';
import { AmountText } from '../components/AmountText';

const WALLET_EMOJI: Record<string, string> = { cash: '💵', ewallet: '📱', bank: '🏦' };

export const WishlistPage: React.FC = () => {
  const { wishlist, wallets, addWishlistItem, fundWishlistItem, completeWishlistItem, cancelWishlistItem } = useFinance();
  const t = useT();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    targetPrice: '',
    currentProgress: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    note: '',
    walletId: 'none',
  });
  // Per-item funding state
  const [fundAmount, setFundAmount] = useState<Record<string, string>>({});
  const [fundWallet, setFundWallet] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.targetPrice) {
      toast.error(t.wishlist.toast.requiredFields);
      return;
    }

    if (parseFloat(formData.targetPrice) <= 0) {
      toast.error(t.wishlist.toast.invalidPrice);
      return;
    }

    addWishlistItem({
      name: formData.name,
      targetPrice: parseFloat(formData.targetPrice),
      currentProgress: formData.currentProgress ? parseFloat(formData.currentProgress) : 0,
      priority: formData.priority,
      note: formData.note,
      walletId: formData.walletId !== 'none' ? formData.walletId : undefined,
    });

    setFormData({ name: '', targetPrice: '', currentProgress: '', priority: 'medium', note: '', walletId: 'none' });
    setIsOpen(false);
    toast.success(t.wishlist.toast.added);
  };

  const handleFund = async (itemId: string, defaultWalletId?: string | null) => {
    const amount = parseFloat(fundAmount[itemId] ?? '');
    if (isNaN(amount) || amount <= 0) return;

    const walletId = fundWallet[itemId] ?? defaultWalletId ?? undefined;
    if (!walletId) {
      toast.error(t.wishlist.toast.selectWallet);
      return;
    }
    const wallet = wallets.find((w) => w.id === walletId);
    if (wallet && amount > wallet.currentBalance) {
      toast.error(t.wishlist.toast.insufficientBalance);
      return;
    }

    try {
      await fundWishlistItem(itemId, amount, walletId);
      setFundAmount((prev) => ({ ...prev, [itemId]: '' }));
      toast.success(t.wishlist.toast.funded);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.wishlist.toast.insufficientBalance);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await completeWishlistItem(id);
      toast.success(t.wishlist.toast.purchased);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await cancelWishlistItem(id);
      toast.success(t.wishlist.toast.cancelled);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const totalWishlistValue = wishlist.reduce((sum, item) => sum + item.targetPrice, 0);
  const totalSaved = wishlist.reduce((sum, item) => sum + item.currentProgress, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{t.wishlist.title}</h1>
          <p className="text-gray-500 mt-1">{t.wishlist.subtitle}</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-pink-600 hover:bg-pink-700 rounded-xl">
              <Plus className="w-4 h-4 mr-2" />
              {t.wishlist.addItem}
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>{t.wishlist.addWishlistItem}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">{t.wishlist.itemName}</Label>
                <Input
                  id="name"
                  placeholder={t.wishlist.itemNamePlaceholder}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="rounded-xl"
                  required
                />
              </div>

              <div>
                <Label htmlFor="targetPrice">{t.wishlist.targetPrice}</Label>
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
                <Label htmlFor="currentProgress">{t.wishlist.currentSavings}</Label>
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
                <Label htmlFor="priority">{t.wishlist.priority}</Label>
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
                    <SelectItem value="low">{t.wishlist.priorityLabels.low}</SelectItem>
                    <SelectItem value="medium">{t.wishlist.priorityLabels.medium}</SelectItem>
                    <SelectItem value="high">{t.wishlist.priorityLabels.high}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="walletSource">{t.wishlist.walletSource}</Label>
                <Select
                  value={formData.walletId}
                  onValueChange={(value) => setFormData({ ...formData, walletId: value })}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t.wishlist.noWallet}</SelectItem>
                    {wallets.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {WALLET_EMOJI[w.walletType]} {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="note">{t.wishlist.motivationNote}</Label>
                <Textarea
                  id="note"
                  placeholder={t.wishlist.motivationPlaceholder}
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="rounded-xl"
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full bg-pink-600 hover:bg-pink-700 rounded-xl">
                {t.wishlist.addToWishlist}
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
              <p className="text-sm text-gray-600">{t.wishlist.totalValue}</p>
              <AmountText
                amount={totalWishlistValue}
                className="text-xl sm:text-2xl font-bold text-gray-900 mt-1 break-words block"
              />
              <p className="text-xs text-gray-500 mt-2">{t.wishlist.items(wishlist.length)}</p>
            </div>
            <div className="w-10 h-10 bg-pink-50 rounded-xl flex items-center justify-center">
              <Heart className="w-5 h-5 text-pink-600" />
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-white rounded-2xl shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600">{t.wishlist.totalSaved}</p>
              <AmountText
                amount={totalSaved}
                className="text-xl sm:text-2xl font-bold text-gray-900 mt-1 break-words block"
              />
              <p className="text-xs text-gray-500 mt-2">
                {totalWishlistValue > 0
                  ? t.wishlist.ofGoal(((totalSaved / totalWishlistValue) * 100).toFixed(1))
                  : t.wishlist.ofGoal('0')}
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
            <p className="text-center text-gray-400">{t.wishlist.noItems}</p>
          </Card>
        ) : (
          wishlist.map((item) => {
            const progressPercentage = (item.currentProgress / item.targetPrice) * 100;
            const remaining = item.targetPrice - item.currentProgress;
            const priorityLabel = t.wishlist.priorityLabels[item.priority] ?? item.priority;
            const selectedWalletId = fundWallet[item.id] ?? item.walletId ?? '';
            const selectedWallet = wallets.find((w) => w.id === selectedWalletId);

            return (
              <Card key={item.id} className="p-4 sm:p-5 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="space-y-3 sm:space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base sm:text-lg text-gray-900 truncate">{item.name}</h3>
                      <span
                        className={`inline-block px-2 py-1 text-xs rounded-full mt-2 border ${getPriorityColor(item.priority)}`}
                      >
                        {priorityLabel} {t.wishlist.prioritySuffix}
                      </span>
                    </div>
                  </div>

                  {/* Target & Progress */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">{t.wishlist.progress}</span>
                      <span className="font-medium text-gray-900">
                        {progressPercentage.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <AmountText amount={item.currentProgress} />
                      <AmountText amount={item.targetPrice} />
                    </div>
                  </div>

                  {/* Remaining */}
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs sm:text-sm text-gray-600">{t.wishlist.remaining}</p>
                    <AmountText
                      amount={remaining}
                      className="text-base sm:text-lg font-bold text-gray-900"
                    />
                  </div>

                  {/* Note */}
                  {item.note && (
                    <div className="p-3 bg-pink-50 rounded-xl border border-pink-100">
                      <p className="text-sm text-pink-900 italic">"{item.note}"</p>
                    </div>
                  )}

                  {/* Add savings from wallet */}
                  {wallets.length > 0 && (
                    <div className="space-y-2">
                      <Select
                        value={selectedWalletId}
                        onValueChange={(value) => setFundWallet((prev) => ({ ...prev, [item.id]: value }))}
                      >
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder={t.wishlist.selectWallet} />
                        </SelectTrigger>
                        <SelectContent>
                          {wallets.map((w) => (
                            <SelectItem key={w.id} value={w.id}>
                              {WALLET_EMOJI[w.walletType]} {w.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedWallet && (
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          {t.wishlist.fundFrom} {WALLET_EMOJI[selectedWallet.walletType]} {selectedWallet.name} · {t.wishlist.balanceLabel}:{' '}
                          <AmountText amount={selectedWallet.currentBalance} className="font-medium text-gray-700" />
                        </p>
                      )}
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder={t.wishlist.addSavingsPlaceholder}
                          className="rounded-xl flex-1 text-base"
                          value={fundAmount[item.id] ?? ''}
                          onChange={(e) => setFundAmount((prev) => ({ ...prev, [item.id]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleFund(item.id, item.walletId);
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 rounded-xl"
                          onClick={() => handleFund(item.id, item.walletId)}
                        >
                          {t.wishlist.update}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Actions: Purchased vs Cancel */}
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 rounded-xl border-green-200 text-green-700 hover:bg-green-50"
                      onClick={() => handleComplete(item.id)}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      {t.wishlist.markPurchased}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 rounded-xl border-red-200 text-red-600 hover:bg-red-50"
                      onClick={() => handleCancel(item.id)}
                    >
                      <Ban className="w-4 h-4 mr-1" />
                      {t.wishlist.cancelGoal}
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
