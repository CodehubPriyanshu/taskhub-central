import { ReactNode } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import Sidebar from './Sidebar';

const AdminLayout = ({ children }: { children?: ReactNode }) => {
  const { isAuthenticated, role, isLoading } = useAuthContext();

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated || role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {children || <Outlet />}
      </main>
    </div>
  );
};

export default AdminLayout;