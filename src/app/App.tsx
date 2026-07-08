import { RouterProvider } from 'react-router';
import { router } from './routes.tsx';
import { FinanceProvider } from './context/FinanceContext';
import { LanguageProvider } from './context/LanguageContext';
import { BalanceVisibilityProvider } from './context/BalanceVisibilityContext';
import { useSession } from '../lib/auth';
import { Toaster } from './components/ui/sonner';

export default function App() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400" />
      </div>
    );
  }

  return (
    <LanguageProvider>
      <BalanceVisibilityProvider>
        <FinanceProvider session={session}>
          <RouterProvider router={router} />
          <Toaster position="top-right" />
        </FinanceProvider>
      </BalanceVisibilityProvider>
    </LanguageProvider>
  );
}
