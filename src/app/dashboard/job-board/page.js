'use client';
import { useEffect, useState, useMemo } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { logActivity } from '@/lib/audit';
import toast from 'react-hot-toast';
import { formatRupiah } from '@/utils/format';
import { Search, SlidersHorizontal } from 'lucide-react';

const CATEGORIES = ['Semua', 'UI/UX', 'Developer', 'Desain Grafis', 'Produk Digital'];
const BUDGET_RANGES = [
  { label: 'Semua', min: 0, max: Infinity },
  { label: '< Rp 500rb', min: 0, max: 500000 },
  { label: 'Rp 500rb - 1jt', min: 500000, max: 1000000 },
  { label: 'Rp 1jt - 5jt', min: 1000000, max: 5000000 },
  { label: '> Rp 5jt', min: 5000000, max: Infinity },
];

export default function JobBoardPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Semua');
  const [budgetIdx, setBudgetIdx] = useState(0);
  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'orders'), where('status', '==', 'open'));
    const unsub = onSnapshot(q, (snap) => {
      setJobs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    const budget = BUDGET_RANGES[budgetIdx];
    return jobs.filter((j) => {
      const matchSearch = !search || j.title?.toLowerCase().includes(search.toLowerCase());
      const matchCat = category === 'Semua' || j.category === category;
      const matchBudget = j.price >= budget.min && j.price <= budget.max;
      return matchSearch && matchCat && matchBudget;
    });
  }, [jobs, search, category, budgetIdx]);

  const takeJob = async (jobId) => {
    try {
      const jobSnap = await getDoc(doc(db, 'orders', jobId));
      const jobData = jobSnap.exists() ? jobSnap.data() : {};

      await updateDoc(doc(db, 'orders', jobId), {
        status: 'in_progress',
        freelancerId: user.uid,
        takenAt: new Date().toISOString(),
      });

      await logActivity({
        action: 'ASSIGN_FREELANCER',
        targetType: 'order',
        targetId: jobId,
        targetName: jobData.title || jobId,
        details: { freelancerId: user.uid },
      });

      toast.success('Order berhasil diambil!');
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Job Board</h1>

      {/* Search & Filter Toggle */}
      <div className="card flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            placeholder="Cari order..."
            className="input pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          onClick={() => setShowFilter(!showFilter)}
          className="btn btn-outline"
        >
          <SlidersHorizontal size={16} /> Filter
        </button>
      </div>

      {/* Panel Filter */}
      {showFilter && (
        <div className="card grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Kategori</label>
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Budget</label>
            <select className="input" value={budgetIdx} onChange={(e) => setBudgetIdx(Number(e.target.value))}>
              {BUDGET_RANGES.map((b, i) => <option key={i} value={i}>{b.label}</option>)}
            </select>
          </div>
        </div>
      )}

      <p className="text-sm text-gray-500">
        Menampilkan {filtered.length} dari {jobs.length} order
      </p>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((j) => (
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
        {filtered.length === 0 && (
          <p className="text-gray-500 col-span-full text-center py-12">
            Tidak ada order yang cocok dengan filter Anda.
          </p>
        )}
      </div>
    </div>
  );
}