import { createBrowserRouter } from 'react-router';
import { RootLayout } from './layouts/RootLayout';
import { Dashboard } from './pages/Dashboard';
import { IncomePage } from './pages/IncomePage';
import { ExpensesPage } from './pages/ExpensesPage';
import { WishlistPage } from './pages/WishlistPage';
import { SavingsPage } from './pages/SavingsPage';
import { WalletPage } from './pages/WalletPage';
import LoginPage from './pages/LoginPage';
import { RequireAuth } from './components/RequireAuth';
import { SettingsPage } from './pages/SettingsPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    Component: LoginPage,
  },
  {
    path: '/',
    element: <RequireAuth><RootLayout /></RequireAuth>,
    children: [
      {
        index: true,
        element: <Dashboard />
      },
      {
        path: 'income',
        element: <IncomePage />
      },
      {
        path: 'expenses',
        element: <ExpensesPage />
      },
      {
        path: 'wishlist',
        element: <WishlistPage />
      },
      {
        path: 'savings',
        element: <SavingsPage />
      },
      {
        path: 'wallet',
        element: <WalletPage />
      },
      {
        path: 'settings',
        element: <SettingsPage />
      },
    ],
  },
]);
