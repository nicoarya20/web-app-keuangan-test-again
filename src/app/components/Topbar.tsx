import React from 'react';
import { Menu, Bell, Search, LogOut, User, Eye, EyeOff, TrendingUp, TrendingDown, Wallet, PiggyBank, ListChecks, Receipt } from 'lucide-react';
import { signOut } from '../../lib/auth';
import { useSession } from '../../lib/auth';
import { useNavigate } from 'react-router';
import { useLanguage, useT } from '../context/LanguageContext';
import { useBalanceVisibility } from '../context/BalanceVisibilityContext';
import { useNotifications } from '../context/NotificationContext';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { ScrollArea } from './ui/scroll-area';
import type { Notification } from '../../lib/api';

interface TopbarProps {
  onMenuClick: () => void;
}

function timeAgo(dateStr: string, t: ReturnType<typeof useT>): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return t.notifications.justNow
  const mins = Math.floor(diff / 60)
  if (mins < 60) return t.notifications.minutesAgo(mins)
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return t.notifications.hoursAgo(hrs)
  return t.notifications.daysAgo(Math.floor(hrs / 24))
}

function notifLabel(n: Notification, t: ReturnType<typeof useT>): string {
  const map = t.notifications as Record<string, Record<string, string>>
  const entityMap = map[n.entity]
  const label = entityMap?.[n.action] ?? `${n.entity} ${n.action}`

  const meta = n.meta as Record<string, unknown>
  const parts: string[] = [label]
  if (meta.name) parts.push(`— ${meta.name}`)
  else if (meta.category) parts.push(`— ${meta.category}`)
  else if (meta.goalName) parts.push(`— ${meta.goalName}`)
  if (meta.amount) parts.push(`(Rp ${Number(meta.amount).toLocaleString('id-ID')})`)
  return parts.join(' ')
}

const entityIcon: Record<Notification['entity'], React.ReactNode> = {
  income: <TrendingUp className="w-4 h-4 text-green-500" />,
  expense: <TrendingDown className="w-4 h-4 text-red-500" />,
  wallet: <Wallet className="w-4 h-4 text-blue-500" />,
  saving: <PiggyBank className="w-4 h-4 text-purple-500" />,
  wishlist: <ListChecks className="w-4 h-4 text-yellow-500" />,
  budget: <Receipt className="w-4 h-4 text-orange-500" />,
}

export const Topbar: React.FC<TopbarProps> = ({ onMenuClick }) => {
  const { data: session } = useSession();
  const navigate = useNavigate();
  const { lang, setLang } = useLanguage();
  const t = useT();
  const { isHidden, toggle } = useBalanceVisibility();
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const [open, setOpen] = React.useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('signOut error:', err);
    }
    navigate('/login');
  };

  const handleOpenChange = async (next: boolean) => {
    setOpen(next);
    if (next && unreadCount > 0) {
      await markAllRead();
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-4 py-3 lg:px-6">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search */}
          <div className="hidden sm:flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl w-64 lg:w-96">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={t.topbar.searchPlaceholder}
              className="bg-transparent outline-none text-sm w-full text-gray-700 placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Language Toggle */}
          <div className="flex items-center rounded-lg border border-gray-200 overflow-hidden text-xs font-medium">
            <button
              onClick={() => setLang('id')}
              className={`px-2.5 py-1.5 transition-colors ${
                lang === 'id'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-500 hover:bg-gray-50'
              }`}
            >
              ID
            </button>
            <button
              onClick={() => setLang('en')}
              className={`px-2.5 py-1.5 transition-colors ${
                lang === 'en'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-500 hover:bg-gray-50'
              }`}
            >
              EN
            </button>
          </div>

          <button
            onClick={toggle}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title={isHidden ? 'Tampilkan saldo' : 'Sembunyikan saldo'}
          >
            {isHidden ? (
              <EyeOff className="w-5 h-5 text-gray-600" />
            ) : (
              <Eye className="w-5 h-5 text-gray-600" />
            )}
          </button>

          {/* Notification Bell */}
          <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
                <Bell className="w-5 h-5 text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold leading-none">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <span className="font-semibold text-sm text-gray-800">{t.notifications.title}</span>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllRead()}
                    className="text-xs text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    {t.notifications.markAllRead}
                  </button>
                )}
              </div>
              <ScrollArea className="max-h-80">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-gray-400">
                    {t.notifications.empty}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`flex items-start gap-3 px-4 py-3 transition-colors ${
                          !n.read ? 'bg-indigo-50/60' : 'bg-white'
                        }`}
                      >
                        <div className="mt-0.5 flex-shrink-0">
                          {entityIcon[n.entity]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-700 leading-snug">
                            {notifLabel(n, t)}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {timeAgo(n.createdAt, t)}
                          </p>
                        </div>
                        {!n.read && (
                          <span className="mt-1.5 w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </PopoverContent>
          </Popover>

          {/* User Menu */}
          <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-medium text-gray-700">
                {session?.user?.name || 'User'}
              </span>
              <span className="text-xs text-gray-500">
                {session?.user?.email || ''}
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
              title={t.topbar.logout}
            >
              <LogOut className="w-4 h-4 text-gray-500 group-hover:text-red-600" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
