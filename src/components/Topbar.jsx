'use client';
import { useAuth } from '@/context/AuthContext';

export default function Topbar() {
  const { user, role } = useAuth();
  return (
    <header className="bg-white border-b h-16 px-6 flex items-center justify-between">
      <div>
        <h2 className="font-semibold text-lg">Dashboard</h2>
        <p className="text-xs text-gray-500 capitalize">Role: {role?.replace('_', ' ')}</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
          {user?.email?.[0]?.toUpperCase()}
        </div>
      </div>
    </header>
  );
}
