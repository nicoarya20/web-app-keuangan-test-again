import { RouterProvider } from 'react-router';
import { router } from './routes.tsx';
import { FinanceProvider } from './context/FinanceContext';
import { useSession } from '../lib/auth';
import { Toaster } from './components/ui/sonner';

export default function App() {
  const { data: session } = useSession();

  return (
    <FinanceProvider session={session}>
      <RouterProvider router={router} />
      <Toaster position="top-right" />
    </FinanceProvider>
  );
}
