'use client';
import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import CloudinaryUpload from '@/components/CloudinaryUpload';
import { formatRupiah } from '@/utils/format';

export default function MyOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'orders'), where('freelancerId', '==', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Order Saya</h1>

      {orders.map((o) => (
        <div key={o.id} className="card">
          <div className="flex justify-between mb-2">
            <h3 className="font-semibold">{o.title}</h3>
            <span className="badge bg-blue-100 text-blue-600">{o.status}</span>
          </div>
          <p className="text-sm text-gray-500 mb-4">{o.category} • {formatRupiah(o.price)}</p>
          <CloudinaryUpload orderId={o.id} label="Upload Hasil Kerja" />
        </div>
      ))}
      {orders.length === 0 && <p className="text-gray-500">Belum ada order.</p>}
    </div>
  );
}
