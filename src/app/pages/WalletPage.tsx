import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, Wallet as WalletIcon, Trash2, TrendingUp, TrendingDown, ChevronDown, ChevronUp } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { PageTransition } from '../components/PageTransition';

const WALLET_TYPE_CONFIG = {
  cash: { icon: '💰', label: 'Dompet Fisik', color: 'bg-amber-50 border-amber-200' },
  ewallet: { icon: '📱', label: 'E-Wallet', color: 'bg-blue-50 border-blue-200' },
  bank: { icon: '🏦', label: 'Bank', color: 'bg-emerald-50 border-emerald-200' },
};

export const WalletPage: React.FC = () => {
  const { wallets, addWallet, deleteWallet, addWalletTransaction, deleteWalletTransaction } = useFinance();
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isTxOpen, setIsTxOpen] = useState(false);
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');
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
      toast.error('Please fill in all fields');
      return;
    }
    const amount = parseFloat(walletForm.initialBalance);
    if (amount < 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    addWallet({
      name: walletForm.name,
      walletType: walletForm.walletType,
      initialBalance: amount,
    });

    setWalletForm({ name: '', walletType: 'cash', initialBalance: '' });
    setIsWalletOpen(false);
    toast.success(`${walletForm.name} berhasil ditambahkan!`);
  };

  const handleDeleteWallet = (id: string, name: string) => {
    deleteWallet(id);
    toast.success(`${name} berhasil dihapus`);
  };

  const handleOpenTx = (walletId: string) => {
    setSelectedWalletId(walletId);
    setTxForm({ type: 'topup', amount: '', note: '', date: format(new Date(), 'yyyy-MM-dd') });
    setIsTxOpen(true);
  };

  const handleAddTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txForm.amount || parseFloat(txForm.amount) <= 0) {
      toast.error('Please enter a valid amount');
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
      txForm.type === 'topup' ? 'Saldo berhasil ditambahkan!' : 'Pengeluaran berhasil dicatat!'
    );
  };

  const handleDeleteTx = (walletId: string, txId: string) => {
    deleteWalletTransaction(walletId, txId);
    toast.success('Transaksi berhasil dihapus');
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
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Wallet</h1>
            <p className="text-gray-500 mt-1">Kelola saldo dompet Anda</p>
          </div>
          <Dialog open={isWalletOpen} onOpenChange={setIsWalletOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700 rounded-xl">
                <Plus className="w-4 h-4 mr-2" />
                Tambah Dompet
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl">
              <DialogHeader>
                <DialogTitle>Tambah Dompet Baru</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddWallet} className="space-y-4">
                <div>
                  <Label htmlFor="wallet-name">Nama Dompet</Label>
                  <Input
                    id="wallet-name"
                    placeholder="Dompet Fisik, GoPay, BCA, dll."
                    value={walletForm.name}
                    onChange={(e) => setWalletForm({ ...walletForm, name: e.target.value })}
                    className="rounded-xl"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="wallet-type">Tipe</Label>
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
                      <SelectItem value="cash">💰 Dompet Fisik</SelectItem>
                      <SelectItem value="ewallet">📱 E-Wallet</SelectItem>
                      <SelectItem value="bank">🏦 Bank</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="wallet-balance">Saldo Awal (Rp)</Label>
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

                <Button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 rounded-xl"
                >
                  Tambah Dompet
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Total Balance Card */}
        <Card className="p-6 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl shadow-sm text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-indigo-200">Total Saldo</p>
              <p className="text-2xl sm:text-3xl font-bold mt-2 break-words">
                Rp {totalBalance.toLocaleString('id-ID')}
              </p>
              <p className="text-xs text-indigo-300 mt-2">{wallets.length} dompet aktif</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <WalletIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        {/* Wallet Cards */}
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Dompet Anda</h2>
          {wallets.length === 0 ? (
            <Card className="p-8 bg-white rounded-2xl shadow-sm">
              <p className="text-center text-gray-400">
                Belum ada dompet. Tambahkan dompet pertama Anda!
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {wallets.map((wallet) => {
                const config = WALLET_TYPE_CONFIG[wallet.walletType];
                const isExpanded = expandedWallets.has(wallet.id);
                const totalTopup = wallet.transactions
                  .filter((t) => t.type === 'topup')
                  .reduce((sum, t) => sum + t.amount, 0);
                const totalExpense = wallet.transactions
                  .filter((t) => t.type === 'expense')
                  .reduce((sum, t) => sum + t.amount, 0);

                return (
                  <div key={wallet.id} className="space-y-3">
                    <Card
                      className={`p-4 sm:p-5 rounded-2xl shadow-sm border ${config.color} hover:shadow-md transition-shadow`}
                    >
                      <div className="space-y-4">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{config.icon}</span>
                              <h3 className="font-semibold text-gray-900 truncate">{wallet.name}</h3>
                            </div>
                            <span className="inline-block px-2 py-0.5 text-xs rounded-full mt-1 bg-white/80 text-gray-600 border border-gray-200">
                              {config.label}
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
                          <p className="text-xs text-gray-600">Saldo Saat Ini</p>
                          <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1 break-words">
                            Rp {wallet.currentBalance.toLocaleString('id-ID')}
                          </p>
                        </div>

                        {/* Summary */}
                        <div className="flex items-center gap-4 text-xs">
                          <div className="flex items-center gap-1 text-green-600">
                            <TrendingUp className="w-3 h-3" />
                            <span>+Rp {totalTopup.toLocaleString('id-ID')}</span>
                          </div>
                          <div className="flex items-center gap-1 text-red-600">
                            <TrendingDown className="w-3 h-3" />
                            <span>-Rp {totalExpense.toLocaleString('id-ID')}</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1 bg-green-600 hover:bg-green-700 rounded-xl text-xs"
                            onClick={() => {
                              setSelectedWalletId(wallet.id);
                              setTxForm({
                                type: 'topup',
                                amount: '',
                                note: '',
                                date: format(new Date(), 'yyyy-MM-dd'),
                              });
                              setIsTxOpen(true);
                            }}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Top Up
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 rounded-xl text-xs"
                            onClick={() => {
                              setSelectedWalletId(wallet.id);
                              setTxForm({
                                type: 'expense',
                                amount: '',
                                note: '',
                                date: format(new Date(), 'yyyy-MM-dd'),
                              });
                              setIsTxOpen(true);
                            }}
                          >
                            <TrendingDown className="w-3 h-3 mr-1" />
                            Expense
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
                            {isExpanded ? 'Sembunyikan' : 'Lihat'} riwayat ({wallet.transactions.length})
                          </button>
                        )}
                      </div>
                    </Card>

                    {/* Transaction History */}
                    {isExpanded && wallet.transactions.length > 0 && (
                      <Card className="p-3 bg-white rounded-2xl shadow-sm">
                        <div className="space-y-2">
                          {wallet.transactions.map((tx) => (
                            <div
                              key={tx.id}
                              className="flex items-center justify-between gap-2 p-2.5 bg-gray-50 rounded-xl"
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <div
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                    tx.type === 'topup' ? 'bg-green-100' : 'bg-red-100'
                                  }`}
                                >
                                  {tx.type === 'topup' ? (
                                    <TrendingUp className="w-4 h-4 text-green-600" />
                                  ) : (
                                    <TrendingDown className="w-4 h-4 text-red-600" />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p
                                    className={`text-xs font-semibold ${
                                      tx.type === 'topup' ? 'text-green-600' : 'text-red-600'
                                    }`}
                                  >
                                    {tx.type === 'topup' ? '+' : '-'}Rp {tx.amount.toLocaleString('id-ID')}
                                  </p>
                                  {tx.note && (
                                    <p className="text-xs text-gray-500 truncate">{tx.note}</p>
                                  )}
                                  <p className="text-xs text-gray-400">
                                    {format(parseISO(tx.date), 'MMM dd, yyyy')}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleDeleteTx(wallet.id, tx.id)}
                                className="p-1.5 hover:bg-red-100 rounded-md transition-colors flex-shrink-0"
                                aria-label="Delete transaction"
                              >
                                <Trash2 className="w-3 h-3 text-red-400" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Transaction Dialog */}
        <Dialog open={isTxOpen} onOpenChange={setIsTxOpen}>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>
                {txForm.type === 'topup' ? 'Top Up Saldo' : 'Catat Pengeluaran'}
              </DialogTitle>
              {selectedWallet && (
                <p className="text-sm text-gray-500">
                  {WALLET_TYPE_CONFIG[selectedWallet.walletType].icon} {selectedWallet.name}
                </p>
              )}
            </DialogHeader>
            <form onSubmit={handleAddTx} className="space-y-4">
              <div>
                <Label htmlFor="tx-type">Tipe Transaksi</Label>
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
                      <span className="text-green-600">↑ Top Up (Tambah Saldo)</span>
                    </SelectItem>
                    <SelectItem value="expense">
                      <span className="text-red-600">↓ Expense (Kurangi Saldo)</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="tx-amount">Jumlah (Rp)</Label>
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
                <Label htmlFor="tx-date">Tanggal</Label>
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
                <Label htmlFor="tx-note">Catatan (Opsional)</Label>
                <Input
                  id="tx-note"
                  placeholder="Top up dari ATM, Bayar makan siang, dll."
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
                {txForm.type === 'topup' ? 'Top Up' : 'Catat Pengeluaran'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
};
