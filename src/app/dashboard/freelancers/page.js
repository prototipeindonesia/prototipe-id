'use client';
import { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getPortfolio } from '@/lib/portfolio';
import ChatButton from '@/components/ChatButton';
import {
  Search,
  Briefcase,
  Star,
  Mail,
  CheckCircle,
  X,
  Image as ImageIcon,
} from 'lucide-react';

export default function FreelancersPage() {
  const [freelancers, setFreelancers] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [selectedPortfolio, setSelectedPortfolio] = useState([]);
  const [loadingPortfolio, setLoadingPortfolio] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'freelancer')
    );
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      // Sort by rating desc
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      setFreelancers(list);
    });
    return () => unsub();
  }, []);

  // Buka detail freelancer
  const openDetail = async (f) => {
    setSelected(f);
    setLoadingPortfolio(true);
    try {
      const items = await getPortfolio(f.id);
      setSelectedPortfolio(items);
    } catch (err) {
      console.error(err);
      setSelectedPortfolio([]);
    } finally {
      setLoadingPortfolio(false);
    }
  };

  const filtered = freelancers.filter(
    (f) =>
      !search ||
      f.name?.toLowerCase().includes(search.toLowerCase()) ||
      f.email?.toLowerCase().includes(search.toLowerCase()) ||
      f.skills?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Daftar Freelancer</h1>
        <p className="text-gray-500 text-sm">
          {freelancers.length} freelancer terdaftar
        </p>
      </div>

      {/* Search */}
      <div className="card relative">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          placeholder="Cari nama, email, atau skill..."
          className="input pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((f) => (
          <div key={f.id} className="card">
            <div className="flex items-center gap-3 mb-3">
              {f.avatar ? (
                <img
                  src={f.avatar}
                  alt={f.name}
                  className="w-14 h-14 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0">
                  {f.name?.[0]?.toUpperCase() || '?'}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold truncate">{f.name}</h3>
                {f.tagline && (
                  <p className="text-xs text-blue-600 truncate italic">
                    {f.tagline}
                  </p>
                )}
                <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                  <Mail size={10} /> {f.email}
                </p>
              </div>
            </div>

            {/* Rating & Status */}
            <div className="flex flex-wrap gap-2 mb-3">
              <span
                className={`badge ${
                  f.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {f.status}
              </span>
              {f.rating > 0 && (
                <span className="badge bg-yellow-100 text-yellow-700 flex items-center gap-1">
                  <Star size={10} className="fill-yellow-500 text-yellow-500" />
                  {f.rating} ({f.totalReviews || 0})
                </span>
              )}
            </div>

            {/* Skills */}
            {f.skills && (
              <div className="flex flex-wrap gap-1 mb-3">
                {f.skills
                  .split(',')
                  .slice(0, 3)
                  .map((s, i) => (
                    <span
                      key={i}
                      className="badge bg-gray-100 text-gray-600 text-xs"
                    >
                      {s.trim()}
                    </span>
                  ))}
                {f.skills.split(',').length > 3 && (
                  <span className="text-xs text-gray-400">
                    +{f.skills.split(',').length - 3}
                  </span>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-3 border-t">
              <button
                onClick={() => openDetail(f)}
                className="btn btn-outline text-xs flex-1 justify-center"
              >
                Lihat Portfolio
              </button>
              <ChatButton
                targetUserId={f.id}
                targetName={f.name}
                label="Chat"
                className="btn btn-primary text-xs"
              />
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="card col-span-full text-center py-12">
            <Briefcase size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">
              {search
                ? 'Tidak ada freelancer yang cocok dengan pencarian.'
                : 'Belum ada freelancer terdaftar.'}
            </p>
          </div>
        )}
      </div>

      {/* ============================================ */}
      {/* MODAL DETAIL FREELANCER */}
      {/* ============================================ */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b sticky top-0 bg-white z-10">
              <div className="flex justify-between items-start gap-3">
                <div className="flex items-center gap-3">
                  {selected.avatar ? (
                    <img
                      src={selected.avatar}
                      alt={selected.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-2xl">
                      {selected.name?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-bold">{selected.name}</h2>
                    {selected.tagline && (
                      <p className="text-sm text-blue-600 italic">
                        "{selected.tagline}"
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      {selected.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex gap-3 mt-3">
                {selected.rating > 0 && (
                  <div className="flex items-center gap-1 text-sm">
                    <Star
                      size={16}
                      className="fill-yellow-400 text-yellow-400"
                    />
                    <span className="font-semibold">
                      {selected.rating}
                    </span>
                    <span className="text-gray-500">
                      ({selected.totalReviews || 0} review)
                    </span>
                  </div>
                )}
                <span
                  className={`badge ${
                    selected.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {selected.status}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Bio */}
              {selected.bio && (
                <div>
                  <h3 className="font-semibold mb-2">Tentang</h3>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {selected.bio}
                  </p>
                </div>
              )}

              {/* Skills */}
              {selected.skills && (
                <div>
                  <h3 className="font-semibold mb-2">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {selected.skills.split(',').map((s, i) => (
                      <span
                        key={i}
                        className="badge bg-blue-100 text-blue-700"
                      >
                        {s.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Portfolio */}
              <div>
                <h3 className="font-semibold mb-3">
                  Portfolio ({selectedPortfolio.length})
                </h3>

                {loadingPortfolio && (
                  <p className="text-sm text-gray-500">Memuat portfolio...</p>
                )}

                {!loadingPortfolio && selectedPortfolio.length === 0 && (
                  <div className="text-center py-6 bg-gray-50 rounded-lg">
                    <ImageIcon
                      size={32}
                      className="mx-auto text-gray-300 mb-2"
                    />
                    <p className="text-sm text-gray-500">
                      Freelancer ini belum upload portfolio
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {selectedPortfolio.map((p) => (
                    <div
                      key={p.id}
                      className="rounded-lg overflow-hidden border"
                    >
                      <img
                        src={p.imageUrl}
                        alt={p.title}
                        className="w-full aspect-video object-cover"
                      />
                      <div className="p-2">
                        <p className="text-xs font-medium truncate">
                          {p.title}
                        </p>
                        <p className="text-xs text-gray-400">
                          {p.category}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <ChatButton
                  targetUserId={selected.id}
                  targetName={selected.name}
                  label="Chat Freelancer"
                  className="btn btn-primary flex-1 justify-center"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}