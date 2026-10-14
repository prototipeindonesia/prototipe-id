'use client';
import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function FreelancersPage() {
  const [freelancers, setFreelancers] = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'freelancer'));
    const unsub = onSnapshot(q, (snap) => {
      setFreelancers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Daftar Freelancer</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {freelancers.map((f) => (
          <div key={f.id} className="card">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mb-3">
              {f.name?.[0]?.toUpperCase() || '?'}
            </div>
            <h3 className="font-semibold">{f.name}</h3>
            <p className="text-sm text-gray-500">{f.email}</p>
            <span className="badge bg-green-100 text-green-600 mt-2">{f.status}</span>
          </div>
        ))}
        {freelancers.length === 0 && <p className="text-gray-500">Belum ada freelancer.</p>}
      </div>
    </div>
  );
}
