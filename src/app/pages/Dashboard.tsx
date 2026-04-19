import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { api, DashboardData, CashflowDay } from '../../lib/api';
import { Card } from '../components/ui/card';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { format, parseISO } from 'date-fns';
import { PageTransition } from '../components/PageTransition';

export const Dashboard: React.FC = () => {
  const { categoryBudgets, userId } = useFinance();
  const [data, setData] = useState<DashboardData | null>(null);
  const [cashflow, setCashflow] = useState<CashflowDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    async function fetchDashboard() {
      try {
        setLoading(true);
        const [dashRes, cashRes] = await Promise.all([
          api.dashboard.get(),
          api.dashboard.cashflow(),
        ]);

        if (cancelled) return;
        setData(dashRes);
        setCashflow(cashRes);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchDashboard();
    return () => { cancelled = true; };
  }, [userId]);

  if (loading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="h-[80vh] flex items-center justify-center text-red-500">
        <AlertCircle className="w-6 h-6 mr-2" />
        {error || 'Dashboard data not available'}
      </div>
    );
  }

  const { stats, expensesByCategory, recentTransactions } = data;

  const pieData = expensesByCategory.map((c) => ({
    name: c.category,
    value: c.total,
  }));

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];

  // Check budget warnings
  const budgetWarnings = expensesByCategory.filter((c) => {
    const budget = categoryBudgets[c.category];
    return budget && c.total > budget * 0.8;
  });

  const highestCategory = expensesByCategory[0];

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back! Here's your financial overview.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 bg-white rounded-2xl shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Balance</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1 break-words">
                  Rp {stats.totalWalletBalance.toLocaleString('id-ID')}
                </p>
                <p className="text-xs text-gray-500 mt-2">{stats.activeWallets} dompet aktif</p>
              </div>
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                <Wallet className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-white rounded-2xl shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Income</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1 break-words">
                  Rp {stats.totalIncome.toLocaleString('id-ID')}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <ArrowUpRight className="w-3 h-3 text-green-600" />
                  <span className="text-xs text-green-600">+12.5%</span>
                </div>
              </div>
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-white rounded-2xl shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Expenses</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1 break-words">
                  Rp {stats.totalExpense.toLocaleString('id-ID')}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <ArrowDownRight className="w-3 h-3 text-red-600" />
                  <span className="text-xs text-red-600">+8.2%</span>
                </div>
              </div>
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-white rounded-2xl shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600">Saving Rate</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{stats.savingRate}%</p>
                <p className="text-xs text-gray-500 mt-2">Of income</p>
              </div>
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                <PiggyBank className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Insights */}
        {(highestCategory || budgetWarnings.length > 0) && (
          <Card className="p-4 sm:p-5 bg-amber-50 border-amber-200 rounded-2xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-amber-900">Quick Insights</h3>
                <ul className="mt-2 space-y-1 text-sm text-amber-800">
                  {highestCategory && (
                    <li className="break-words">
                      • Spending tertinggi di kategori <strong>{highestCategory.category}</strong> (Rp{' '}
                      {highestCategory.total.toLocaleString('id-ID')})
                    </li>
                  )}
                  {budgetWarnings.map((c) => (
                    <li key={c.category} className="break-words">
                      • Budget kategori <strong>{c.category}</strong> sudah mencapai 80%!
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Expense by Category */}
          <Card className="p-6 bg-white rounded-2xl shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Expenses by Category</h3>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `Rp ${value.toLocaleString('id-ID')}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                No expense data yet
              </div>
            )}
          </Card>

          {/* Cashflow Chart */}
          <Card className="p-6 bg-white rounded-2xl shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cashflow (Last 7 Days)</h3>
            {cashflow.some((d) => d.income > 0 || d.expense > 0) ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={cashflow}>
                  <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                  <Tooltip formatter={(value: number) => `Rp ${value.toLocaleString('id-ID')}`} />
                  <Legend />
                  <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} />
                  <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                No transaction data yet
              </div>
            )}
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card className="p-6 bg-white rounded-2xl shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
          <div className="space-y-3">
            {recentTransactions.map((transaction) => {
              const isIncome = transaction.type === 'income';
              return (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-xl"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isIncome ? 'bg-green-50' : 'bg-red-50'
                      }`}
                    >
                      {isIncome ? (
                        <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate">{transaction.category}</p>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {format(parseISO(transaction.date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                  <p
                    className={`font-semibold text-sm sm:text-base ${
                      isIncome ? 'text-green-600' : 'text-red-600'
                    } whitespace-nowrap`}
                  >
                    {isIncome ? '+' : '-'}Rp {transaction.amount.toLocaleString('id-ID')}
                  </p>
                </div>
              );
            })}
            {recentTransactions.length === 0 && (
              <p className="text-center text-gray-400 py-8">No transactions yet</p>
            )}
          </div>
        </Card>
      </div>
    </PageTransition>
  );
};