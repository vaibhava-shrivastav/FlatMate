import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@context/AuthContext';
import AppRouter from '@/router/AppRouter';
import ErrorBoundary from '@components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
