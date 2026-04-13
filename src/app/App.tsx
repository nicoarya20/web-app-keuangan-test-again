import { RouterProvider } from 'react-router';
import { router } from './routes';
import { FinanceProvider } from './context/FinanceContext';
import { useSession } from '../lib/auth';
import { Toaster } from './components/ui/sonner';

function AuthenticatedApp() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  return (
    <FinanceProvider session={session}>
      <RouterProvider router={router} />
      <Toaster position="top-right" />
    </FinanceProvider>
  );
}

export default function App() {
  return <AuthenticatedApp />;
}
