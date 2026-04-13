import { createBrowserRouter } from 'react-router';
import { RootLayout } from './layouts/RootLayout';
import { Dashboard } from './pages/Dashboard';
import { IncomePage } from './pages/IncomePage';
import { ExpensesPage } from './pages/ExpensesPage';
import { WishlistPage } from './pages/WishlistPage';
import { SavingsPage } from './pages/SavingsPage';
import { WalletPage } from './pages/WalletPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { RequireAuth } from './components/RequireAuth';

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
