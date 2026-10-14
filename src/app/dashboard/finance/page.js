'use client';
import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { formatRupiah } from '@/utils/format';

export default function FinancePage() {
  const { user, role } = useAuth();
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    if (!user) return;
    const ref = collection(db, 'transactions');
    const q = role === 'freelancer'
      ? query(ref, where('freelancerId', '==', user.uid))
      : ref;
    const unsub = onSnapshot(q, (snap) => {
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user, role]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Keuangan</h1>
      <div className="card">
        <h3 className="font-semibold mb-3">Riwayat Transaksi</h3>
        {transactions.length === 0 && <p className="text-gray-500 text-sm">Belum ada transaksi.</p>}
        <div className="divide-y">
          {transactions.map((t) => (
            <div key={t.id} className="py-3 flex justify-between">
              <p className="font-medium">{t.description || 'Transaksi'}</p>
              <p className="font-bold text-blue-600">{formatRupiah(t.amount || 0)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
