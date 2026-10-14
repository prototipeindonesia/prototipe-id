'use client';
import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { formatRupiah } from '@/utils/format';

export default function JobBoardPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'orders'), where('status', '==', 'open'));
    const unsub = onSnapshot(q, (snap) => {
      setJobs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const takeJob = async (jobId) => {
    try {
      await updateDoc(doc(db, 'orders', jobId), {
        status: 'in_progress',
        freelancerId: user.uid,
        takenAt: new Date().toISOString(),
      });
      toast.success('Order berhasil diambil!');
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Job Board</h1>
      <p className="text-gray-500 text-sm">Pilih order yang sesuai keahlianmu.</p>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {jobs.map((j) => (
          <div key={j.id} className="card flex flex-col">
            <h3 className="font-semibold mb-1">{j.title}</h3>
            <p className="text-sm text-gray-500 mb-2">{j.category}</p>
            <p className="font-bold text-blue-600 mb-3">{formatRupiah(j.price)}</p>
            <p className="text-xs text-gray-400 mb-4">Deadline: {j.deadline}</p>
            <button onClick={() => takeJob(j.id)} className="btn btn-primary mt-auto justify-center">
              Ambil Order
            </button>
          </div>
        ))}
        {jobs.length === 0 && <p className="text-gray-500">Belum ada order tersedia.</p>}
      </div>
    </div>
  );
}
