'use client';
import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import StatCard from '@/components/StatCard';
import { ShoppingBag, Users, Briefcase, Wallet } from 'lucide-react';

export default function DashboardPage() {
  const { role, user } = useAuth();
  const [stats, setStats] = useState({ orders: 0, freelancers: 0, users: 0 });

  useEffect(() => {
    async function load() {
      try {
        const ordersSnap = await getDocs(collection(db, 'orders'));
        const usersSnap = await getDocs(collection(db, 'users'));
        setStats({
          orders: ordersSnap.size,
          users: usersSnap.size,
          freelancers: usersSnap.docs.filter(d => d.data().role === 'freelancer').length,
        });
      } catch (e) { console.error(e); }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Halo, {user?.email?.split('@')[0]} 👋</h1>
        <p className="text-gray-500 text-sm">
          Selamat datang di dashboard {role?.replace('_', ' ')} Prototipe.id.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Order" value={stats.orders} icon={ShoppingBag} color="primary" />
        <StatCard title="Freelancer" value={stats.freelancers} icon={Briefcase} color="secondary" />
        <StatCard title="Total User" value={stats.users} icon={Users} color="accent" />
        <StatCard title="Pendapatan" value="Rp 0" icon={Wallet} color="primary" />
      </div>
    </div>
  );
}
