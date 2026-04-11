import { RouterProvider } from 'react-router';
import { router } from './routes';
import { FinanceProvider } from './context/FinanceContext';
import { Toaster } from './components/ui/sonner';

export default function App() {
  return (
    <FinanceProvider>
      <RouterProvider router={router} />
      <Toaster position="top-right" />
    </FinanceProvider>
  );
}
