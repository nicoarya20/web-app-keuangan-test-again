import { createBrowserRouter } from 'react-router';
import { useSession } from '../lib/auth';
import { RootLayout } from './layouts/RootLayout';
import { Dashboard } from './pages/Dashboard';
import { IncomePage } from './pages/IncomePage';
import { ExpensesPage } from './pages/ExpensesPage';
import { WishlistPage } from './pages/WishlistPage';
import { SavingsPage } from './pages/SavingsPage';
import { WalletPage } from './pages/WalletPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Auth guard for protected routes
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  
  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (!session) {
    window.location.href = '/login';
    return null;
  }
  
  return children;
}

export const router = createBrowserRouter([
  {
    path: '/login',
    Component: LoginPage,
  },
  {
    path: '/register',
    Component: RegisterPage,
  },
  {
    path: '/',
    Component: RootLayout,
    children: [
      { 
        index: true, 
        element: <RequireAuth><Dashboard /></RequireAuth>
      },
      { 
        path: 'income', 
        element: <RequireAuth><IncomePage /></RequireAuth>
      },
      { 
        path: 'expenses', 
        element: <RequireAuth><ExpensesPage /></RequireAuth>
      },
      { 
        path: 'wishlist', 
        element: <RequireAuth><WishlistPage /></RequireAuth>
      },
      { 
        path: 'savings', 
        element: <RequireAuth><SavingsPage /></RequireAuth>
      },
      { 
        path: 'wallet', 
        element: <RequireAuth><WalletPage /></RequireAuth>
      },
    ],
  },
]);
