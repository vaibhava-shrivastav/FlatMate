import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import SessionLoader from './SessionLoader';

export default function GuestRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <SessionLoader />;

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}
