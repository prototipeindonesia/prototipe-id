'use client';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';

export default function DashboardLayout({ children }) {
  const { role } = useAuth();

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen">
        <Sidebar role={role} />
        <div className="flex-1 flex flex-col">
          <Topbar />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
