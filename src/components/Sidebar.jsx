'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, ShoppingBag, Users, Briefcase,
  Wallet, User, Settings, FileText, LogOut,
} from 'lucide-react';
import { logoutUser } from '@/lib/auth';

const menuByRole = {
  admin_super: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/orders', label: 'Order', icon: ShoppingBag },
    { href: '/dashboard/freelancers', label: 'Freelancer', icon: Briefcase },
    { href: '/dashboard/finance', label: 'Keuangan', icon: Wallet },
  ],
  admin: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/orders', label: 'Order', icon: ShoppingBag },
    { href: '/dashboard/freelancers', label: 'Freelancer', icon: Briefcase },
  ],
  freelancer: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/job-board', label: 'Job Board', icon: Briefcase },
    { href: '/dashboard/my-orders', label: 'Order Saya', icon: FileText },
    { href: '/dashboard/portfolio', label: 'Portfolio', icon: User },
    { href: '/dashboard/finance', label: 'Keuangan', icon: Wallet },
  ],
};

export default function Sidebar({ role }) {
  const pathname = usePathname();
  const router = useRouter();
  const menus = menuByRole[role] || [];

  const handleLogout = async () => {
    await logoutUser();
    router.push('/login');
  };

  return (
    <aside className="w-64 bg-white border-r min-h-screen p-4 flex flex-col">
      <div className="flex items-center gap-2 px-3 py-4 border-b mb-4">
        <div className="w-8 h-8 bg-blue-600 rounded-lg" />
        <span className="font-bold">Prototipe.id</span>
      </div>

      <nav className="flex-1 space-y-1">
        {menus.map((m) => {
          const active = pathname === m.href;
          const Icon = m.icon;
          return (
            <Link key={m.href} href={m.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition
                ${active ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
              <Icon size={18} /> {m.label}
            </Link>
          );
        })}
      </nav>

      <button onClick={handleLogout}
        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50">
        <LogOut size={18} /> Keluar
      </button>
    </aside>
  );
}
