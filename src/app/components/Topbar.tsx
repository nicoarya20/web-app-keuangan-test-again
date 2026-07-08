import React from 'react';
import { Menu, Bell, Search, LogOut, User, Eye, EyeOff } from 'lucide-react';
import { signOut } from '../../lib/auth';
import { useSession } from '../../lib/auth';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';
import { useLanguage, useT } from '../context/LanguageContext';
import { useBalanceVisibility } from '../context/BalanceVisibilityContext';

interface TopbarProps {
  onMenuClick: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onMenuClick }) => {
  const { data: session } = useSession();
  const navigate = useNavigate();
  const { lang, setLang } = useLanguage();
  const t = useT();
  const { isHidden, toggle } = useBalanceVisibility();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('signOut error:', err);
    }
    navigate('/login');
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

          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

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
