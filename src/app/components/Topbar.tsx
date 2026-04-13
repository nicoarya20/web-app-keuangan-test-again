import React from 'react';
import { Menu, Bell, Search, LogOut, User } from 'lucide-react';
import { signOut } from '../../lib/auth';
import { useSession } from '../../lib/auth';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';

interface TopbarProps {
  onMenuClick: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onMenuClick }) => {
  const { data: session } = useSession();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    toast.success('Logged out successfully');
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
              placeholder="Search transactions..."
              className="bg-transparent outline-none text-sm w-full text-gray-700 placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
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
              title="Logout"
            >
              <LogOut className="w-4 h-4 text-gray-500 group-hover:text-red-600" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
