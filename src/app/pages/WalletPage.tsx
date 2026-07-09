import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, Wallet as WalletIcon, Trash2, TrendingUp, TrendingDown, ChevronDown, ChevronUp, ArrowLeftRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { PageTransition } from '../components/PageTransition';
import { useT } from '../context/LanguageContext';
import { AmountText } from '../components/AmountText';
import { useBalanceVisibility } from '../context/BalanceVisibilityContext';

const WALLET_TYPES = ['cash', 'ewallet', 'bank'] as const;
const WALLET_ICONS: Record<string, string> = { cash: '💰', ewallet: '📱', bank: '🏦' };
const WALLET_COLORS: Record<string, string> = {
  cash: 'bg-amber-50 border-amber-200',
  ewallet: 'bg-blue-50 border-blue-200',
  bank: 'bg-emerald-50 border-emerald-200',
};

export const WalletPage: React.FC = () => {
  const { wallets, addWallet, deleteWallet, addWalletTransaction, deleteWalletTransaction, transferBetweenWallets } = useFinance();
  const t = useT();
  const { formatAmount } = useBalanceVisibility();
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isTxOpen, setIsTxOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');
  const [transferForm, setTransferForm] = useState({
    fromWalletId: '',
    toWalletId: '',
    amount: '',
    note: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  });
  const [expandedWallets, setExpandedWallets] = useState<Set<string>>(new Set());

  const [walletForm, setWalletForm] = useState({
    name: '',
    walletType: 'cash' as 'cash' | 'ewallet' | 'bank',
    initialBalance: '',
  });

  const [txForm, setTxForm] = useState({
    type: 'topup' as 'topup' | 'expense',
    amount: '',
    note: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  });

  const totalBalance = wallets.reduce((sum, w) => sum + w.currentBalance, 0);

  const handleAddWallet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletForm.name || !walletForm.initialBalance) {
      toast.error(t.wallet.toast.fillAllFields);
      return;
    }
    const amount = parseFloat(walletForm.initialBalance);
    if (amount < 0) {
      toast.error(t.wallet.toast.invalidAmount);
      return;
    }

    addWallet({
      name: walletForm.name,
      walletType: walletForm.walletType,
      initialBalance: amount,
    });

    setWalletForm({ name: '', walletType: 'cash', initialBalance: '' });
    setIsWalletOpen(false);
    toast.success(t.wallet.toast.walletAdded(walletForm.name));
  };

  const handleDeleteWallet = (id: string, name: string) => {
    deleteWallet(id);
    toast.success(t.wallet.toast.walletDeleted(name));
  };

  const handleAddTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txForm.amount || parseFloat(txForm.amount) <= 0) {
      toast.error(t.wallet.toast.invalidAmount);
      return;
    }

    addWalletTransaction(selectedWalletId, {
      type: txForm.type,
      amount: parseFloat(txForm.amount),
      note: txForm.note,
      date: txForm.date,
    });

    setIsTxOpen(false);
    toast.success(
      txForm.type === 'topup' ? t.wallet.toast.topupSuccess : t.wallet.toast.expenseSuccess
    );
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(transferForm.amount);
    if (!amount || amount <= 0) { toast.error(t.wallet.toast.invalidAmount); return; }
    if (!transferForm.toWalletId) { toast.error(t.wallet.toast.fillAllFields); return; }
    if (transferForm.fromWalletId === transferForm.toWalletId) { toast.error(t.wallet.toast.fillAllFields); return; }

    try {
      await transferBetweenWallets({
        fromWalletId: transferForm.fromWalletId,
        toWalletId: transferForm.toWalletId,
        amount,
        note: transferForm.note || undefined,
        date: transferForm.date,
      });
      setIsTransferOpen(false);
      setTransferForm({ fromWalletId: '', toWalletId: '', amount: '', note: '', date: format(new Date(), 'yyyy-MM-dd') });
      toast.success(t.wallet.toast.transferSuccess);
    } catch (err: any) {
      const msg = err?.message?.includes('Insufficient') ? t.wallet.toast.insufficientBalance : err?.message;
      toast.error(msg || t.wallet.toast.invalidAmount);
    }
  };

  const handleDeleteTx = (walletId: string, txId: string) => {
    deleteWalletTransaction(walletId, txId);
    toast.success(t.wallet.toast.txDeleted);
  };

  const toggleExpand = (walletId: string) => {
    setExpandedWallets((prev) => {
      const next = new Set(prev);
      if (next.has(walletId)) next.delete(walletId);
      else next.add(walletId);
      return next;
    });
  };

  const selectedWallet = wallets.find((w) => w.id === selectedWalletId);

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{t.wallet.title}</h1>
            <p className="text-gray-500 mt-1">{t.wallet.subtitle}</p>
          </div>
          <Dialog open={isWalletOpen} onOpenChange={setIsWalletOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700 rounded-xl">
                <Plus className="w-4 h-4 mr-2" />
                {t.wallet.addWallet}
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl">
              <DialogHeader>
                <DialogTitle>{t.wallet.addNewWallet}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddWallet} className="space-y-4">
                <div>
                  <Label htmlFor="wallet-name">{t.wallet.walletName}</Label>
                  <Input
                    id="wallet-name"
                    placeholder={t.wallet.walletNamePlaceholder}
                    value={walletForm.name}
                    onChange={(e) => setWalletForm({ ...walletForm, name: e.target.value })}
                    className="rounded-xl"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="wallet-type">{t.wallet.walletType}</Label>
                  <Select
                    value={walletForm.walletType}
                    onValueChange={(value: 'cash' | 'ewallet' | 'bank') =>
                      setWalletForm({ ...walletForm, walletType: value })
                    }
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WALLET_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {WALLET_ICONS[type]} {t.wallet.typeLabels[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="wallet-balance">{t.wallet.initialBalance}</Label>
                  <Input
                    id="wallet-balance"
                    type="number"
                    placeholder="500000"
                    value={walletForm.initialBalance}
                    onChange={(e) => setWalletForm({ ...walletForm, initialBalance: e.target.value })}
                    className="rounded-xl"
                    required
                  />
                </div>

                <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 rounded-xl">
                  {t.wallet.addWallet}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Total Balance Card */}
        <Card className="p-6 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl shadow-sm text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-indigo-200">{t.wallet.totalBalance}</p>
              <AmountText
                amount={totalBalance}
                className="text-2xl sm:text-3xl font-bold mt-2 break-words block"
              />
              <p className="text-xs text-indigo-300 mt-2">
                {t.wallet.activeWallets(wallets.length)}
              </p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <WalletIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        {/* Wallet Cards */}
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
            {t.wallet.yourWallets}
          </h2>
          {wallets.length === 0 ? (
            <Card className="p-8 bg-white rounded-2xl shadow-sm">
              <p className="text-center text-gray-400">{t.wallet.noWallets}</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {wallets.map((wallet) => {
                const colorClass = WALLET_COLORS[wallet.walletType];
                const icon = WALLET_ICONS[wallet.walletType];
                const typeLabel = t.wallet.typeLabels[wallet.walletType];
                const isExpanded = expandedWallets.has(wallet.id);
                const totalTopup = wallet.transactions
                  .filter((tx) => tx.type === 'topup')
                  .reduce((sum, tx) => sum + tx.amount, 0);
                const totalExpense = wallet.transactions
                  .filter((tx) => tx.type === 'expense')
                  .reduce((sum, tx) => sum + tx.amount, 0);

                return (
                  <div key={wallet.id} className="space-y-3">
                    <Card
                      className={`p-4 sm:p-5 rounded-2xl shadow-sm border ${colorClass} hover:shadow-md transition-shadow`}
                    >
                      <div className="space-y-4">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{icon}</span>
                              <h3 className="font-semibold text-gray-900 truncate">{wallet.name}</h3>
                            </div>
                            <span className="inline-block px-2 py-0.5 text-xs rounded-full mt-1 bg-white/80 text-gray-600 border border-gray-200">
                              {typeLabel}
                            </span>
                          </div>
                          <button
                            onClick={() => handleDeleteWallet(wallet.id, wallet.name)}
                            className="p-2 hover:bg-white/80 rounded-lg transition-colors flex-shrink-0"
                            aria-label="Delete wallet"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>

                        {/* Balance */}
                        <div>
                          <p className="text-xs text-gray-600">{t.wallet.currentBalance}</p>
                          <AmountText
                            amount={wallet.currentBalance}
                            className="text-xl sm:text-2xl font-bold text-gray-900 mt-1 break-words block"
                          />
                        </div>

                        {/* Summary */}
                        <div className="flex items-center gap-4 text-xs">
                          <div className="flex items-center gap-1 text-green-600">
                            <TrendingUp className="w-3 h-3" />
                            <AmountText amount={totalTopup} prefix="+" />
                          </div>
                          <div className="flex items-center gap-1 text-red-600">
                            <TrendingDown className="w-3 h-3" />
                            <AmountText amount={totalExpense} prefix="-" />
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-3 gap-1.5">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 rounded-xl text-xs px-2"
                            onClick={() => {
                              setSelectedWalletId(wallet.id);
                              setTxForm({ type: 'topup', amount: '', note: '', date: format(new Date(), 'yyyy-MM-dd') });
                              setIsTxOpen(true);
                            }}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            {t.wallet.topUpBtn}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-xl text-xs px-2"
                            onClick={() => {
                              setSelectedWalletId(wallet.id);
                              setTxForm({ type: 'expense', amount: '', note: '', date: format(new Date(), 'yyyy-MM-dd') });
                              setIsTxOpen(true);
                            }}
                          >
                            <TrendingDown className="w-3 h-3 mr-1" />
                            {t.wallet.expenseBtn}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-xl text-xs px-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                            onClick={() => {
                              setTransferForm({
                                fromWalletId: wallet.id,
                                toWalletId: '',
                                amount: '',
                                note: '',
                                date: format(new Date(), 'yyyy-MM-dd'),
                              });
                              setIsTransferOpen(true);
                            }}
                            disabled={wallets.length < 2}
                          >
                            <ArrowLeftRight className="w-3 h-3 mr-1" />
                            {t.wallet.transferBtn}
                          </Button>
                        </div>

                        {/* Expand/Collapse */}
                        {wallet.transactions.length > 0 && (
                          <button
                            onClick={() => toggleExpand(wallet.id)}
                            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors w-full justify-center"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                            {isExpanded
                              ? t.wallet.hideHistory(wallet.transactions.length)
                              : t.wallet.showHistory(wallet.transactions.length)}
                          </button>
                        )}
                      </div>
                    </Card>

                    {/* Transaction History */}
                    {isExpanded && wallet.transactions.length > 0 && (
                      <Card className="p-3 bg-white rounded-2xl shadow-sm">
                        <div className="space-y-2">
                          {wallet.transactions.map((tx) => {
                            const isTransfer = tx.type === 'transfer_out' || tx.type === 'transfer_in';
                            const isPositive = tx.type === 'topup' || tx.type === 'transfer_in';
                            const iconBg = isTransfer ? 'bg-indigo-100' : isPositive ? 'bg-green-100' : 'bg-red-100';
                            const iconColor = isTransfer ? 'text-indigo-600' : isPositive ? 'text-green-600' : 'text-red-600';
                            const amountColor = isPositive ? 'text-green-600' : 'text-red-600';
                            const label = tx.type === 'transfer_out'
                              ? t.wallet.transferOut
                              : tx.type === 'transfer_in'
                              ? t.wallet.transferIn
                              : tx.type === 'wishlist_fund'
                              ? t.wallet.wishlistFund
                              : null;

                            return (
                              <div
                                key={tx.id}
                                className="flex items-center justify-between gap-2 p-2.5 bg-gray-50 rounded-xl"
                              >
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                                    {isTransfer ? (
                                      <ArrowLeftRight className={`w-4 h-4 ${iconColor}`} />
                                    ) : isPositive ? (
                                      <TrendingUp className={`w-4 h-4 ${iconColor}`} />
                                    ) : (
                                      <TrendingDown className={`w-4 h-4 ${iconColor}`} />
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <AmountText
                                      amount={tx.amount}
                                      prefix={isPositive ? '+' : '-'}
                                      className={`text-xs font-semibold ${amountColor}`}
                                    />
                                    {label && <p className="text-xs text-indigo-500">{label}</p>}
                                    {tx.note && <p className="text-xs text-gray-500 truncate">{tx.note}</p>}
                                    <p className="text-xs text-gray-400">
                                      {format(parseISO(tx.date), 'MMM dd, yyyy')}
                                    </p>
                                  </div>
                                </div>
                                {!isTransfer && (
                                  <button
                                    onClick={() => handleDeleteTx(wallet.id, tx.id)}
                                    className="p-1.5 hover:bg-red-100 rounded-md transition-colors flex-shrink-0"
                                    aria-label="Delete transaction"
                                  >
                                    <Trash2 className="w-3 h-3 text-red-400" />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </Card>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Transfer Dialog */}
        <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>{t.wallet.transferTitle}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleTransfer} className="space-y-4">
              <div>
                <Label>{t.wallet.fromWallet}</Label>
                <Select
                  value={transferForm.fromWalletId}
                  onValueChange={(value) => setTransferForm({ ...transferForm, fromWalletId: value, toWalletId: '' })}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {wallets.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {WALLET_ICONS[w.walletType]} {w.name} — Rp {w.currentBalance.toLocaleString('id-ID')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>{t.wallet.toWallet}</Label>
                <Select
                  value={transferForm.toWalletId}
                  onValueChange={(value) => setTransferForm({ ...transferForm, toWalletId: value })}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {wallets
                      .filter((w) => w.id !== transferForm.fromWalletId)
                      .map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          {WALLET_ICONS[w.walletType]} {w.name} — Rp {w.currentBalance.toLocaleString('id-ID')}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>{t.wallet.amount}</Label>
                <Input
                  type="number"
                  placeholder="100000"
                  value={transferForm.amount}
                  onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
                  className="rounded-xl"
                  required
                />
              </div>

              <div>
                <Label>{t.wallet.date}</Label>
                <Input
                  type="date"
                  value={transferForm.date}
                  onChange={(e) => setTransferForm({ ...transferForm, date: e.target.value })}
                  className="rounded-xl"
                  required
                />
              </div>

              <div>
                <Label>{t.wallet.note}</Label>
                <Input
                  placeholder={t.wallet.notePlaceholder}
                  value={transferForm.note}
                  onChange={(e) => setTransferForm({ ...transferForm, note: e.target.value })}
                  className="rounded-xl"
                />
              </div>

              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 rounded-xl">
                <ArrowLeftRight className="w-4 h-4 mr-2" />
                {t.wallet.transferBtn}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Transaction Dialog */}
        <Dialog open={isTxOpen} onOpenChange={setIsTxOpen}>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>
                {txForm.type === 'topup' ? t.wallet.topUpBalance : t.wallet.recordExpense}
              </DialogTitle>
              {selectedWallet && (
                <p className="text-sm text-gray-500">
                  {WALLET_ICONS[selectedWallet.walletType]} {selectedWallet.name}
                </p>
              )}
            </DialogHeader>
            <form onSubmit={handleAddTx} className="space-y-4">
              <div>
                <Label htmlFor="tx-type">{t.wallet.transactionType}</Label>
                <Select
                  value={txForm.type}
                  onValueChange={(value: 'topup' | 'expense') =>
                    setTxForm({ ...txForm, type: value })
                  }
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="topup">
                      <span className="text-green-600">↑ {t.wallet.topup}</span>
                    </SelectItem>
                    <SelectItem value="expense">
                      <span className="text-red-600">↓ {t.wallet.expense}</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="tx-amount">{t.wallet.amount}</Label>
                <Input
                  id="tx-amount"
                  type="number"
                  placeholder="100000"
                  value={txForm.amount}
                  onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })}
                  className="rounded-xl"
                  required
                />
              </div>

              <div>
                <Label htmlFor="tx-date">{t.wallet.date}</Label>
                <Input
                  id="tx-date"
                  type="date"
                  value={txForm.date}
                  onChange={(e) => setTxForm({ ...txForm, date: e.target.value })}
                  className="rounded-xl"
                  required
                />
              </div>

              <div>
                <Label htmlFor="tx-note">{t.wallet.note}</Label>
                <Input
                  id="tx-note"
                  placeholder={t.wallet.notePlaceholder}
                  value={txForm.note}
                  onChange={(e) => setTxForm({ ...txForm, note: e.target.value })}
                  className="rounded-xl"
                />
              </div>

              <Button
                type="submit"
                className={`w-full rounded-xl ${
                  txForm.type === 'topup'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {txForm.type === 'topup' ? t.wallet.topUpBtn : t.wallet.recordExpense}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
};
